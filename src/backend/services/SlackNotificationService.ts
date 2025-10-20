import { WebClient } from '@slack/web-api';
import axios from 'axios';
import { EmailMessage, SlackConfig } from '../../types/index.js';

export class SlackNotificationService {
  private webClient: WebClient | null = null;
  private webhookUrl: string;
  private channelId: string;

  constructor(config: SlackConfig) {
    this.webhookUrl = config.webhookUrl;
    this.channelId = config.channelId;

    if (config.botToken) {
      this.webClient = new WebClient(config.botToken);
    }
  }

  async sendInterestedEmailNotification(email: EmailMessage): Promise<void> {
    try {
      const message = this.buildInterestedEmailMessage(email);
      
      if (this.webClient && this.channelId) {
        await this.sendSlackMessage(message);
      }
      
      if (this.webhookUrl) {
        await this.sendWebhookMessage(message);
      }

      console.log(`✅ Sent Slack notification for interested email: ${email.subject}`);
    } catch (error) {
      console.error('❌ Failed to send Slack notification:', error);
    }
  }

  async sendGeneralNotification(text: string, attachments?: any[]): Promise<void> {
    try {
      const message = {
        text,
        attachments: attachments || []
      };

      if (this.webClient && this.channelId) {
        await this.sendSlackMessage(message);
      }
      
      if (this.webhookUrl) {
        await this.sendWebhookMessage(message);
      }

      console.log('✅ Sent general Slack notification');
    } catch (error) {
      console.error('❌ Failed to send general Slack notification:', error);
    }
  }

  private buildInterestedEmailMessage(email: EmailMessage): any {
    const subject = email.subject || 'No Subject';
    const from = email.from || 'Unknown Sender';
    const body = email.body?.substring(0, 200) || 'No body content';
    const date = email.date.toLocaleString();

    return {
      text: `🎯 *New Interested Email Received!*`,
      attachments: [
        {
          color: 'good',
          fields: [
            {
              title: 'From',
              value: from,
              short: true
            },
            {
              title: 'Subject',
              value: subject,
              short: true
            },
            {
              title: 'Date',
              value: date,
              short: true
            },
            {
              title: 'Account',
              value: email.accountId,
              short: true
            },
            {
              title: 'Folder',
              value: email.folder,
              short: true
            },
            {
              title: 'AI Confidence',
              value: `${email.aiCategory?.confidence || 0}%`,
              short: true
            },
            {
              title: 'Preview',
              value: body + (email.body && email.body.length > 200 ? '...' : ''),
              short: false
            }
          ],
          footer: 'Email Management System',
          ts: Math.floor(email.date.getTime() / 1000)
        }
      ]
    };
  }

  private async sendSlackMessage(message: any): Promise<void> {
    if (!this.webClient || !this.channelId) {
      throw new Error('Slack client not configured');
    }

    await this.webClient.chat.postMessage({
      channel: this.channelId,
      text: message.text,
      attachments: message.attachments,
      unfurl_links: false,
      unfurl_media: false
    });
  }

  private async sendWebhookMessage(message: any): Promise<void> {
    if (!this.webhookUrl) {
      throw new Error('Webhook URL not configured');
    }

    await axios.post(this.webhookUrl, message, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      if (this.webClient) {
        await this.webClient.auth.test();
        return true;
      }
      
      if (this.webhookUrl) {
        await axios.post(this.webhookUrl, { text: 'Test message' }, {
          timeout: 5000
        });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Slack connection test failed:', error);
      return false;
    }
  }
}

