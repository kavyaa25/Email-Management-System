import { EmailAccount, AIConfig, ElasticsearchConfig, SlackConfig, IMAPConfig } from '../types/index.js';

export const config = {
  server: {
    port: parseInt(process.env.PORT || '3000'),
    nodeEnv: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001'
  },

  imap: {
    accounts: [
      {
        id: 'account1',
        host: process.env.IMAP1_HOST || 'imap.gmail.com',
        port: parseInt(process.env.IMAP1_PORT || '993'),
        user: process.env.IMAP1_USER || '',
        password: process.env.IMAP1_PASSWORD || '',
        tls: process.env.IMAP1_TLS === 'true',
        folders: ['INBOX', 'Sent', 'Drafts', 'Trash']
      },
      {
        id: 'account2',
        host: process.env.IMAP2_HOST || 'imap.gmail.com',
        port: parseInt(process.env.IMAP2_PORT || '993'),
        user: process.env.IMAP2_USER || '',
        password: process.env.IMAP2_PASSWORD || '',
        tls: process.env.IMAP2_TLS === 'true',
        folders: ['INBOX', 'Sent', 'Drafts', 'Trash']
      }
    ] as EmailAccount[],
    syncInterval: 30000, // 30 seconds
    maxRetries: 3
  } as IMAPConfig,

  elasticsearch: {
    url: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
    index: process.env.ELASTICSEARCH_INDEX || 'emails',
    username: process.env.ELASTICSEARCH_USERNAME,
    password: process.env.ELASTICSEARCH_PASSWORD
  } as ElasticsearchConfig,

  ai: {
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '1000'),
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7')
  } as AIConfig,

  slack: {
    botToken: process.env.SLACK_BOT_TOKEN || '',
    channelId: process.env.SLACK_CHANNEL_ID || '',
    webhookUrl: process.env.SLACK_WEBHOOK_URL || ''
  } as SlackConfig,

  webhook: {
    url: process.env.WEBHOOK_URL || '',
    timeout: 5000,
    retries: 3
  },

  chroma: {
    persistDirectory: process.env.CHROMA_PERSIST_DIRECTORY || './chroma_db'
  },

  categories: (process.env.AI_CATEGORIES || 'Interested,Meeting Booked,Not Interested,Spam,Out of Office')
    .split(',')
    .map(cat => cat.trim()) as Array<'Interested' | 'Meeting Booked' | 'Not Interested' | 'Spam' | 'Out of Office'>
};

export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required environment variables
  if (!config.imap.accounts[0].user || !config.imap.accounts[0].password) {
    errors.push('IMAP1_USER and IMAP1_PASSWORD are required');
  }

  if (!config.imap.accounts[1].user || !config.imap.accounts[1].password) {
    errors.push('IMAP2_USER and IMAP2_PASSWORD are required');
  }

  if (!config.ai.openaiApiKey) {
    errors.push('OPENAI_API_KEY is required');
  }

  if (!config.slack.botToken && !config.slack.webhookUrl) {
    errors.push('Either SLACK_BOT_TOKEN or SLACK_WEBHOOK_URL is required');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

