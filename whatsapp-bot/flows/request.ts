import type { WhatsappRequestRecord } from "../types/request.ts";
import { formatRequestSummary } from "../utils/formatting.ts";

export function renderRequestReview(request: WhatsappRequestRecord) {
  return {
    text: formatRequestSummary(request),
    confirmLabel: "Submit Request",
  };
}

