type LogLevel = "info" | "warn" | "error" | "debug";

function write(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const payload = meta ? { message, ...redact(meta) } : { message };
  console[level](`[whatsapp-bot] ${message}`, payload);
}

const SENSITIVE_KEY = /(authorization|access.?token|app.?secret|webhook.?secret|verify.?token|raw.?payload|response.?body)/i;

function redact(meta: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(meta).map(([key, value]) => [
    key,
    SENSITIVE_KEY.test(key) ? "[REDACTED]" : value,
  ]));
}

export const logger = {
  info(message: string, meta?: Record<string, unknown>) {
    write("info", message, meta);
  },
  warn(message: string, meta?: Record<string, unknown>) {
    write("warn", message, meta);
  },
  error(message: string, meta?: Record<string, unknown>) {
    write("error", message, meta);
  },
  debug(message: string, meta?: Record<string, unknown>) {
    write("debug", message, meta);
  },
};
