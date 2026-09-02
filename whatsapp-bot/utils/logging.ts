type LogLevel = "info" | "warn" | "error" | "debug";

function write(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const payload = meta ? { message, ...meta } : { message };
  console[level](`[whatsapp-bot] ${message}`, payload);
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

