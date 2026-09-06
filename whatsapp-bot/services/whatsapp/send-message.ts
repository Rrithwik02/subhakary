import { isApprovedMediaUrl } from "../../utils/security.ts";

type WhatsAppSendPayload = {
  to: string;
  type?: "text" | "image" | "interactive";
  text?: { body: string };
  image?: { link: string; caption?: string };
  messaging_product?: "whatsapp";
  recipient_type?: "individual";
  interactive?: Record<string, unknown>;
};

export async function sendWhatsAppMessage(payload: {
  to: string;
  text?: string;
  imageUrl?: string | null;
  caption?: string;
  interactive?: Record<string, unknown> | null;
}) {
  const accessToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
  const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");

  if (!accessToken || !phoneNumberId) {
    return { ok: false, skipped: true, error: "WhatsApp API credentials are not configured" };
  }

  const body: WhatsAppSendPayload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: payload.to,
  };

  if (payload.interactive) {
    body.type = "interactive";
    body.interactive = payload.interactive;
  } else if (payload.imageUrl && isApprovedMediaUrl(payload.imageUrl)) {
    body.type = "image";
    body.image = { link: payload.imageUrl, caption: payload.caption };
  } else {
    body.type = "text";
    body.text = { body: payload.text ?? "" };
  }

  const response = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const responseText = await response.text();
  let messageId: string | undefined;
  if (response.ok) {
    try {
      messageId = JSON.parse(responseText)?.messages?.[0]?.id;
    } catch {
      messageId = undefined;
    }
  }
  return {
    ok: response.ok,
    status: response.status,
    messageId,
    error: response.ok ? undefined : "WhatsApp API request failed",
  };
}
