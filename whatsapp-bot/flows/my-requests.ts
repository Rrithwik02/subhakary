import type { WhatsappRequestRecord } from "../types/request.ts";

export function renderMyRequests(requests: WhatsappRequestRecord[]) {
  return {
    text: requests.length
      ? requests.map((request) => `${request.request_code}\n${request.service_category_name ?? request.request_type}\n${request.status}`).join("\n\n")
      : "You do not have any requests yet.",
  };
}

