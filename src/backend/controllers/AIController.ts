import { Router, Request, Response } from 'express';
import { AICategorizationService } from '../../ai/AICategorizationService.js';
import { ElasticsearchService } from '../services/ElasticsearchService.js';

export class AIController {
  private router: Router;
  private aiService: AICategorizationService;
  private elasticsearchService: ElasticsearchService;

  constructor(aiService: AICategorizationService, elasticsearchService: ElasticsearchService) {
    this.router = Router();
    this.aiService = aiService;
    this.elasticsearchService = elasticsearchService;
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.router.post('/categorize', this.categorizeEmail.bind(this));
    this.router.post('/suggest-replies', this.suggestReplies.bind(this));
    this.router.get('/status', this.getAIStatus.bind(this));
    this.router.post('/test', this.testAIConnection.bind(this));
  }

  private async categorizeEmail(req: Request, res: Response): Promise<void> {
    try {
      const { emailId } = req.body;
      
      if (!emailId) {
        res.status(400).json({
          success: false,
          error: 'Email ID is required'
        });
        return;
      }

      const email = await this.elasticsearchService.getEmailById(emailId);
      if (!email) {
        res.status(404).json({
          success: false,
          error: 'Email not found'
        });
        return;
      }

      // Convert Elasticsearch document back to EmailMessage format
      const emailMessage = {
        id: email.id,
        uid: 0, // Not available in ES document
        accountId: email.accountId,
        folder: email.folder,
        from: email.from,
        to: email.to,
        cc: email.cc,
        bcc: email.bcc,
        subject: email.subject,
        body: email.body,
        htmlBody: email.htmlBody,
        date: new Date(email.date),
        flags: email.flags
      };

      const category = await this.aiService.categorizeEmail(emailMessage);
      
      if (category) {
        // Update the email in Elasticsearch
        await this.elasticsearchService.updateEmailAI(
          emailId,
          category.category,
          category.confidence
        );
      }

      res.json({
        success: true,
        data: {
          emailId,
          category,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('❌ Categorize email error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to categorize email',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async suggestReplies(req: Request, res: Response): Promise<void> {
    try {
      const { emailId, context } = req.body;
      
      if (!emailId) {
        res.status(400).json({
          success: false,
          error: 'Email ID is required'
        });
        return;
      }

      const email = await this.elasticsearchService.getEmailById(emailId);
      if (!email) {
        res.status(404).json({
          success: false,
          error: 'Email not found'
        });
        return;
      }

      // Convert Elasticsearch document back to EmailMessage format
      const emailMessage = {
        id: email.id,
        uid: 0,
        accountId: email.accountId,
        folder: email.folder,
        from: email.from,
        to: email.to,
        cc: email.cc,
        bcc: email.bcc,
        subject: email.subject,
        body: email.body,
        htmlBody: email.htmlBody,
        date: new Date(email.date),
        flags: email.flags
      };

      const contextArray = Array.isArray(context) ? context : [];
      const suggestedReplies = await this.aiService.generateSuggestedReplies(
        emailMessage,
        contextArray
      );

      res.json({
        success: true,
        data: {
          emailId,
          suggestedReplies,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('❌ Suggest replies error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate suggested replies',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async getAIStatus(req: Request, res: Response): Promise<void> {
    try {
      const isAvailable = this.aiService.isAvailable();
      const connectionTest = isAvailable ? await this.aiService.testConnection() : false;

      res.json({
        success: true,
        data: {
          available: isAvailable,
          connected: connectionTest,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('❌ Get AI status error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get AI status',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async testAIConnection(req: Request, res: Response): Promise<void> {
    try {
      const isAvailable = this.aiService.isAvailable();
      
      if (!isAvailable) {
        res.status(400).json({
          success: false,
          error: 'AI service not available'
        });
        return;
      }

      const connectionTest = await this.aiService.testConnection();
      
      res.json({
        success: true,
        data: {
          connected: connectionTest,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('❌ Test AI connection error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to test AI connection',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  getRouter(): Router {
    return this.router;
  }
}

