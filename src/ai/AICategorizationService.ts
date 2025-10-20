import OpenAI from 'openai';
import { EmailMessage, AICategory, AIConfig } from '../types/index.js';
import { VectorEmbeddingService } from './VectorEmbeddingService.js';

export class AICategorizationService {
  private openai: OpenAI;
  private config: AIConfig;
  private available: boolean = false;
  private vectorService: VectorEmbeddingService;

  constructor(config: AIConfig) {
    this.config = config;
    
    if (config.openaiApiKey) {
      this.openai = new OpenAI({
        apiKey: config.openaiApiKey
      });
      this.available = true;
      this.vectorService = new VectorEmbeddingService(config);
    } else {
      console.warn('⚠️ OpenAI API key not provided, AI categorization disabled');
    }
  }

  async categorizeEmail(email: EmailMessage): Promise<AICategory | null> {
    if (!this.available) {
      console.log('⚠️ AI service not available, skipping categorization');
      return null;
    }

    try {
      const prompt = this.buildCategorizationPrompt(email);
      
      const response = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: 'You are an AI email categorization assistant. Analyze emails and categorize them into one of these categories: Interested, Meeting Booked, Not Interested, Spam, Out of Office. Provide your reasoning and confidence level.'
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

      const category = this.parseAIResponse(content);
      console.log(`🤖 AI categorized email as: ${category.category} (${category.confidence}%)`);
      
      return category;
    } catch (error) {
      console.error('❌ AI categorization failed:', error);
      return null;
    }
  }

  private buildCategorizationPrompt(email: EmailMessage): string {
    return `
Analyze this email and categorize it into one of these categories:
- Interested: Shows genuine interest in your product/service
- Meeting Booked: Contains meeting scheduling or appointment booking
- Not Interested: Explicitly declines or shows no interest
- Spam: Unwanted promotional content or suspicious emails
- Out of Office: Automated out-of-office replies

Email Details:
From: ${email.from}
To: ${email.to.join(', ')}
Subject: ${email.subject}
Body: ${email.body.substring(0, 1000)}...

Please respond in this exact JSON format:
{
  "category": "one of the categories above",
  "confidence": "number between 0-100",
  "reasoning": "brief explanation of your decision"
}
`;
  }

  private parseAIResponse(content: string): AICategory {
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          category: parsed.category as AICategory['category'],
          confidence: Math.min(100, Math.max(0, parsed.confidence || 0)),
          reasoning: parsed.reasoning
        };
      }
    } catch (error) {
      console.error('❌ Failed to parse AI response:', error);
    }

    // Fallback: try to extract category from text
    const categoryMatch = content.match(/(Interested|Meeting Booked|Not Interested|Spam|Out of Office)/i);
    const confidenceMatch = content.match(/(\d+)%/);
    
    return {
      category: (categoryMatch?.[1] as AICategory['category']) || 'Not Interested',
      confidence: confidenceMatch ? parseInt(confidenceMatch[1]) : 50,
      reasoning: 'Fallback categorization due to parsing error'
    };
  }

  async generateSuggestedReplies(email: EmailMessage, context: string[] = []): Promise<string[]> {
    if (!this.available) {
      console.log('⚠️ AI service not available, cannot generate replies');
      return [];
    }

    try {
      // Initialize vector service if not already done
      if (!this.vectorService) {
        this.vectorService = new VectorEmbeddingService(this.config);
        await this.vectorService.initialize();
      }

      // Use RAG with vector embeddings for contextual replies
      const emailText = `${email.subject}\n\n${email.body}`;
      const replies = await this.vectorService.generateContextualReplies(emailText);
      
      if (replies.length > 0) {
        return replies;
      }

      // Fallback to basic reply generation if RAG fails
      const prompt = this.buildReplyGenerationPrompt(email, context);
      
      const response = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant that generates professional email replies. Generate 3 different reply options based on the email content and provided context.'
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

      const suggestedReplies = this.parseReplyResponse(content);
      console.log(`🤖 Generated ${suggestedReplies.length} suggested replies`);
      
      return suggestedReplies;
    } catch (error) {
      console.error('❌ Reply generation failed:', error);
      return [];
    }
  }

  private buildReplyGenerationPrompt(email: EmailMessage, context: string[]): string {
    return `
Generate 3 professional email reply options for this email:

Original Email:
From: ${email.from}
Subject: ${email.subject}
Body: ${email.body}

Context Information:
${context.map(c => `- ${c}`).join('\n')}

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

  isAvailable(): boolean {
    return this.available;
  }

  async testConnection(): Promise<boolean> {
    if (!this.available) {
      return false;
    }

    try {
      await this.openai.models.list();
      return true;
    } catch (error) {
      console.error('❌ AI service connection test failed:', error);
      return false;
    }
  }
}