export interface Email {
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

export interface SearchResponse {
  success: boolean;
  data: {
    emails: Email[];
    total: number;
    limit: number;
    offset: number;
  };
}

export interface StatsResponse {
  success: boolean;
  data: {
    total_emails: { value: number };
    by_account: { buckets: Array<{ key: string; doc_count: number }> };
    by_folder: { buckets: Array<{ key: string; doc_count: number }> };
    by_ai_category: { buckets: Array<{ key: string; doc_count: number }> };
    date_histogram: { buckets: Array<{ key_as_string: string; doc_count: number }> };
  };
}

export interface AICategory {
  category: 'Interested' | 'Meeting Booked' | 'Not Interested' | 'Spam' | 'Out of Office';
  confidence: number;
  reasoning?: string;
}

export interface SuggestedRepliesResponse {
  success: boolean;
  data: {
    emailId: string;
    suggestedReplies: string[];
    timestamp: string;
  };
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  services: {
    elasticsearch: boolean;
    emailSync: boolean;
    ai: boolean;
  };
}

