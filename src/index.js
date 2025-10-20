// Simple development server without TypeScript compilation
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';

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

// --- Demo data to enable UI without IMAP/ES ---
const mockEmails = [
  {
    id: '1',
    accountId: 'account1',
    folder: 'INBOX',
    from: 'demo.sender@example.com',
    to: ['you@example.com'],
    subject: 'Welcome to the AI Email Manager',
    body: 'This is a demo email showcasing search and filters.',
    date: new Date().toISOString(),
    aiCategory: 'Interested'
  },
  {
    id: '2',
    accountId: 'account1',
    folder: 'INBOX',
    from: 'kavyadm040@gmail.com',
    to: ['you@example.com'],
    subject: 'Meeting discussion and next steps',
    body: 'Let’s meet tomorrow at 3 PM to discuss the project details.',
    date: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    aiCategory: 'Interested'
  },
  {
    id: '3',
    accountId: 'account1',
    folder: 'INBOX',
    from: 'noreply@service.com',
    to: ['you@example.com'],
    subject: 'Out of Office Auto Reply',
    body: 'I am currently out of office and will reply upon my return.',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    aiCategory: 'Out of Office'
  }
];

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    services: {
      elasticsearch: false, // Will be true when Docker is running
      emailSync: false,
      ai: false
    }
  });
});

// Health check under /api to satisfy frontend baseURL expectations
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    services: {
      elasticsearch: false,
      emailSync: false,
      ai: false
    }
  });
});

// Basic API routes with demo filtering
app.get('/api/emails/search', (req, res) => {
  const {
    accountId,
    folder,
    from,
    to,
    subject,
    body,
    aiCategory,
    limit = '20',
    offset = '0'
  } = req.query;

  // Simple filter over mock data
  let results = mockEmails.filter((e) => {
    if (accountId && e.accountId !== String(accountId)) return false;
    if (folder && e.folder !== String(folder)) return false;
    if (from && !e.from.toLowerCase().includes(String(from).toLowerCase())) return false;
    if (to && !e.to.join(',').toLowerCase().includes(String(to).toLowerCase())) return false;
    if (subject && !e.subject.toLowerCase().includes(String(subject).toLowerCase())) return false;
    if (body && !e.body.toLowerCase().includes(String(body).toLowerCase())) return false;
    if (aiCategory && e.aiCategory !== String(aiCategory)) return false;
    return true;
  });

  const numericLimit = Math.max(0, parseInt(String(limit))) || 20;
  const numericOffset = Math.max(0, parseInt(String(offset))) || 0;

  const paged = results.slice(numericOffset, numericOffset + numericLimit);

  res.json({
    success: true,
    data: {
      emails: paged,
      total: results.length,
      limit: numericLimit,
      offset: numericOffset
    }
  });
});

// Stats BEFORE :id to avoid shadowing by /api/emails/:id
app.get('/api/emails/stats', (req, res) => {
  // Build simple stats from mockEmails
  const total = mockEmails.length;
  const byAccount = Object.entries(
    mockEmails.reduce((acc, e) => {
      acc[e.accountId] = (acc[e.accountId] || 0) + 1;
      return acc;
    }, /** @type {Record<string, number>} */({}))
  ).map(([key, doc_count]) => ({ key, doc_count }));

  const byFolder = Object.entries(
    mockEmails.reduce((acc, e) => {
      acc[e.folder] = (acc[e.folder] || 0) + 1;
      return acc;
    }, /** @type {Record<string, number>} */({}))
  ).map(([key, doc_count]) => ({ key, doc_count }));

  const byCategory = Object.entries(
    mockEmails.reduce((acc, e) => {
      const key = e.aiCategory || 'Uncategorized';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, /** @type {Record<string, number>} */({}))
  ).map(([key, doc_count]) => ({ key, doc_count }));

  // 7-day daily histogram
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
  const histogram = days.map(d => {
    const next = new Date(d);
    next.setDate(d.getDate() + 1);
    const count = mockEmails.filter(e => {
      const t = new Date(e.date).getTime();
      return t >= d.getTime() && t < next.getTime();
    }).length;
    return { key_as_string: d.toISOString(), doc_count: count };
  });

  res.json({
    success: true,
    data: {
      total_emails: { value: total },
      by_account: { buckets: byAccount },
      by_folder: { buckets: byFolder },
      by_ai_category: { buckets: byCategory },
      date_histogram: { buckets: histogram }
    }
  });
});

app.get('/api/emails/:id', (req, res) => {
  const email = mockEmails.find(e => e.id === req.params.id);
  if (!email) {
    return res.status(404).json({ success: false, error: 'Email not found' });
  }
  res.json({ success: true, data: email });
});

// AI suggested replies (demo stub)
app.post('/api/ai/suggest-replies', (req, res) => {
  const { emailId } = req.body || {};
  const email = mockEmails.find(e => e.id === emailId) || mockEmails[0];
  const base = email ? `${email.subject}: ${email.body}` : 'Email context unavailable';
  const suggestedReplies = [
    `Thanks for reaching out! Happy to discuss. Here is my calendar: https://cal.com/example`,
    `Appreciate the update. I can meet tomorrow afternoon. Please propose a slot or use https://cal.com/example`,
    `Acknowledged. Could you share more details or attach relevant docs? Meanwhile, you can book a time here: https://cal.com/example`
  ];
  res.json({ success: true, data: { suggestedReplies, contextPreview: base.slice(0, 140) } });
});


// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📧 Email management system ready`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
  console.log(`⚠️  Note: Full functionality requires Docker and environment configuration`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
