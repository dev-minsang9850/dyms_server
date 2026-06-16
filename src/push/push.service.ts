import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface PushMessage {
  to: string | string[];
  sound?: 'default' | null;
  title?: string;
  body?: string;
  data?: Record<string, any>;
}

@Injectable()
export class PushService {
  private readonly logger = new Logger('PushService');
  private readonly EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

  async sendPushNotification(messages: PushMessage | PushMessage[]) {
    try {
      const response = await axios.post(
        this.EXPO_PUSH_URL,
        Array.isArray(messages) ? messages : [messages],
        {
          headers: {
            Accept: 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
        },
      );
      this.logger.log(`Push notification sent successfully: ${JSON.stringify(response.data)}`);
      return response.data;
    } catch (error) {
      this.logger.error('Error sending push notification via Expo', error);
      throw error;
    }
  }

  // 전체 전송용 유틸
  async broadcastNotice(tokens: string[], title: string, body: string, data?: any) {
    if (!tokens || tokens.length === 0) return;

    // Expo push can accept an array of tokens in the "to" field
    const message: PushMessage = {
      to: tokens,
      sound: 'default',
      title,
      body,
      data,
    };
    await this.sendPushNotification(message);
  }
}
