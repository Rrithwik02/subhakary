import { MESSAGES } from "../config/messages.ts";
import { BOT_CONFIG } from "../config/bot-config.ts";

export function renderWelcomeFlow() {
  return {
    text: MESSAGES.welcome,
    menu: BOT_CONFIG.mainMenu,
  };
}

