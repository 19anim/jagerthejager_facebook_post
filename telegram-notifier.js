import axios from "axios";

export class TelegramNotifier {
  constructor(botToken, chatId) {
    this.botToken = botToken;
    this.chatId = chatId;
    this.apiUrl = `https://api.telegram.org/bot${botToken}`;
  }

  async sendMessage(text) {
    if (!this.botToken || !this.chatId) {
      console.warn("⚠️ Telegram bot token hoặc chat ID không được cấu hình");
      return;
    }
    try {
      await axios.post(`${this.apiUrl}/sendMessage`, {
        chat_id: this.chatId,
        text,
        parse_mode: "HTML",
      });
    } catch (err) {
      console.warn(`⚠️ Lỗi gửi Telegram: ${err.message}`);
    }
  }

  async notifySuccess(timeSlot, productName) {
    const msg = `✅ <b>Đăng bài thành công</b>\n<b>Ca:</b> ${timeSlot}\n<b>Sản phẩm:</b> ${productName}`;
    await this.sendMessage(msg);
  }

  async notifyFailure(timeSlot, productName, error) {
    const msg = `❌ <b>Đăng bài thất bại</b>\n<b>Ca:</b> ${timeSlot}\n<b>Sản phẩm:</b> ${productName}\n<b>Lỗi:</b> ${error}`;
    await this.sendMessage(msg);
  }

  async notifyStepFailure(step, timeSlot, error) {
    const msg = `⚠️ <b>Bước ${step} thất bại</b>\n<b>Ca:</b> ${timeSlot}\n<b>Lỗi:</b> ${error}`;
    await this.sendMessage(msg);
  }

  async notifyPartialSuccess(timeSlot, productName, pages) {
    const failed = pages
      .filter((p) => p.error)
      .map((p) => `Page ${p.page}`)
      .join(", ");
    const msg = `⚠️ <b>Đăng bài một phần thành công</b>\n<b>Ca:</b> ${timeSlot}\n<b>Sản phẩm:</b> ${productName}\n<b>Thất bại:</b> ${failed}`;
    await this.sendMessage(msg);
  }
}

export function createNotifier() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  return new TelegramNotifier(token, chatId);
}
