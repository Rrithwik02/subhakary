export type WhatsappInteractiveButton = {
  type: "button";
  button_reply: {
    id: string;
    title: string;
  };
};

export type WhatsappInteractiveList = {
  type: "list";
  list_reply: {
    id: string;
    title: string;
    description?: string;
  };
};

export type WhatsappInteractivePayload =
  | WhatsappInteractiveButton
  | WhatsappInteractiveList;

export type WhatsappIncomingMessage = {
  messageId: string;
  from: string;
  name?: string | null;
  timestamp: string;
  text?: string | null;
  buttonId?: string | null;
  listId?: string | null;
  raw: unknown;
};

export type WhatsappWebhookEnvelope = {
  object?: string;
  entry?: Array<{
    id?: string;
    changes?: Array<{
      value?: {
        messages?: Array<{
          id: string;
          from: string;
          timestamp?: string;
          text?: { body?: string };
          type?: string;
          interactive?: { type?: string; button_reply?: { id?: string }; list_reply?: { id?: string } };
        }>;
        contacts?: Array<{ wa_id?: string; profile?: { name?: string } }>;
        statuses?: Array<{ id?: string; status?: string }>;
      };
    }>;
  }>;
};
