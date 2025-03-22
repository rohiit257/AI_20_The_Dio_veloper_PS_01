# AI Avatar Assistant Backend

This is the backend for the AI Avatar Assistant project. It's built with Node.js, Express, and Socket.io, designed to be deployed on Railway.

## Deployment to Railway

### Prerequisites
- A Railway account
- Git repository with this code

### Steps to Deploy

1. Push this repository to GitHub
2. Log in to your Railway account
3. Click "New Project" > "Deploy from GitHub repo"
4. Select your repository
5. Configure the project:
   - Root Directory: backend
   - Start Command: npm start

6. Add the following environment variables in the Railway dashboard:
   - `PORT`: 3000 (Railway will override this with its own port)
   - `FRONTEND_URL`: URL of your Vercel frontend (e.g., https://ai-avatar-assistant.vercel.app)
   - `GEMINI_API_KEY`: Your Google Gemini API key
   - `ELEVENLABS_API_KEY`: Your ElevenLabs API key
   - `DID_API_KEY`: Your D-ID API key
   - `PINECONE_API_KEY`: Your Pinecone API key
   - `PINECONE_ENVIRONMENT`: Your Pinecone environment
   - `PINECONE_INDEX`: Your Pinecone index name

7. Click "Deploy"

## Development

To run the backend locally:

```bash
npm install
npm run dev
```

The backend will be available at http://localhost:5000.

## Environment Variables

Create a `.env` file with the following variables:

```
PORT=5000
FRONTEND_URL=http://localhost:3000
GEMINI_API_KEY=your_gemini_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
DID_API_KEY=your_did_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=your_pinecone_environment
PINECONE_INDEX=your_pinecone_index_name 