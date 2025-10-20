import { Client } from '@elastic/elasticsearch';
import { 
  EmailMessage, 
  ElasticsearchEmailDocument, 
  SearchFilters,
  ElasticsearchConfig 
} from '../../types/index.js';

export class ElasticsearchService {
  private client: Client;
  private index: string;
  private connected: boolean = false;

  constructor(config: ElasticsearchConfig) {
    this.index = config.index;
    
    this.client = new Client({
      node: config.url,
      auth: config.username && config.password ? {
        username: config.username,
        password: config.password
      } : undefined,
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  async initialize(): Promise<void> {
    try {
      // Test connection
      await this.client.ping();
      this.connected = true;
      console.log('✅ Elasticsearch connection established');

      // Create index if it doesn't exist
      await this.createIndexIfNotExists();
      
      // Create mapping
      await this.createMapping();
      
    } catch (error) {
      console.error('❌ Failed to connect to Elasticsearch:', error);
      throw error;
    }
  }

  private async createIndexIfNotExists(): Promise<void> {
    const exists = await this.client.indices.exists({
      index: this.index
    });

    if (!exists) {
      await this.client.indices.create({
        index: this.index,
        body: {
          settings: {
            number_of_shards: 1,
            number_of_replicas: 0,
            analysis: {
              analyzer: {
                email_analyzer: {
                  type: 'custom',
                  tokenizer: 'standard',
                  filter: ['lowercase', 'stop', 'snowball']
                }
              }
            }
          }
        }
      });
      console.log(`✅ Created Elasticsearch index: ${this.index}`);
    }
  }

  private async createMapping(): Promise<void> {
    const mapping = {
      properties: {
        id: { type: 'keyword' },
        accountId: { type: 'keyword' },
        folder: { type: 'keyword' },
        from: { 
          type: 'text',
          analyzer: 'email_analyzer',
          fields: {
            keyword: { type: 'keyword' }
          }
        },
        to: { 
          type: 'text',
          analyzer: 'email_analyzer',
          fields: {
            keyword: { type: 'keyword' }
          }
        },
        cc: { 
          type: 'text',
          analyzer: 'email_analyzer',
          fields: {
            keyword: { type: 'keyword' }
          }
        },
        bcc: { 
          type: 'text',
          analyzer: 'email_analyzer',
          fields: {
            keyword: { type: 'keyword' }
          }
        },
        subject: { 
          type: 'text',
          analyzer: 'email_analyzer',
          fields: {
            keyword: { type: 'keyword' }
          }
        },
        body: { 
          type: 'text',
          analyzer: 'email_analyzer'
        },
        htmlBody: { 
          type: 'text',
          analyzer: 'email_analyzer'
        },
        date: { type: 'date' },
        flags: { type: 'keyword' },
        aiCategory: { type: 'keyword' },
        aiConfidence: { type: 'float' },
        timestamp: { type: 'date' }
      }
    };

    await this.client.indices.putMapping({
      index: this.index,
      body: mapping
    });
  }

  async indexEmail(email: EmailMessage): Promise<void> {
    try {
      const document: ElasticsearchEmailDocument = {
        id: email.id,
        accountId: email.accountId,
        folder: email.folder,
        from: email.from,
        to: email.to,
        cc: email.cc,
        bcc: email.bcc,
        subject: email.subject,
        body: email.body,
        htmlBody: email.htmlBody,
        date: email.date.toISOString(),
        flags: email.flags,
        aiCategory: email.aiCategory?.category,
        aiConfidence: email.aiCategory?.confidence,
        timestamp: new Date().toISOString()
      };

      await this.client.index({
        index: this.index,
        id: email.id,
        body: document
      });

      console.log(`✅ Indexed email: ${email.subject}`);
    } catch (error) {
      console.error('❌ Failed to index email:', error);
      throw error;
    }
  }

  async updateEmailAI(emailId: string, aiCategory: string, aiConfidence: number): Promise<void> {
    try {
      await this.client.update({
        index: this.index,
        id: emailId,
        body: {
          doc: {
            aiCategory,
            aiConfidence,
            timestamp: new Date().toISOString()
          }
        }
      });

      console.log(`✅ Updated AI category for email: ${emailId}`);
    } catch (error) {
      console.error('❌ Failed to update email AI category:', error);
      throw error;
    }
  }

  async searchEmails(filters: SearchFilters): Promise<{ emails: ElasticsearchEmailDocument[]; total: number }> {
    try {
      const query: any = {
        bool: {
          must: []
        }
      };

      // Add filters
      if (filters.accountId) {
        query.bool.must.push({ term: { accountId: filters.accountId } });
      }

      if (filters.folder) {
        query.bool.must.push({ term: { folder: filters.folder } });
      }

      if (filters.from) {
        query.bool.must.push({ 
          match: { from: filters.from } 
        });
      }

      if (filters.to) {
        query.bool.must.push({ 
          match: { to: filters.to } 
        });
      }

      if (filters.subject) {
        query.bool.must.push({ 
          match: { subject: filters.subject } 
        });
      }

      if (filters.body) {
        query.bool.must.push({ 
          match: { body: filters.body } 
        });
      }

      if (filters.aiCategory) {
        query.bool.must.push({ term: { aiCategory: filters.aiCategory } });
      }

      if (filters.dateFrom || filters.dateTo) {
        const dateRange: any = {};
        if (filters.dateFrom) dateRange.gte = filters.dateFrom;
        if (filters.dateTo) dateRange.lte = filters.dateTo;
        query.bool.must.push({ range: { date: dateRange } });
      }

      // If no specific filters, match all
      if (query.bool.must.length === 0) {
        query.bool.must.push({ match_all: {} });
      }

      const response = await this.client.search({
        index: this.index,
        body: {
          query,
          sort: [{ date: { order: 'desc' } }],
          from: filters.offset || 0,
          size: filters.limit || 20
        }
      });

      const emails = response.body.hits.hits.map((hit: any) => hit._source);
      const total = response.body.hits.total.value;

      return { emails, total };
    } catch (error) {
      console.error('❌ Failed to search emails:', error);
      throw error;
    }
  }

  async getEmailById(emailId: string): Promise<ElasticsearchEmailDocument | null> {
    try {
      const response = await this.client.get({
        index: this.index,
        id: emailId
      });

      return response.body._source;
    } catch (error) {
      if (error.meta?.statusCode === 404) {
        return null;
      }
      console.error('❌ Failed to get email by ID:', error);
      throw error;
    }
  }

  async deleteEmail(emailId: string): Promise<void> {
    try {
      await this.client.delete({
        index: this.index,
        id: emailId
      });

      console.log(`✅ Deleted email: ${emailId}`);
    } catch (error) {
      console.error('❌ Failed to delete email:', error);
      throw error;
    }
  }

  async getStats(): Promise<any> {
    try {
      const response = await this.client.search({
        index: this.index,
        body: {
          size: 0,
          aggs: {
            total_emails: { value_count: { field: 'id' } },
            by_account: {
              terms: { field: 'accountId' }
            },
            by_folder: {
              terms: { field: 'folder' }
            },
            by_ai_category: {
              terms: { field: 'aiCategory' }
            },
            date_histogram: {
              date_histogram: {
                field: 'date',
                calendar_interval: 'day'
              }
            }
          }
        }
      });

      return response.body.aggregations;
    } catch (error) {
      console.error('❌ Failed to get stats:', error);
      throw error;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  async close(): Promise<void> {
    await this.client.close();
    this.connected = false;
  }
}

