import { Router, Request, Response } from 'express';
import { ElasticsearchService } from '../services/ElasticsearchService.js';
import { SearchFilters } from '../../types/index.js';

export class EmailController {
  private router: Router;
  private elasticsearchService: ElasticsearchService;

  constructor(elasticsearchService: ElasticsearchService) {
    this.router = Router();
    this.elasticsearchService = elasticsearchService;
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.router.get('/search', this.searchEmails.bind(this));
    this.router.get('/stats', this.getStats.bind(this));
    this.router.get('/:id', this.getEmailById.bind(this));
    this.router.delete('/:id', this.deleteEmail.bind(this));
  }

  private async searchEmails(req: Request, res: Response): Promise<void> {
    try {
      const filters: SearchFilters = {
        accountId: req.query.accountId as string,
        folder: req.query.folder as string,
        from: req.query.from as string,
        to: req.query.to as string,
        subject: req.query.subject as string,
        body: req.query.body as string,
        aiCategory: req.query.aiCategory as string,
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0
      };

      const result = await this.elasticsearchService.searchEmails(filters);
      
      res.json({
        success: true,
        data: {
          emails: result.emails,
          total: result.total,
          limit: filters.limit,
          offset: filters.offset
        }
      });
    } catch (error) {
      console.error('❌ Search emails error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search emails',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async getStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.elasticsearchService.getStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('❌ Get stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get stats',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async getEmailById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const email = await this.elasticsearchService.getEmailById(id);
      
      if (!email) {
        res.status(404).json({
          success: false,
          error: 'Email not found'
        });
        return;
      }

      res.json({
        success: true,
        data: email
      });
    } catch (error) {
      console.error('❌ Get email by ID error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get email',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async deleteEmail(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.elasticsearchService.deleteEmail(id);
      
      res.json({
        success: true,
        message: 'Email deleted successfully'
      });
    } catch (error) {
      console.error('❌ Delete email error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete email',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  getRouter(): Router {
    return this.router;
  }
}

