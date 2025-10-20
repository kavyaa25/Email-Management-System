
# Email Management System — Onebox Assignment

A feature-rich Onebox-style email aggregator built with TypeScript + Node.js. This project demonstrates a real-time IMAP sync engine, searchable storage via Elasticsearch, AI-based email categorization, Slack & webhook integrations, a simple frontend, and an optional RAG-powered suggested replies flow backed by a vector database.

This README explains how to run and test the system (backend via Postman first), how features are implemented, and how to validate the assignment requirements.

---

What I did
- Drafted this README to make setup, testing, and grading reproducible.
- Explained how to run Elasticsearch in Docker and the Node backend (TypeScript).
- Documented environment variables, API endpoints intended for Postman testing, verification steps for each requirement, and optional vector DB/RAG instructions for suggested replies.

What's next
- If you want, I can add a ready-to-import Postman collection, Docker Compose (Elasticsearch + optional vector DB), and example .env.example file into the repo. I can also scaffold a minimal frontend if you'd like me to implement the UI and wire it to the backend.

Table of contents
- Project overview
- Features checklist (grading view)
- Architecture overview
- Requirements & pre-requisites
- Setup guide (Elasticsearch, Node backend, Slack & webhook testing)
- Running the backend (Postman first)
- Frontend (optional)
- AI / RAG / Vector DB suggestions
- Postman endpoints & example requests
- How to verify each requirement
- Contribution & leaderboard notes
- Troubleshooting

Project overview
This project implements a Onebox-like email aggregator (minimum 2 IMAP accounts supported) with:
- Real-time IMAP synchronization using persistent IMAP IDLE connections
- Storage of emails in Elasticsearch for full-text search and filtering
- AI-based email categorization into: Interested, Meeting Booked, Not Interested, Spam, Out of Office
- Slack notifications for new "Interested" messages
- Outgoing webhook trigger (webhook.site) for messages marked "Interested"
- A simple frontend to browse/search emails and see AI categories (if frontend is enabled)
- Optional RAG flow with a vector database to produce suggested replies (completing this gives a direct interview invite)

Features checklist (what to implement & test)
- [ ] 1. Real-Time Email Synchronization (minimum 2 IMAP accounts)
  - Persistent IMAP IDLE connections (no cron)
  - Fetch last 30 days of emails on initial sync
- [ ] 2. Searchable Storage using Elasticsearch (local Docker)
  - Indexing with folder & account metadata
  - Search APIs
- [ ] 3. AI-Based Email Categorization
  - Model or LLM-based labeling into 5 classes
- [ ] 4. Slack & Webhook Integration
  - Slack notify on "Interested"
  - Trigger webhook.site on "Interested"
- [ ] 5. Frontend Interface (simple)
  - Display, filter by account/folder, show AI labels, search
- [ ] 6. AI-Powered Suggested Replies (RAG + vector DB)
  - Store product/outreach agenda in vector DB
  - Use retrieval + LLM to suggest replies

Architecture overview
- IMAP Sync Engine (Node/TypeScript)
  - Maintains concurrent persistent IMAP IDLE connections for each configured account
  - On initial connect, fetches last 30 days of messages and indexes to Elasticsearch
  - On new-message events, downloads message, stores in ES, runs categorization, triggers Slack/webhook if needed
- Elasticsearch (Docker)
  - Stores indexed messages with fields: id, account, folder, from, to, subject, body, date, labels, raw headers
- AI Categorizer
  - Lightweight classifier endpoint that can call an LLM (OpenAI or local model) or a simple rule-based fallback
- Slack & Webhook
  - Slack: send message to configured webhook when label === Interested
  - Webhook: POST to user-provided URL (for demo we use webhook.site)
- Frontend (React / simple UI)
  - Calls backend search and message APIs; displays labels and triggers suggested-reply flow
- RAG / Vector DB
  - Ingest product/outreach docs into vector DB (Qdrant / Weaviate / Milvus / Pinecone)
  - At request time, retrieve context and ask LLM to produce suggested reply

Pre-requisites
- Node.js (>= 18 recommended)
- npm or yarn
- Docker (for Elasticsearch and optional vector DB)
- An Elasticsearch-compatible image (document below)
- IMAP credentials for at least 2 accounts (Gmail: enable IMAP and use App Password if using 2FA)
- Slack webhook URL for notifications (optional)
- webhook.site URL if you want to capture webhook events (optional)
- (Optional) OpenAI API key or other LLM credentials for categorization / RAG

