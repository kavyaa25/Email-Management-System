import imaps from 'imap-simple';
import { Server as SocketIOServer } from 'socket.io';
import { 
  EmailMessage, 
  EmailAccount, 
  IMAPConfig,
  AICategory 
} from '../../types/index.js';
import { ElasticsearchService } from './ElasticsearchService.js';
import { AICategorizationService } from '../../ai/AICategorizationService.js';
import { SlackNotificationService } from './SlackNotificationService.js';
import { WebhookService } from './WebhookService.js';

export class EmailSyncService {
  private config: IMAPConfig;
  private elasticsearchService: ElasticsearchService;
  private aiCategorizationService: AICategorizationService;
  private slackNotificationService: SlackNotificationService;
  private webhookService: WebhookService;
  private io: SocketIOServer;
  private connections: Map<string, any> = new Map();
  private isRunning: boolean = false;
  private syncIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    config: IMAPConfig,
    elasticsearchService: ElasticsearchService,
    aiCategorizationService: AICategorizationService,
    slackNotificationService: SlackNotificationService,
    webhookService: WebhookService,
    io: SocketIOServer
  ) {
    this.config = config;
    this.elasticsearchService = elasticsearchService;
    this.aiCategorizationService = aiCategorizationService;
    this.slackNotificationService = slackNotificationService;
    this.webhookService = webhookService;
    this.io = io;
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Email sync service is already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting email sync service...');

    // Start syncing each account
    for (const account of this.config.accounts) {
      if (account.user && account.password) {
        await this.startAccountSync(account);
      } else {
        console.log(`⚠️ Skipping account ${account.id} - missing credentials`);
      }
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    console.log('🛑 Stopping email sync service...');
    this.isRunning = false;

    // Close all IMAP connections
    for (const [accountId, connection] of this.connections) {
      try {
        await connection.end();
        console.log(`✅ Closed connection for account: ${accountId}`);
      } catch (error) {
        console.error(`❌ Error closing connection for account ${accountId}:`, error);
      }
    }

    // Clear intervals
    for (const [accountId, interval] of this.syncIntervals) {
      clearInterval(interval);
    }

    this.connections.clear();
    this.syncIntervals.clear();
  }

  private async startAccountSync(account: EmailAccount): Promise<void> {
    try {
      console.log(`📧 Starting sync for account: ${account.user}`);

      // Initial sync - fetch last 30 days
      await this.performInitialSync(account);

      // Set up real-time sync with IDLE
      await this.setupRealtimeSync(account);

      console.log(`✅ Account sync started: ${account.user}`);
    } catch (error) {
      console.error(`❌ Failed to start sync for account ${account.user}:`, error);
    }
  }

  private async performInitialSync(account: EmailAccount): Promise<void> {
    try {
      const connection = await this.createIMAPConnection(account);
      this.connections.set(account.id, connection);

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      for (const folder of account.folders) {
        try {
          await connection.openBox(folder);
          const searchCriteria = ['SINCE', thirtyDaysAgo];
          const fetchOptions = {
            bodies: ['HEADER', 'TEXT'],
            struct: true,
            markSeen: false
          };

          const messages = await connection.search(searchCriteria, fetchOptions);
          console.log(`📬 Found ${messages.length} emails in ${folder} for ${account.user}`);

          for (const message of messages) {
            const email = await this.parseEmailMessage(message, account.id, folder);
            if (email) {
              await this.processNewEmail(email);
            }
          }
        } catch (folderError) {
          console.error(`❌ Error syncing folder ${folder}:`, folderError);
        }
      }
    } catch (error) {
      console.error(`❌ Initial sync failed for account ${account.user}:`, error);
      throw error;
    }
  }

  private async setupRealtimeSync(account: EmailAccount): Promise<void> {
    const syncInterval = setInterval(async () => {
      if (!this.isRunning) return;

      try {
        await this.checkForNewEmails(account);
      } catch (error) {
        console.error(`❌ Error in real-time sync for ${account.user}:`, error);
      }
    }, this.config.syncInterval);

    this.syncIntervals.set(account.id, syncInterval);
  }

  private async checkForNewEmails(account: EmailAccount): Promise<void> {
    try {
      const connection = this.connections.get(account.id);
      if (!connection) {
        console.log(`⚠️ No connection for account ${account.id}, reconnecting...`);
        await this.startAccountSync(account);
        return;
      }

      for (const folder of account.folders) {
        try {
          await connection.openBox(folder);
          
          // Check for unseen messages
          const searchCriteria = ['UNSEEN'];
          const fetchOptions = {
            bodies: ['HEADER', 'TEXT'],
            struct: true,
            markSeen: false
          };

          const messages = await connection.search(searchCriteria, fetchOptions);
          
          if (messages.length > 0) {
            console.log(`📬 Found ${messages.length} new emails in ${folder} for ${account.user}`);
            
            for (const message of messages) {
              const email = await this.parseEmailMessage(message, account.id, folder);
              if (email) {
                await this.processNewEmail(email);
              }
            }
          }
        } catch (folderError) {
          console.error(`❌ Error checking folder ${folder}:`, folderError);
        }
      }
    } catch (error) {
      console.error(`❌ Error checking for new emails:`, error);
    }
  }

  private async createIMAPConnection(account: EmailAccount): Promise<any> {
    const config = {
      imap: {
        user: account.user,
        password: account.password,
        host: account.host,
        port: account.port,
        tls: account.tls,
        tlsOptions: { rejectUnauthorized: false }
      }
    };

    return await imaps.connect(config);
  }

  private async parseEmailMessage(message: any, accountId: string, folder: string): Promise<EmailMessage | null> {
    try {
      const header = message.parts.find((part: any) => part.which === 'HEADER');
      const textPart = message.parts.find((part: any) => part.which === 'TEXT');
      
      if (!header || !textPart) {
        return null;
      }

      const headers = header.body;
      const body = textPart.body;

      const email: EmailMessage = {
        id: `${accountId}_${message.uid}`,
        uid: message.uid,
        accountId,
        folder,
        from: headers.from?.[0] || '',
        to: headers.to || [],
        cc: headers.cc || [],
        bcc: headers.bcc || [],
        subject: headers.subject?.[0] || '',
        body: body || '',
        htmlBody: message.htmlBody,
        date: new Date(headers.date?.[0] || Date.now()),
        flags: message.flags || [],
        attachments: []
      };

      return email;
    } catch (error) {
      console.error('❌ Error parsing email message:', error);
      return null;
    }
  }

  private async processNewEmail(email: EmailMessage): Promise<void> {
    try {
      // Index in Elasticsearch
      await this.elasticsearchService.indexEmail(email);
      console.log(`✅ Indexed email: ${email.subject}`);

      // Categorize with AI
      const aiCategory = await this.aiCategorizationService.categorizeEmail(email);
      if (aiCategory) {
        email.aiCategory = aiCategory;
        await this.elasticsearchService.updateEmailAI(
          email.id, 
          aiCategory.category, 
          aiCategory.confidence
        );
        console.log(`🤖 AI categorized email as: ${aiCategory.category} (${aiCategory.confidence}%)`);
      }

      // Send notifications for "Interested" emails
      if (aiCategory?.category === 'Interested') {
        await this.slackNotificationService.sendInterestedEmailNotification(email);
        await this.webhookService.sendWebhook({
          event: 'email_categorized',
          data: { email, category: aiCategory },
          timestamp: new Date().toISOString()
        });
      }

      // Emit real-time update to frontend
      this.io.emit('new_email', {
        email,
        aiCategory
      });

      console.log(`📧 Processed new email: ${email.subject}`);
    } catch (error) {
      console.error('❌ Error processing new email:', error);
    }
  }

  isRunning(): boolean {
    return this.isRunning;
  }

  getConnectionStatus(): { [accountId: string]: boolean } {
    const status: { [accountId: string]: boolean } = {};
    for (const [accountId, connection] of this.connections) {
      status[accountId] = connection && connection.state === 'authenticated';
    }
    return status;
  }
}

