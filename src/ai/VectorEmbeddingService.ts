import { ChromaClient } from 'chromadb';
import OpenAI from 'openai';
import { VectorEmbedding, AIConfig } from '../types/index.js';

export class VectorEmbeddingService {
  private chromaClient: ChromaClient;
  private openai: OpenAI;
  private collection: any;
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
    this.chromaClient = new ChromaClient({
      path: process.env.CHROMA_PERSIST_DIRECTORY || './chroma_db'
    });
    this.openai = new OpenAI({
      apiKey: config.openaiApiKey
    });
  }

  async initialize(): Promise<void> {
    try {
      // Create or get collection
      this.collection = await this.chromaClient.getOrCreateCollection({
        name: 'email_context',
        metadata: { description: 'Email context and product information for RAG' }
      });

      // Initialize with default context if collection is empty
      const count = await this.collection.count();
      if (count === 0) {
        await this.initializeDefaultContext();
      }

      console.log('✅ Vector embedding service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize vector embedding service:', error);
      throw error;
    }
  }

  private async initializeDefaultContext(): Promise<void> {
    const defaultContexts = [
      {
        id: 'product_info_1',
        text: 'Our AI-powered email management system helps businesses automatically categorize and respond to emails using machine learning. Key features include real-time email sync, intelligent categorization, and automated reply suggestions.',
        metadata: {
          type: 'product_info',
          category: 'product_overview'
        }
      },
      {
        id: 'product_info_2',
        text: 'The system integrates with popular email providers via IMAP, supports multiple accounts, and provides real-time notifications through Slack and webhooks. It uses Elasticsearch for fast email search and retrieval.',
        metadata: {
          type: 'product_info',
          category: 'technical_features'
        }
      },
      {
        id: 'outreach_template_1',
        text: 'Thank you for your interest in our email management solution. I would be happy to schedule a demo to show you how our AI can help streamline your email workflow and improve response times.',
        metadata: {
          type: 'outreach_template',
          category: 'demo_request'
        }
      },
      {
        id: 'outreach_template_2',
        text: 'Our solution can help reduce email processing time by up to 70% through intelligent categorization and automated responses. Would you like to learn more about our enterprise features and pricing?',
        metadata: {
          type: 'outreach_template',
          category: 'value_proposition'
        }
      },
      {
        id: 'response_template_1',
        text: 'I understand you are interested in our email management system. Let me provide you with more detailed information about our features and how they can benefit your organization.',
        metadata: {
          type: 'response_template',
          category: 'information_request'
        }
      },
      {
        id: 'response_template_2',
        text: 'Thank you for reaching out. I would be delighted to schedule a meeting to discuss your specific requirements and show you a personalized demo of our system.',
        metadata: {
          type: 'response_template',
          category: 'meeting_request'
        }
      }
    ];

    for (const context of defaultContexts) {
      const embedding = await this.generateEmbedding(context.text);
      await this.collection.add({
        ids: [context.id],
        embeddings: [embedding],
        documents: [context.text],
        metadatas: [context.metadata]
      });
    }

    console.log('✅ Initialized default context vectors');
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('❌ Failed to generate embedding:', error);
      throw error;
    }
  }

  async addContext(text: string, metadata: { type: string; category?: string }): Promise<void> {
    try {
      const embedding = await this.generateEmbedding(text);
      const id = `${metadata.type}_${Date.now()}`;

      await this.collection.add({
        ids: [id],
        embeddings: [embedding],
        documents: [text],
        metadatas: [metadata]
      });

      console.log(`✅ Added context vector: ${id}`);
    } catch (error) {
      console.error('❌ Failed to add context:', error);
      throw error;
    }
  }

  async searchSimilarContext(emailText: string, limit: number = 5): Promise<VectorEmbedding[]> {
    try {
      const queryEmbedding = await this.generateEmbedding(emailText);
      
      const results = await this.collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: limit
      });

      const embeddings: VectorEmbedding[] = [];
      
      if (results.ids && results.ids[0]) {
        for (let i = 0; i < results.ids[0].length; i++) {
          embeddings.push({
            id: results.ids[0][i],
            text: results.documents[0][i],
            embedding: results.embeddings[0][i],
            metadata: results.metadatas[0][i]
          });
        }
      }

      return embeddings;
    } catch (error) {
      console.error('❌ Failed to search similar context:', error);
      throw error;
    }
  }

  async generateContextualReplies(emailText: string, contextLimit: number = 3): Promise<string[]> {
    try {
      // Search for similar context
      const similarContexts = await this.searchSimilarContext(emailText, contextLimit);
      
      // Build context string
      const contextString = similarContexts
        .map(ctx => ctx.text)
        .join('\n\n');

      // Generate replies using RAG
      const prompt = `
Based on the following email and relevant context, generate 3 professional reply options:

Email:
${emailText}

Relevant Context:
${contextString}

Please provide 3 different reply options:
1. A brief, professional acknowledgment
2. A detailed response with next steps
3. A follow-up question to gather more information

Format your response as:
REPLY 1:
[reply content]

REPLY 2:
[reply content]

REPLY 3:
[reply content]
`;

      const response = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant that generates professional email replies using retrieval-augmented generation (RAG). Use the provided context to create relevant and personalized responses.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const replies = this.parseReplyResponse(content);
      console.log(`🤖 Generated ${replies.length} contextual replies using RAG`);
      
      return replies;
    } catch (error) {
      console.error('❌ Failed to generate contextual replies:', error);
      return [];
    }
  }

  private parseReplyResponse(content: string): string[] {
    const replies: string[] = [];
    const replyRegex = /REPLY \d+:\s*([\s\S]*?)(?=REPLY \d+:|$)/g;
    let match;

    while ((match = replyRegex.exec(content)) !== null) {
      const reply = match[1].trim();
      if (reply) {
        replies.push(reply);
      }
    }

    return replies;
  }

  async getCollectionStats(): Promise<any> {
    try {
      const count = await this.collection.count();
      return {
        totalDocuments: count,
        collectionName: 'email_context'
      };
    } catch (error) {
      console.error('❌ Failed to get collection stats:', error);
      throw error;
    }
  }

  async clearCollection(): Promise<void> {
    try {
      await this.collection.delete();
      console.log('✅ Collection cleared');
    } catch (error) {
      console.error('❌ Failed to clear collection:', error);
      throw error;
    }
  }
}

