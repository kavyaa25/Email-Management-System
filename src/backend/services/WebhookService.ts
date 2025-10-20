import axios from 'axios';
import { WebhookPayload } from '../../types/index.js';

export class WebhookService {
  private webhookUrl: string;
  private timeout: number;
  private retries: number;

  constructor(config: { url: string; timeout: number; retries: number }) {
    this.webhookUrl = config.url;
    this.timeout = config.timeout;
    this.retries = config.retries;
  }

  async sendWebhook(payload: WebhookPayload): Promise<void> {
    if (!this.webhookUrl) {
      console.log('⚠️ Webhook URL not configured, skipping webhook');
      return;
    }

    try {
      await this.sendWithRetry(payload);
      console.log(`✅ Webhook sent successfully: ${payload.event}`);
    } catch (error) {
      console.error('❌ Failed to send webhook after all retries:', error);
    }
  }

  private async sendWithRetry(payload: WebhookPayload): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        await axios.post(this.webhookUrl, payload, {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Email-Management-System/1.0'
          },
          timeout: this.timeout
        });

        console.log(`✅ Webhook sent successfully on attempt ${attempt}`);
        return;
      } catch (error) {
        lastError = error as Error;
        console.warn(`⚠️ Webhook attempt ${attempt} failed:`, error);
        
        if (attempt < this.retries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Webhook failed after all retries');
  }

  async testWebhook(): Promise<boolean> {
    if (!this.webhookUrl) {
      console.log('⚠️ Webhook URL not configured');
      return false;
    }

    try {
      const testPayload: WebhookPayload = {
        event: 'email_received',
        data: {
          email: {
            id: 'test',
            uid: 1,
            accountId: 'test',
            folder: 'INBOX',
            from: 'test@example.com',
            to: ['recipient@example.com'],
            subject: 'Test Email',
            body: 'This is a test email',
            date: new Date(),
            flags: []
          }
        },
        timestamp: new Date().toISOString()
      };

      await axios.post(this.webhookUrl, testPayload, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: this.timeout
      });

      console.log('✅ Webhook test successful');
      return true;
    } catch (error) {
      console.error('❌ Webhook test failed:', error);
      return false;
    }
  }

  getWebhookUrl(): string {
    return this.webhookUrl;
  }
}

