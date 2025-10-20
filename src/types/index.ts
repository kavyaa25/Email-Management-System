export interface EmailAccount {
  id: string;
  host: string;
  port: number;
  user: string;
  password: string;
  tls: boolean;
  folders: string[];
}

export interface EmailMessage {
  id: string;
  uid: number;
  accountId: string;
  folder: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  htmlBody?: string;
  date: Date;
  flags: string[];
  attachments?: EmailAttachment[];
  aiCategory?: AICategory;
  aiConfidence?: number;
  suggestedReplies?: string[];
}

export interface EmailAttachment {
  filename: string;
  contentType: string;
  size: number;
  content: Buffer;
}

export interface AICategory {
  category: 'Interested' | 'Meeting Booked' | 'Not Interested' | 'Spam' | 'Out of Office';
  confidence: number;
  reasoning?: string;
}

export interface ElasticsearchEmailDocument {
  id: string;
  accountId: string;
  folder: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  htmlBody?: string;
  date: string;
  flags: string[];
  aiCategory?: string;
  aiConfidence?: number;
  timestamp: string;
}

export interface SearchFilters {
  accountId?: string;
  folder?: string;
  from?: string;
  to?: string;
  subject?: string;
  body?: string;
  aiCategory?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

export interface SlackNotification {
  channel: string;
  text: string;
  attachments?: any[];
}

export interface WebhookPayload {
  event: 'email_received' | 'email_categorized' | 'ai_reply_generated';
  data: {
    email: EmailMessage;
    category?: AICategory;
    suggestedReplies?: string[];
  };
  timestamp: string;
}

export interface VectorEmbedding {
  id: string;
  text: string;
  embedding: number[];
  metadata: {
    type: 'product_info' | 'outreach_template' | 'response_template';
    category?: string;
  };
}

export interface AIConfig {
  openaiApiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

export interface ElasticsearchConfig {
  url: string;
  index: string;
  username?: string;
  password?: string;
}

export interface SlackConfig {
  botToken: string;
  channelId: string;
  webhookUrl: string;
}

export interface IMAPConfig {
  accounts: EmailAccount[];
  syncInterval: number;
  maxRetries: number;
}