Environment variables
Create a `.env` (or place values in your environment) with at least:

- SERVER_PORT=3000
- ELASTIC_URL=http://localhost:9200
- ELASTIC_USERNAME=elastic
- ELASTIC_PASSWORD=changeme
- IMAP_ACCOUNTS_JSON (JSON array with credentials, see below)
- SLACK_WEBHOOK_URL= (optional)
- INTERESTED_WEBHOOK_URL= (use webhook.site for demo)
- LLM_API_KEY= (OpenAI or other LLM key, optional)
- VECTOR_DB_ENDPOINT= (optional: qdrant/pinecone/weaviate)
- VECTOR_DB_API_KEY= (optional)

Example IMAP_ACCOUNTS_JSON
You can set this env var to a JSON string listing the accounts to sync, e.g.:
[
  {
    "id": "personal",
    "host": "imap.gmail.com",
    "port": 993,
    "tls": true,
    "user": "you@example.com",
    "password": "app-password-or-oauth-token",
    "folders": ["INBOX"]
  },
  {
    "id": "work",
    "host": "imap.mailserver.com",
    "port": 993,
    "tls": true,
    "user": "you@company.com",
    "password": "password",
    "folders": ["INBOX", "Promotions"]
  }
]

Setup guide

1) Run Elasticsearch locally (Docker)
- Quick start:
  docker run --name es-dev -p 9200:9200 -e "discovery.type=single-node" -e "ES_JAVA_OPTS=-Xms512m -Xmx512m" -d docker.elastic.co/elasticsearch/elasticsearch:8.9.0

- After starting, visit http://localhost:9200 to ensure ES is up.
- If Elasticsearch is secured (8.x by default), create the user/password and use them in ELASTIC_USERNAME/ELASTIC_PASSWORD.

2) (Optional) Vector DB
- Qdrant (Docker):
  docker run -p 6333:6333 -v qdrant_storage:/qdrant/storage qdrant/qdrant

- Weaviate (Docker) or Pinecone (managed) are alternatives.

3) Install dependencies
- Clone the repo:
  git clone https://github.com/kavyaa25/Email-Management-System.git
  cd Email-Management-System
- Install:
  npm install
  or
  yarn install

4) Build / Run backend (development)
- Build TypeScript (if project uses ts-node or build scripts):
  npm run build
  npm start
  or for dev:
  npm run dev

Running the backend (Postman-first flow)
The priority for this assignment is to demonstrate backend features via Postman. Use these endpoints (replace host/port if different):

Base URL: http://localhost:3000 (SERVER_PORT)

Auth: If present, use API key / Bearer token per repo config.

Important API endpoints (examples — adapt to actual implementation)
- GET /health
- POST /sync/start
  - Body: { accountId?: "personal" } — starts IMAP sync & IDLE connections
- POST /sync/stop
  - Body: { accountId?: "personal" }
- GET /emails?query=...&account=personal&folder=INBOX&from=2025-01-01
  - Returns paginated search results from Elasticsearch
- GET /emails/:id
  - Returns full email including raw headers & AI labels
- POST /emails/:id/label
  - Body: { label: "Interested" } — forces label and triggers Slack/webhook if "Interested"
- POST /ingest-docs (for RAG)
  - Body: { docs: [{ id, text, metadata }] } — index into vector DB
- POST /suggest-reply
  - Body: { emailId, agendaId } — runs RAG + LLM and returns suggested replies

Postman testing guidance
- Start ES and backend.
- Seed IMAP_ACCOUNTS_JSON env var and trigger `POST /sync/start`.
- Verify initial backfill (last 30 days) by calling `GET /emails` and filtering.
- Send a test email to one of the accounts; observe real-time arrival logged by backend and new document in Elasticsearch.
- Confirm categorization field is present on the email object.
- If label === "Interested", ensure Slack message and webhook.site POST were received.

AI Categorization
- Default behavior can use an LLM (OpenAI, Anthropic, local LLM) via a classification prompt that returns one of the five labels.
- Provide a fallback simple heuristic if no LLM key is present:
  - "meeting", "schedule", "call" → Meeting Booked
  - "unsubscribe", "coupon" etc. → Spam / Not Interested
  - "out of office", "away" → Out of Office
  - presence of positive keywords + reply requests → Interested

