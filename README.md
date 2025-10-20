# Email Management System with AI Categorization

A comprehensive email management system that provides real-time email synchronization, AI-powered categorization, and intelligent reply suggestions using modern technologies.

## 🚀 Features

- **Real-time Email Sync**: IMAP IDLE connections for instant email synchronization
- **AI Categorization**: Automatic email classification using OpenAI GPT models
- **Elasticsearch Integration**: Fast and powerful email search and indexing
- **Slack Notifications**: Real-time alerts for interested emails
- **Webhook Integration**: Custom webhook support for external systems
- **AI Suggested Replies**: RAG-powered contextual reply generation
- **Modern Frontend**: React + TypeScript + Tailwind CSS
- **Real-time Updates**: WebSocket integration for live updates

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend│    │  Node.js Backend│    │   Elasticsearch│
│   (TypeScript)  │◄──►│   (TypeScript) │◄──►│   (Search/Index)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Socket.IO     │    │   IMAP Sync     │    │   ChromaDB     │
│   (Real-time)   │    │   (Email Fetch)│    │   (Vectors)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Slack API     │    │   OpenAI API    │    │   Webhook API   │
│   (Notifications)│    │   (AI/ML)      │    │   (External)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛠️ Tech Stack

### Backend
- **Node.js** with TypeScript
- **Express.js** for REST API
- **Socket.IO** for real-time communication
- **IMAP Simple** for email synchronization
- **Elasticsearch** for search and indexing
- **OpenAI GPT** for AI categorization
- **ChromaDB** for vector embeddings
- **Slack Web API** for notifications

### Frontend
- **React** with TypeScript
- **Tailwind CSS** for styling
- **Socket.IO Client** for real-time updates
- **Axios** for API communication

### Infrastructure
- **Docker** for Elasticsearch
- **Environment Variables** for configuration

## 📋 Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- OpenAI API key
- IMAP email accounts (Gmail recommended)
- Slack Bot Token (optional)
- Webhook URL (optional)

## 🚀 Quick Start

### 1. Clone and Setup

```bash
git clone <repository-url>
cd email-management-system
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure your settings:

```bash
cp env.example .env
```

Edit `.env` with your credentials:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# IMAP Account 1
IMAP1_HOST=imap.gmail.com
IMAP1_PORT=993
IMAP1_USER=your-email1@gmail.com
IMAP1_PASSWORD=your-app-password1
IMAP1_TLS=true

# IMAP Account 2
IMAP2_HOST=imap.gmail.com
IMAP2_PORT=993
IMAP2_USER=your-email2@gmail.com
IMAP2_PASSWORD=your-app-password2
IMAP2_TLS=true

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key

# Slack Configuration (optional)
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
SLACK_CHANNEL_ID=your-channel-id
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/your/webhook/url

# Webhook Configuration (optional)
WEBHOOK_URL=https://webhook.site/your-unique-url
```

### 3. Start Elasticsearch

```bash
docker-compose up -d
```

Wait for Elasticsearch to be ready (check http://localhost:9200).

### 4. Build and Start Backend

```bash
# Build TypeScript
npm run build

# Start the server
npm start
```

### 5. Start Frontend

```bash
cd src/frontend
npm install
npm start
```

The application will be available at:
- Frontend: http://localhost:3001
- Backend API: http://localhost:3000
- Elasticsearch: http://localhost:9200
- Kibana: http://localhost:5601

## 📚 API Documentation

### Email Endpoints

- `GET /api/emails/search` - Search emails with filters
- `GET /api/emails/stats` - Get email statistics
- `GET /api/emails/:id` - Get email by ID
- `DELETE /api/emails/:id` - Delete email

### AI Endpoints

- `POST /api/ai/categorize` - Categorize email with AI
- `POST /api/ai/suggest-replies` - Generate suggested replies
- `GET /api/ai/status` - Check AI service status

### Notification Endpoints

- `POST /api/notifications/slack/test` - Test Slack connection
- `POST /api/notifications/webhook/test` - Test webhook
- `GET /api/notifications/status` - Get notification status

### Health Check

- `GET /health` - System health status

## 🔧 Configuration

### IMAP Setup (Gmail)

1. Enable 2-factor authentication
2. Generate an App Password
3. Use the App Password in your `.env` file

### Slack Setup

1. Create a Slack App
2. Get Bot Token from OAuth & Permissions
3. Add bot to your channel
4. Get Channel ID from channel settings

### OpenAI Setup

1. Get API key from OpenAI platform
2. Add to `.env` file
3. Ensure you have sufficient credits

## 🧪 Testing

### Manual Testing

1. **Email Sync**: Check if emails are being fetched and indexed
2. **AI Categorization**: Verify emails are being categorized correctly
3. **Slack Notifications**: Test if "Interested" emails trigger notifications
4. **Search**: Test email search functionality
5. **Real-time Updates**: Check if new emails appear instantly

### API Testing

Use the provided Postman collection or test with curl:

```bash
# Health check
curl http://localhost:3000/health

# Search emails
curl "http://localhost:3000/api/emails/search?limit=10"

# Get stats
curl http://localhost:3000/api/emails/stats
```

## 📊 Monitoring

### Health Dashboard

Visit http://localhost:3000/health to check system status:
- Elasticsearch connection
- Email sync status
- AI service availability

### Kibana Dashboard

Access http://localhost:5601 to explore email data:
- Email volume over time
- AI categorization distribution
- Account and folder statistics

## 🚨 Troubleshooting

### Common Issues

1. **IMAP Connection Failed**
   - Check credentials and app passwords
   - Verify IMAP is enabled
   - Check firewall settings

2. **Elasticsearch Not Starting**
   - Ensure Docker is running
   - Check port 9200 is available
   - Review Docker logs: `docker-compose logs elasticsearch`

3. **AI Categorization Not Working**
   - Verify OpenAI API key
   - Check API credits
   - Review error logs

4. **Frontend Not Loading**
   - Check if backend is running
   - Verify CORS settings
   - Check browser console for errors

### Logs

```bash
# Backend logs
npm run dev

# Docker logs
docker-compose logs -f

# Elasticsearch logs
docker-compose logs elasticsearch
```

## 🔒 Security

- Store all secrets in `.env` file
- Use app passwords for IMAP
- Enable HTTPS in production
- Implement rate limiting
- Use environment-specific configurations

## 📈 Performance

### Optimization Tips

1. **Elasticsearch**: Tune index settings for your data size
2. **IMAP**: Adjust sync intervals based on email volume
3. **AI**: Cache categorization results
4. **Frontend**: Implement pagination for large datasets

### Scaling

- Use multiple Elasticsearch nodes
- Implement Redis for caching
- Add load balancing
- Use message queues for async processing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Review the logs
3. Create an issue with detailed information
4. Include system information and error messages

## 🎯 Roadmap

- [ ] Email templates management
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Mobile app
- [ ] Enterprise features
- [ ] API rate limiting
- [ ] Advanced AI models
- [ ] Custom categorization rules

