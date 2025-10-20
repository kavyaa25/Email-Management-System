import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

import { EmailSyncService } from './backend/services/EmailSyncService.js';
import { ElasticsearchService } from './backend/services/ElasticsearchService.js';
import { AICategorizationService } from './ai/AICategorizationService.js';
import { SlackNotificationService } from './backend/services/SlackNotificationService.js';
import { WebhookService } from './backend/services/WebhookService.js';
import { EmailController } from './backend/controllers/EmailController.js';
import { AIController } from './backend/controllers/AIController.js';
import { NotificationController } from './backend/controllers/NotificationController.js';
import { config } from './utils/config.js';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3001",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Initialize services
const elasticsearchService = new ElasticsearchService(config.elasticsearch);
const aiCategorizationService = new AICategorizationService(config.ai);
const slackNotificationService = new SlackNotificationService(config.slack);
const webhookService = new WebhookService(config.webhook);

// Initialize email sync service
const emailSyncService = new EmailSyncService(
  config.imap,
  elasticsearchService,
  aiCategorizationService,
  slackNotificationService,
  webhookService,
  io
);

// Initialize controllers
const emailController = new EmailController(elasticsearchService);
const aiController = new AIController(aiCategorizationService, elasticsearchService);
const notificationController = new NotificationController(slackNotificationService, webhookService);

// API Routes
app.use('/api/emails', emailController.getRouter());
app.use('/api/ai', aiController.getRouter());
app.use('/api/notifications', notificationController.getRouter());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    services: {
      elasticsearch: elasticsearchService.isConnected(),
      emailSync: emailSyncService.isRunning(),
      ai: aiCategorizationService.isAvailable()
    }
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Initialize Elasticsearch
    await elasticsearchService.initialize();
    console.log('✅ Elasticsearch connected');

    // Start email synchronization
    await emailSyncService.start();
    console.log('✅ Email sync service started');

    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📧 Email management system ready`);
      console.log(`🔍 Elasticsearch: ${config.elasticsearch.url}`);
      console.log(`🤖 AI Service: ${aiCategorizationService.isAvailable() ? 'Ready' : 'Not available'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  
  try {
    await emailSyncService.stop();
    await elasticsearchService.close();
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

startServer();

