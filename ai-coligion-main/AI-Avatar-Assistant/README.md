# AI Avatar Assistant

AI-driven assistant with human-like avatar for ERP support. This application provides a chat interface with an AI assistant and features realistic avatar generation and text-to-speech capabilities.

## Features

- Natural language query processing with Google's Gemini API
- Realistic avatar generation with D-ID
- High-quality text-to-speech with ElevenLabs
- Vector database knowledge base with Pinecone
- Voice input for hands-free interaction
- Real-time communication with WebSockets

## Technology Stack

- **Frontend**: Next.js, React, TypeScript
- **Backend**: Node.js, Express, Socket.io
- **AI & Language**: Google Gemini API, Vector embeddings
- **Speech & Avatar**: ElevenLabs API, D-ID API
- **Database**: Pinecone vector database

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm or yarn
- API keys for:
  - [Google Gemini API](https://ai.google.dev/)
  - [ElevenLabs](https://elevenlabs.io/)
  - [D-ID](https://www.d-id.com/)
  - [Pinecone](https://www.pinecone.io/)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd AI-Avatar-Assistant
   ```

2. **Set up the backend**

   ```bash
   cd backend
   npm install
   cp .env.example .env
   ```

   Then edit the `.env` file to add your API keys.

3. **Set up the frontend**

   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

1. **Start the backend server**

   ```bash
   cd backend
   npm run dev
   ```

2. **Start the frontend development server**

   ```bash
   cd frontend
   npm run dev
   ```

3. **Access the application**

   Open your browser and navigate to `http://localhost:3000`

## Project Structure

```
AI-Avatar-Assistant/
├── frontend/                 # Next.js frontend application
│   ├── src/
│   │   ├── app/              # Next.js app directory
│   │   ├── components/       # React components
│   │   ├── lib/              # Utility functions and services
│   │   └── styles/           # CSS files
│   ├── package.json
│   └── tsconfig.json
│
├── backend/                  # Express backend application
│   ├── src/
│   │   ├── controllers/      # Request handlers
│   │   ├── routes/           # API routes
│   │   ├── services/         # Business logic
│   │   └── index.ts          # Entry point
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

## License

This project is licensed under the ISC License. 