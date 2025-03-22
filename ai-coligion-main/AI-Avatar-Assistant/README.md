# AI Avatar Assistant for IDMS ERP

A next-generation AI-driven assistant with human-like avatar capabilities designed specifically for IDMS ERP support. This application provides an intuitive interface for ERP users to get instant answers through natural conversation with a realistic avatar.

## Deployment Instructions

This project uses a microservices architecture with the frontend and backend deployed separately:

### Frontend (Vercel)

1. **Create a GitHub repository** and push the code
2. **Deploy on Vercel**
   - Connect to your GitHub repository
   - Set the root directory to `/frontend`
   - Add environment variable: `NEXT_PUBLIC_BACKEND_URL` with your Railway backend URL

Detailed instructions are in the [frontend README](./frontend/README.md).

### Backend (Railway)

1. **Create a GitHub repository** if not already done
2. **Deploy on Railway**
   - Connect to your GitHub repository
   - Set the root directory to `/backend`
   - Add all required environment variables:
     - `PORT`: 3000 (Railway will override this)
     - `FRONTEND_URL`: Your Vercel frontend URL
     - API keys for Gemini, ElevenLabs, D-ID, and Pinecone

Detailed instructions are in the [backend README](./backend/README.md).

## Environment Setup

### Backend Environment Variables

Create a `.env` file in the backend directory with:

```
PORT=5000
FRONTEND_URL=http://localhost:3000
GEMINI_API_KEY=your_gemini_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
DID_API_KEY=your_did_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=your_pinecone_environment
PINECONE_INDEX=your_pinecone_index_name
```

### Frontend Environment Variables

Create a `.env.local` file in the frontend directory with:

```
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
NEXT_PUBLIC_DID_CLIENT_KEY=your_did_client_key_here
NEXT_PUBLIC_DID_AGENT_ID=your_did_agent_id_here
```

## Local Development

### Starting the Backend

```bash
cd backend
npm install
npm run dev
```

### Starting the Frontend

```bash
cd frontend
npm install
npm run dev
```

### Full-Stack Development

Use the provided script to start both services:

```bash
./start-all.bat
```

## Features

- **Multimodal Interaction**: Text chat, voice input, human-like avatar
- **Intelligent Responses**: ERP-specific knowledge with AI-generated fallbacks
- **Realistic Avatars**: Multiple styles with real-time lip-syncing
- **Natural Speech**: Lifelike voice synthesis in multiple languages
- **Multilingual Support**: 7 languages including English, Spanish, Hindi, etc.
- **Intuitive Interface**: Clean, responsive design for all devices

See the [IMPROVEMENTS.md](./IMPROVEMENTS.md) file for a complete list of enhancements made to the application.

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

## D-ID Agent Integration

This project now integrates with D-ID's agent for avatar visualization. To set up:

1. Create an account at [D-ID](https://www.d-id.com/)
2. Create a new agent in your D-ID dashboard
3. Copy your Client Key and Agent ID
4. Update the following environment variables in `frontend/.env.local`:
   ```
   NEXT_PUBLIC_DID_CLIENT_KEY=your_did_client_key_here
   NEXT_PUBLIC_DID_AGENT_ID=your_did_agent_id_here
   ```

The D-ID agent will appear on all pages of your application and will respond to user queries with the responses generated by the Gemini API. 