Slack & Webhook behavior
- Slack: Post JSON to SLACK_WEBHOOK_URL containing minimal information (subject, from, account, direct link to UI)
- Webhook: POST to INTERESTED_WEBHOOK_URL with the email payload (subject, from, body, labels)
- Use webhook.site to show webhook payloads during grading.

Frontend (simple)
- Minimal React app (served separately or via the backend) that:
  - Lists emails with filters (account, folder)
  - Shows AI categorization tag
  - Provides search powered by Elasticsearch
  - Offers "Suggest Reply" button to call /suggest-reply endpoint

AI-Powered Suggested Replies (RAG)
- Store product/outreach agenda and canned messages in a vector DB (Qdrant/Weaviate).
- At request time, retrieve top-k documents for context, then call the LLM with instruction + context + received email to produce reply suggestions.
- Example training data sample:
  - "If lead is interested, share meeting booking link: https://cal.com/example"
- Example flow:
  1. POST /ingest-docs with outreach doc
  2. When an email is labeled Interested, click "Suggest Reply"
  3. Backend retrieves related docs, concatenates context, sends prompt to LLM and returns suggestion

How to verify each requirement quickly
1) Real-time IMAP (2 accounts)
- Set two IMAP accounts and call /sync/start.
- Send messages to both accounts and watch for near-instant indexing to ES (no polling logs; IDLE event logs).

2) ES Search
- Query GET /emails?query=your+term to confirm full-text search.
- Filter by ?account= and ?folder= parameters.

3) AI Categorization
- Inspect /emails/:id -> check label field populated.
- For manual testing, call POST /emails/:id/label to force and verify downstream effects.

4) Slack & webhooks
- Trigger an email labeled Interested, then check Slack channel and webhook.site.

5) Frontend
- Open UI, filter by account/folder, view labels, run search.

6) Suggested Replies (RAG)
- Ingest agenda docs and call /suggest-reply. Verify response includes LLM-generated reply that references your agenda (e.g., booking link).

Security notes
- Do not commit secret keys. Use .env and .gitignore.
- When using Gmail, prefer app passwords or OAuth flow (store refresh tokens securely).

Testing & logging
- Backend logs:
  - IMAP connection events (connected, disconnected, new message)
  - ES indexing events
  - Categorization decisions
  - Slack/webhook sends
- Provide Postman collection (recommended) with sample requests for each API.

Suggested enhancements (nice-to-have)
- OAuth for Gmail accounts instead of storing passwords
- Multi-tenant support and UI for connecting new accounts
- Background job to re-classify emails with improved model
- Pagination + sorting by relevance in ES search
- Unit & integration tests for sync engine, categorizer, and ES connectors

Contribution & leaderboard
- Make a PR for feature work with the target branch `features/*`.
- For leaderboard grading, include a feature-completion file or update PR description with checkboxes referencing the Features checklist above.
- Label PRs with the features implemented; the maintainer will run tests/manual acceptance.

Troubleshooting
- Elasticsearch connection errors:
  - Check docker container status: docker ps
  - Ensure ELASTIC_URL and credentials match the running container
- IMAP issues:
  - Ensure IMAP is enabled for your account, and credentials are correct (use app password for Gmail)
  - Check that the host and port are correct (usually host: imap.gmail.com, port: 993, tls: true)
- LLM issues:
  - Verify LLM_API_KEY and network accessibility
- Slack/Webhook:
  - If not firing, look at backend logs for webhook POST errors and check webhook.site for incoming hits

Example quick commands
- Start Elasticsearch:
  docker run --name es-dev -p 9200:9200 -e "discovery.type=single-node" -d docker.elastic.co/elasticsearch/elasticsearch:8.9.0

- Run backend dev:
  export IMAP_ACCOUNTS_JSON='[...]'
  npm run dev

- Start syncing for account "personal" via curl:
  curl -X POST http://localhost:3000/sync/start -H "Content-Type: application/json" -d '{"accountId":"personal"}'

License
- MIT (or change as appropriate)

Contact / Maintainer
- repo: https://github.com/kavyaa25/Email-Management-System
- maintainer: kavyaa25

---

If you want, I can:
- Add a .env.example and Docker Compose (Elasticsearch + Qdrant) to the repository.
- Produce a Postman collection (exportable) with all demo requests.
- Scaffold a minimal React frontend and wire it to the backend endpoints.

Tell me which of the above you'd like next and I'll prepare the files (Postman collection, docker-compose.yml, .env.example, or a frontend scaffold) and push them to the repository.
