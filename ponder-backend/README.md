# Ponder Backend

Backend server for Ponder - AI-powered reading assistant with PDF analysis and mind mapping.

## Tech Stack

- **Server:** Express.js + TypeScript
- **Database:** PostgreSQL + Prisma ORM
- **AI:** Google Gemini API
- **File Processing:** Multer + pdf-parse

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL`: PostgreSQL connection string
- `GEMINI_API_KEY`: Your Google Gemini API key
- `PORT`: Server port (default 3001)
- `UPLOAD_DIR`: Directory for uploaded PDFs

### 3. Setup Database

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Open Prisma Studio
npm run prisma:studio
```

### 4. Start Development Server

```bash
npm run dev
```

Server will run on `http://localhost:3001`

## API Endpoints

### Workspace Management

- `POST /api/upload` - Upload and process PDF
  - Body: `multipart/form-data` with `pdf` file and `userId`, `title`
  - Returns: `{ workspaceId, title, numPages }`

- `GET /api/workspace/:id` - Get workspace with nodes/edges
  
- `PUT /api/workspace/:id/canvas` - Save canvas state
  - Body: `{ nodes: Node[], edges: Edge[] }`

### AI Features

- `POST /api/ai/mindmap` - Generate mind map
  - Body: `{ workspaceId: string }`
  - Returns: `{ root, children: [...] }` with quotes and page numbers

- `POST /api/ai/deepdive` - Generate detailed explanation
  - Body: `{ workspaceId: string, concept: string }`
  
- `POST /api/ai/chat` - Stream chat response (SSE)
  - Body: `{ workspaceId: string, messages: [...] }`

## Key Features

### PDF Text Extraction with Page Markers

The backend automatically injects `[Page X]` markers into extracted text:

```
[Page 1]
Introduction text here...

[Page 2]
Chapter 1 content...
```

This enables the frontend to:
- Highlight exact source quotes in the PDF viewer
- Display page numbers for each mind map node
- Jump to specific pages when clicking nodes

### Source-Grounded Mind Maps

AI responses include:
- `quote`: Verbatim text from the document
- `page`: Page number inferred from markers
- `label`: Concept summary

Example:
```json
{
  "label": "Introduction to Neural Networks",
  "quote": "Artificial neural networks are computing systems inspired by biological neural networks.",
  "page": 1,
  "children": [...]
}
```

## Project Structure

```
ponder-backend/
├── src/
│   ├── app.ts              # App entry point
│   ├── controllers/        # Request handlers
│   │   ├── ai.controller.ts
│   │   └── workspace.controller.ts
│   ├── routes/            # API route definitions
│   │   ├── ai.routes.ts
│   │   └── workspace.routes.ts
│   ├── services/          # Business logic
│   │   ├── ai.service.ts
│   │   └── pdf.service.ts
│   └── types/             # TypeScript types
├── prisma/
│   └── schema.prisma      # Database schema
├── uploads/               # Uploaded PDFs (gitignored)
├── .env                   # Environment variables
└── package.json
```

## Database Schema

- **User**: User accounts
- **Workspace**: PDF documents with extracted text
- **Node**: Mind map nodes (position, data)
- **Edge**: Connections between nodes
- **ChatSession**: Conversation history

## Development

```bash
# Watch mode
npm run dev

# Build
npm run build

# Production
npm start
```

## Notes

- PDF files are stored in `./uploads` directory
- Text extraction preserves page structure with markers
- All AI features require valid `GEMINI_API_KEY`
- CORS configured for `localhost:5173` (frontend dev server)
