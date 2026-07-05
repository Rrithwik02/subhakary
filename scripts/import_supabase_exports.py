from __future__ import annotations

import csv
import json
import os
import sys
import time
from pathlib import Path
from typing import Any
from urllib import request, error


EXPORT_DIR = Path(r"D:\Myfolder\database - subhakary")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
BATCH_SIZE = int(os.environ.get("IMPORT_BATCH_SIZE", "50"))
START_AFTER_TABLE = os.environ.get("IMPORT_START_AFTER_TABLE", "").strip()


TABLE_FILES: list[tuple[str, str]] = [
    ("service_categories", "service_categories-export-2026-07-05_16-47-26.csv"),
    ("profiles", "profiles-export-2026-07-05_16-44-34.csv"),
    ("user_roles", "user_roles-export-2026-07-05_16-49-21.csv"),
    ("service_providers", "service_providers-export-2026-07-05_16-48-22.csv"),
    ("provider_documents", "provider_documents-export-2026-07-05_16-45-13.csv"),
    ("wedding_events", "wedding_events-export-2026-07-05_16-49-42.csv"),
    ("wedding_preferences", "wedding_preferences-export-2026-07-05_16-49-53.csv"),
    ("service_provider_availability", "service_provider_availability-export-2026-07-05_16-47-44.csv"),
    ("additional_services", "additional_services-export-2026-07-05_16-40-29.csv"),
    ("service_bundles", "service_bundles-export-2026-07-05_16-47-10.csv"),
    ("bookings", "bookings-export-2026-07-05_16-41-21.csv"),
    ("booking_completion_details", "booking_completion_details-export-2026-07-05_16-41-09.csv"),
    ("payments", "payments-export-2026-07-05_16-43-30.csv"),
    ("reviews", "reviews-export-2026-07-05_16-45-58.csv"),
    ("notifications", "notifications-export-2026-07-05_16-43-11.csv"),
    ("contact_submissions", "contact_submissions-export-2026-07-05_16-41-37.csv"),
    ("email_otp_codes", "email_otp_codes-export-2026-07-05_16-41-56.csv"),
    ("favorites", "favorites-export-2026-07-05_16-42-08.csv"),
    ("inquiry_conversations", "inquiry_conversations-export-2026-07-05_16-42-25.csv"),
    ("inquiry_messages", "inquiry_messages-export-2026-07-05_16-42-38.csv"),
    ("newsletter_subscriptions", "newsletter_subscriptions-export-2026-07-05_16-42-52.csv"),
    ("security_audit_log", "security_audit_log-export-2026-07-05_16-46-47.csv"),
    ("support_tickets", "support_tickets-export-2026-07-05_16-49-07.csv"),
    ("support_ticket_messages", "support_ticket_messages-export-2026-07-05_16-48-42.csv"),
]


SKIP_FILES = {
    "public_service_providers-export-2026-07-05_16-45-40.csv",
}


DROP_COLUMNS: dict[str, set[str]] = {
    "additional_services": {
        "category_id",
        "verification_status",
        "verified_at",
        "verified_by",
    },
    "service_bundles": {
        "inclusions",
        "exclusions",
        "extra_charges",
    },
    "bookings": {
        "completion_requested_at",
        "auto_complete_at",
        "event_id",
    },
    "reviews": {
        "photos",
        "service_quality_rating",
        "communication_rating",
        "value_for_money_rating",
        "punctuality_rating",
        "wedding_budget_range",
        "wedding_size",
    }
}


def parse_cell(raw: str) -> Any:
    if raw is None:
        return None
    text = raw.strip()
    if text == "":
        return None
    lowered = text.lower()
    if lowered == "true":
        return True
    if lowered == "false":
        return False
    if text[0] in "[{":
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass
    return text


def read_csv_rows(table: str, path: Path) -> list[dict[str, Any]]:
    with path.open("r", encoding="utf-8-sig", newline="") as fh:
        reader = csv.DictReader(fh, delimiter=";")
        rows: list[dict[str, Any]] = []
        for row in reader:
            dropped = DROP_COLUMNS.get(table, set())
            rows.append(
                {
                    key: parse_cell(value)
                    for key, value in row.items()
                    if key not in dropped
                }
            )
        return rows


def post_json(path: str, payload: Any) -> str:
    body = json.dumps(payload).encode("utf-8")
    req = request.Request(
        f"{SUPABASE_URL}/rest/v1/{path}",
        data=body,
        method="POST",
        headers={
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        },
    )
    try:
        with request.urlopen(req, timeout=120) as resp:
            return resp.read().decode("utf-8")
    except error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {exc.code} for {path}: {detail}") from exc


def chunked(values: list[dict[str, Any]], size: int) -> list[list[dict[str, Any]]]:
    return [values[i : i + size] for i in range(0, len(values), size)]


def main() -> int:
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        print("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first.", file=sys.stderr)
        return 2

    if not EXPORT_DIR.exists():
        print(f"Export directory not found: {EXPORT_DIR}", file=sys.stderr)
        return 2

    imported: list[tuple[str, int]] = []
    starting = not START_AFTER_TABLE

    for table, filename in TABLE_FILES:
        if not starting:
            if table != START_AFTER_TABLE:
                print(f"Skipping already imported table: {table}")
                continue
            starting = True

        csv_path = EXPORT_DIR / filename
        if not csv_path.exists():
            print(f"Skipping missing export: {filename}")
            continue

        rows = read_csv_rows(table, csv_path)
        if not rows:
            print(f"{table}: no rows")
            imported.append((table, 0))
            continue

        print(f"{table}: importing {len(rows)} rows")
        for batch in chunked(rows, BATCH_SIZE):
            post_json(table, batch)
            time.sleep(0.1)
        imported.append((table, len(rows)))

    print("\nImported rows:")
    for table, count in imported:
        print(f"{table}: {count}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
