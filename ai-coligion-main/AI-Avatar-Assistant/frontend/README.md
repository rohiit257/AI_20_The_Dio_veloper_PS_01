# AI Avatar Assistant Frontend

This is the frontend for the AI Avatar Assistant project. It's built with Next.js and deployed on Vercel.

## Deployment to Vercel

### Prerequisites
- A Vercel account
- Git repository with this code

### Steps to Deploy

1. Push this repository to GitHub
2. Log in to your Vercel account
3. Click "Add New" > "Project"
4. Import your Git repository
5. Configure the project:
   - Framework Preset: Next.js
   - Root Directory: frontend
   - Build Command: npm run build
   - Output Directory: .next

6. Add the following environment variables:
   - `NEXT_PUBLIC_BACKEND_URL`: URL of your Railway backend (e.g., https://ai-avatar-assistant-backend.up.railway.app)

7. Click "Deploy"

## Development

To run the frontend locally:

```bash
npm install
npm run dev
```

The frontend will be available at http://localhost:3000.

## Environment Variables

- `NEXT_PUBLIC_BACKEND_URL`: URL of the backend API (default: http://localhost:5000) 