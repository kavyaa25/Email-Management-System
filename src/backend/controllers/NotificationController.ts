import { Router, Request, Response } from 'express';
import { SlackNotificationService } from '../services/SlackNotificationService.js';
import { WebhookService } from '../services/WebhookService.js';

export class NotificationController {
  private router: Router;
  private slackService: SlackNotificationService;
  private webhookService: WebhookService;

  constructor(slackService: SlackNotificationService, webhookService: WebhookService) {
    this.router = Router();
    this.slackService = slackService;
    this.webhookService = webhookService;
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.router.post('/slack/test', this.testSlackConnection.bind(this));
    this.router.post('/slack/send', this.sendSlackNotification.bind(this));
    this.router.post('/webhook/test', this.testWebhook.bind(this));
    this.router.get('/status', this.getNotificationStatus.bind(this));
  }

  private async testSlackConnection(req: Request, res: Response): Promise<void> {
    try {
      const connectionTest = await this.slackService.testConnection();
      
      res.json({
        success: true,
        data: {
          connected: connectionTest,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('❌ Test Slack connection error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to test Slack connection',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async sendSlackNotification(req: Request, res: Response): Promise<void> {
    try {
      const { text, attachments } = req.body;
      
      if (!text) {
        res.status(400).json({
          success: false,
          error: 'Text is required for Slack notification'
        });
        return;
      }

      await this.slackService.sendGeneralNotification(text, attachments);
      
      res.json({
        success: true,
        message: 'Slack notification sent successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Send Slack notification error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send Slack notification',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async testWebhook(req: Request, res: Response): Promise<void> {
    try {
      const webhookTest = await this.webhookService.testWebhook();
      
      res.json({
        success: true,
        data: {
          connected: webhookTest,
          webhookUrl: this.webhookService.getWebhookUrl(),
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('❌ Test webhook error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to test webhook',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async getNotificationStatus(req: Request, res: Response): Promise<void> {
    try {
      const slackTest = await this.slackService.testConnection();
      const webhookTest = await this.webhookService.testWebhook();
      
      res.json({
        success: true,
        data: {
          slack: {
            available: slackTest,
            webhookUrl: this.webhookService.getWebhookUrl()
          },
          webhook: {
            available: webhookTest,
            url: this.webhookService.getWebhookUrl()
          },
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('❌ Get notification status error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get notification status',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  getRouter(): Router {
    return this.router;
  }
}

