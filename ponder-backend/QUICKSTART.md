# Ponder Backend - Quick Start Guide

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database running
- Gemini API key

## Setup Steps

### 1. Navigate to backend directory

```bash
cd /Users/fishy/Desktop/lunwen/ponder-backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
# Copy template
cp .env.example .env

# Edit .env file with your credentials
# Required variables:
# - DATABASE_URL=postgresql://username:password@localhost:5432/ponder
# - GEMINI_API_KEY=your-api-key-here
# - PORT=3001
# - UPLOAD_DIR=./uploads
```

### 4. Setup PostgreSQL

Create a database:

```sql
CREATE DATABASE ponder;
```

### 5. Initialize Prisma

```bash
# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate
```

### 6. Start development server

```bash
npm run dev
```

Server should be running on `http://localhost:3001`

### 7. Test the API

```bash
# Health check
curl http://localhost:3001/health
```

## API Examples

### Upload PDF

```bash
curl -X POST http://localhost:3001/api/upload \
  -F "pdf=@/path/to/your/file.pdf" \
  -F "userId=test-user-id" \
  -F "title=My Research Paper"
```

Response:
```json
{
  "success": true,
  "data": {
    "workspaceId": "uuid-here",
    "title": "My Research Paper",
    "numPages": 15
  }
}
```

### Generate Mind Map

```bash
curl -X POST http://localhost:3001/api/ai/mindmap \
  -H "Content-Type: application/json" \
  -d '{"workspaceId": "your-workspace-id"}'
```

## Troubleshooting

### Database connection failed
- Ensure PostgreSQL is running
- Check DATABASE_URL in .env
- Verify database exists

### PDF upload fails
- Check UPLOAD_DIR exists and is writable
- Verify file size is under 50MB
- Ensure file is actually a PDF

### AI generation fails
- Verify GEMINI_API_KEY is set correctly
- Check API quota/limits
- Review server logs for detailed error

## Project Structure

```
ponder-backend/
├── src/
│   ├── app.ts                    # Main entry point
│   ├── controllers/              # Request handlers
│   │   ├── ai.controller.ts      # AI endpoints
│   │   └── workspace.controller.ts
│   ├── routes/                   # API routes
│   ├── services/                 # Business logic
│   │   ├── ai.service.ts         # Gemini integration
│   │   └── pdf.service.ts        # PDF extraction with [Page X]
│   └── types/
├── prisma/
│   └── schema.prisma            # Database models
└── uploads/                     # PDF storage (created on first run)
```

## Next Steps

1. Update frontend to call backend APIs instead of client-side functions
2. Implement authentication (JWT)
3. Add user management endpoints
4. Implement session history sidebar
5. Add S3/cloud storage for production

## Important Notes

- **Page Markers**: PDF extraction adds `[Page X]` markers automatically
- **Source Grounding**: AI mindmap includes `quote` and `page` fields
- **Chat Streaming**: Uses Server-Sent Events (SSE)
- **CORS**: Configured for localhost:5173 (Vite dev server)
