---
description: How to deploy the Fekra frontend application
---

# Fekra Frontend Deployment Workflow

## Prerequisites

- Node.js 18+ installed
- Access to the deployment environment (Netlify/Vercel/Other)
- Environment variables configured

## Deployment Steps

### 1. Build the Application

```bash
# Navigate to frontend directory
cd kalima-platform/frontend

# Install dependencies
npm install

# Build for production
npm run build
```

### 2. Environment Variables

Ensure the following environment variables are set:

- `VITE_API_URL` - Backend API URL
- `VITE_APP_ENV` - Application environment (production/staging)

### 3. Deploy to Netlify

```bash
# Deploy using Netlify CLI
netlify deploy --prod --dir=dist
```

### 4. Verify Deployment

- Check the live URL
- Verify API connectivity
- Test key user flows

## Rollback

If issues are detected:

```bash
# Rollback to previous version
netlify deploy --prod --dir=dist-previous
```
