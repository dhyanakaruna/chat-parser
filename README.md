# Chat Parser App

A full-stack Next.js application that uses AI to parse chat files and extract structured data. Upload `.txt` chat files and let OpenAI's GPT-4 automatically extract messages with sender information, timestamps, and content.

## 🚀 Features

- **File Upload**: Drag-and-drop or click to upload `.txt` chat files
- **AI Processing**: Uses OpenAI GPT-4 to intelligently parse chat logs
- **Database Storage**: Stores extracted data in Vercel Postgres
- **Modern UI**: Beautiful, responsive interface with TailwindCSS
- **Search & Filter**: Find messages by content, sender, or date
- **Real-time Updates**: See results immediately after processing

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: Vercel Postgres
- **AI Service**: OpenAI GPT-4
- **Deployment**: Vercel

## 📋 Prerequisites

- Node.js 18+ 
- OpenAI API key
- Vercel account (for database and deployment)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd chat-parser
npm install
```

### 2. Environment Setup

Copy the environment template:
```bash
cp env.example .env.local
```

Fill in your environment variables in `.env.local`:

```env
# OpenAI API Key (required)
OPENAI_API_KEY=your_openai_api_key_here

# Vercel Postgres Database URLs (required for production)
POSTGRES_URL=your_postgres_url_here
POSTGRES_PRISMA_URL=your_postgres_prisma_url_here
POSTGRES_URL_NON_POOLING=your_postgres_url_non_pooling_here
POSTGRES_USER=your_postgres_user_here
POSTGRES_HOST=your_postgres_host_here
POSTGRES_PASSWORD=your_postgres_password_here
POSTGRES_DATABASE=your_postgres_database_here
```

### 3. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 🗄 Database Schema

The application uses a simple PostgreSQL schema:

```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🤖 AI Prompt Design

The application uses a carefully designed prompt to ensure consistent and accurate parsing:

```
You are a chat log parser. Parse the following chat log text and extract structured data.

Return ONLY a valid JSON array where each object has the following structure:
{
  "sender": "string (name of the person who sent the message)",
  "timestamp": "string (timestamp or time of the message)",
  "message": "string (the actual message content)"
}

Rules:
1. Extract ALL messages from the chat log
2. If timestamp is not available, use "Unknown" as the value
3. If sender is not available, use "Unknown" as the value
4. Clean up the message content (remove extra whitespace, but preserve line breaks within messages)
5. Return ONLY the JSON array, no other text or explanation
6. Ensure the JSON is valid and properly formatted
```

## 📁 Project Structure

```
chat-parser/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── upload/route.ts      # File upload and AI processing
│   │   │   └── messages/route.ts    # Fetch stored messages
│   │   ├── globals.css              # Global styles
│   │   ├── layout.tsx               # Root layout
│   │   └── page.tsx                 # Main page
│   └── components/
│       ├── FileUpload.tsx           # File upload component
│       └── ChatMessages.tsx         # Messages display component
├── lib/
│   └── db.ts                        # Database operations
├── package.json
└── README.md
```

## 🚀 Deployment on Vercel

### 1. Set up Vercel Postgres

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Create a new project or select existing one
3. Go to Storage tab and create a Postgres database
4. Copy the connection details to your environment variables

### 2. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add OPENAI_API_KEY
vercel env add POSTGRES_URL
# ... add all other environment variables
```

### 3. Environment Variables in Vercel

Add these environment variables in your Vercel project settings:

- `OPENAI_API_KEY`: Your OpenAI API key
- `POSTGRES_URL`: Vercel Postgres connection URL
- `POSTGRES_PRISMA_URL`: Prisma connection URL
- `POSTGRES_URL_NON_POOLING`: Non-pooling connection URL
- `POSTGRES_USER`: Database username
- `POSTGRES_HOST`: Database host
- `POSTGRES_PASSWORD`: Database password
- `POSTGRES_DATABASE`: Database name

## 🔧 API Endpoints

### POST `/api/upload`
Upload and process a chat file.

**Request**: `multipart/form-data` with `file` field
**Response**: 
```json
{
  "success": true,
  "message": "Successfully processed 15 messages",
  "data": [...]
}
```

### GET `/api/messages`
Fetch all stored chat messages.

**Query Parameters**:
- `sender` (optional): Filter by sender name

**Response**:
```json
{
  "success": true,
  "data": [...],
  "count": 15
}
```

## 🎨 Features in Detail

### File Upload
- Drag-and-drop interface
- File type validation (`.txt` only)
- Loading states and error handling
- File size limits

### AI Processing
- Uses GPT-4 for intelligent parsing
- Handles various chat formats
- Extracts sender, timestamp, and message content
- Robust error handling and validation

### Data Display
- Search functionality
- Filter by sender
- Sort by date or sender
- Responsive design
- Dark mode support

## 🛡 Security Considerations

- OpenAI API key is never exposed to the client
- All AI processing happens server-side
- File upload validation and sanitization
- SQL injection protection with parameterized queries

## 🐛 Troubleshooting

### Common Issues

1. **"OpenAI API key not configured"**
   - Ensure `OPENAI_API_KEY` is set in your environment variables

2. **Database connection errors**
   - Verify all Postgres environment variables are correct
   - Check that your Vercel Postgres database is active

3. **File upload fails**
   - Ensure file is `.txt` format
   - Check file size (should be under 10MB)
   - Verify file is not empty

4. **AI parsing errors**
   - Check OpenAI API key validity
   - Ensure you have sufficient OpenAI credits
   - Verify the chat file format is readable

## 📝 Assumptions and Limitations

### Assumptions
- Chat files are in plain text format
- Messages follow common chat patterns (sender: message or timestamp - sender: message)
- Users have valid OpenAI API access

### Limitations
- Only supports `.txt` files
- File size limited to 10MB
- Requires OpenAI API credits for processing
- Parsing accuracy depends on chat file format consistency

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the troubleshooting section above
2. Review the API documentation
3. Open an issue on GitHub
4. Check OpenAI API status and documentation

---

Built with ❤️ using Next.js, OpenAI, and Vercel.
