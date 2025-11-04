# 🚀 StudySpark Backend Deployment Guide

Complete guide for deploying the StudySpark backend API to production.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Variables](#environment-variables)
3. [Railway Deployment (Recommended)](#railway-deployment-recommended)
4. [Render Deployment](#render-deployment)
5. [Heroku Deployment](#heroku-deployment)
6. [Manual VPS Deployment](#manual-vps-deployment)
7. [Post-Deployment Steps](#post-deployment-steps)
8. [Connecting Frontend](#connecting-frontend)

---

## Prerequisites

Before deploying, ensure you have:

- ✅ MongoDB Atlas cluster setup (already done)
- ✅ GitHub repository with backend code
- ✅ `.env` file configured with all required variables
- ✅ Authentication endpoints tested locally
- ✅ Domain name (optional, but recommended for production)

---

## Environment Variables

All deployment platforms require these environment variables:

```env
# Server
PORT=3001
NODE_ENV=production

# Database
MONGODB_URI=mongodb+srv://chisomhenryg_db_user:7E9DHrRshI7CdKj8@cluster0.bgvopnc.mongodb.net/studyspark?retryWrites=true&w=majority

# JWT
JWT_SECRET=studyspark-super-secret-jwt-key-change-in-production-12345
JWT_EXPIRES_IN=7d

# CORS
FRONTEND_URL=https://studyspark.vercel.app

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# OpenAI (for future AI features)
OPENAI_API_KEY=your-openai-key-here
```

⚠️ **IMPORTANT**: Generate a new JWT_SECRET for production:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Railway Deployment (Recommended)

Railway is modern, easy to use, and has generous free tier.

### Step 1: Sign Up
1. Go to [Railway.app](https://railway.app)
2. Sign up with GitHub

### Step 2: Create New Project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your `studypack-backend` repository
4. Railway will auto-detect Node.js

### Step 3: Configure Environment Variables
1. Click on your service
2. Go to "Variables" tab
3. Add all environment variables (see list above)
4. Click "Deploy"

### Step 4: Configure Build Settings
Railway should auto-detect, but verify:
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### Step 5: Get Your URL
1. Go to "Settings" tab
2. Click "Generate Domain"
3. Your API will be at: `https://your-app.railway.app`

### Step 6: Update MongoDB Network Access
1. Go to MongoDB Atlas dashboard
2. Network Access → Add IP Address
3. Click "Allow Access from Anywhere" (0.0.0.0/0)
4. Confirm

### Railway Advantages:
- ✅ Free tier: 500 hours/month, $5 credit
- ✅ Auto-deploy from GitHub
- ✅ Custom domains
- ✅ Automatic HTTPS
- ✅ Easy environment variables
- ✅ Logs and metrics

---

## Render Deployment

Render offers free tier with automatic SSL.

### Step 1: Sign Up
1. Go to [Render.com](https://render.com)
2. Sign up with GitHub

### Step 2: Create Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Select `studypack-backend` repo

### Step 3: Configure Service
Fill in these settings:
- **Name**: `studyspark-api`
- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Instance Type**: `Free`

### Step 4: Add Environment Variables
1. Scroll to "Environment Variables"
2. Click "Add Environment Variable"
3. Add all variables from list above
4. **Important**: Set `PORT` to `10000` (Render's default)

### Step 5: Deploy
1. Click "Create Web Service"
2. Wait for deployment (5-10 minutes)
3. Your API will be at: `https://studyspark-api.onrender.com`

### Step 6: Configure Health Checks (Optional)
1. Go to service settings
2. Health Check Path: `/health`
3. Save

### Render Notes:
- ✅ Free tier available
- ✅ Custom domains
- ✅ Auto-deploy from GitHub
- ⚠️ Free tier spins down after 15 min inactivity (first request takes 30s)
- ⚠️ 750 hours/month free tier limit

---

## Heroku Deployment

Heroku is reliable but no longer has a free tier.

### Step 1: Install Heroku CLI
```bash
# macOS
brew install heroku/brew/heroku

# Or download from heroku.com
```

### Step 2: Login and Create App
```bash
heroku login
cd /Users/i/studypack-backend
heroku create studyspark-api
```

### Step 3: Set Environment Variables
```bash
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI="mongodb+srv://chisomhenryg_db_user:7E9DHrRshI7CdKj8@cluster0.bgvopnc.mongodb.net/studyspark"
heroku config:set JWT_SECRET="your-new-secret-here"
heroku config:set JWT_EXPIRES_IN="7d"
heroku config:set FRONTEND_URL="https://studyspark.vercel.app"
```

### Step 4: Create Procfile
```bash
echo "web: npm start" > Procfile
```

### Step 5: Deploy
```bash
git add .
git commit -m "Prepare for Heroku deployment"
git push heroku main
```

### Step 6: Open App
```bash
heroku open
# Or visit: https://studyspark-api.herokuapp.com
```

### Heroku Notes:
- 💰 Starts at $7/month (Eco dyno)
- ✅ Very reliable
- ✅ Add-ons marketplace
- ✅ Advanced monitoring

---

## Manual VPS Deployment

For DigitalOcean, AWS, or any VPS.

### Step 1: Provision Server
Example: Ubuntu 22.04 LTS droplet on DigitalOcean

### Step 2: SSH into Server
```bash
ssh root@your-server-ip
```

### Step 3: Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
apt-get install -y nginx
```

### Step 4: Install PM2
```bash
npm install -g pm2
```

### Step 5: Clone Repository
```bash
cd /var/www
git clone https://github.com/yourusername/studypack-backend.git
cd studypack-backend
npm install --production
```

### Step 6: Create .env File
```bash
nano .env
# Paste all environment variables
# Press Ctrl+X, then Y to save
```

### Step 7: Start with PM2
```bash
pm2 start src/server.js --name studyspark-api
pm2 save
pm2 startup
```

### Step 8: Configure Nginx
```bash
nano /etc/nginx/sites-available/studyspark
```

Paste this configuration:
```nginx
server {
    listen 80;
    server_name api.studyspark.dev;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
ln -s /etc/nginx/sites-available/studyspark /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### Step 9: Setup SSL with Let's Encrypt
```bash
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d api.studyspark.dev
```

### Step 10: Configure Firewall
```bash
ufw allow 22
ufw allow 80
ufw allow 443
ufw enable
```

---

## Post-Deployment Steps

### 1. Test API Health
```bash
curl https://your-api-url.com/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "StudySpark API is running!",
  "timestamp": "2025-11-04T15:55:38.162Z",
  "docs": "/api-docs"
}
```

### 2. Test Authentication
```bash
curl -X POST https://your-api-url.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@studyspark.com",
    "password": "password123",
    "name": "Test User",
    "school": "University of Lagos",
    "course": "Computer Science",
    "level": "200"
  }'
```

### 3. View API Documentation
Visit: `https://your-api-url.com/api-docs`

### 4. Setup Monitoring
Consider adding:
- **Sentry**: Error tracking
- **LogRocket**: Session replay
- **UptimeRobot**: Uptime monitoring

---

## Connecting Frontend

After deploying backend, update frontend environment variables.

### Update `.env.local` in Frontend
```env
# Production Backend URL
NEXT_PUBLIC_API_URL=https://your-api-url.com/api/v1

# Disable mock API
NEXT_PUBLIC_USE_MOCK_API=false

# WebSocket URL (for live quiz later)
NEXT_PUBLIC_WS_URL=wss://your-api-url.com
```

### Deploy Frontend to Vercel
```bash
cd /Users/i/studypack
vercel
```

Follow prompts:
1. Link to existing project or create new
2. Set environment variables in Vercel dashboard
3. Deploy

### Update CORS in Backend
After getting frontend URL, update backend `.env`:
```env
FRONTEND_URL=https://studyspark.vercel.app
```

Redeploy backend for CORS changes to take effect.

---

## 🔒 Security Checklist

Before going live, ensure:

- [ ] Changed JWT_SECRET to strong random value
- [ ] Set NODE_ENV=production
- [ ] HTTPS enabled (SSL certificate)
- [ ] Rate limiting configured
- [ ] MongoDB IP whitelist configured
- [ ] Environment variables not in code
- [ ] Error messages don't expose sensitive info
- [ ] CORS configured to only allow your frontend

---

## 📊 Monitoring & Logs

### Railway Logs
```
Dashboard → Your Service → Logs tab
```

### Render Logs
```
Dashboard → Your Service → Logs tab
```

### Heroku Logs
```bash
heroku logs --tail
```

### PM2 Logs (VPS)
```bash
pm2 logs studyspark-api
```

---

## 🐛 Troubleshooting

### MongoDB Connection Failed
- Check MongoDB Atlas network access allows your deployment IP
- Verify MONGODB_URI is correct
- Ensure MongoDB user has correct permissions

### CORS Errors
- Verify FRONTEND_URL in .env matches your frontend domain
- Check frontend is sending requests to correct API URL

### 502 Bad Gateway
- Check if server process is running
- Verify PORT configuration
- Check server logs for startup errors

### SSL Certificate Issues
- For Railway/Render: Automatic, no action needed
- For VPS: Ensure certbot ran successfully
- Verify DNS is pointing to correct IP

---

## 💰 Cost Comparison

| Platform | Free Tier | Paid Starting | Best For |
|----------|-----------|---------------|----------|
| **Railway** | $5 credit | ~$5/month | Quick start, testing |
| **Render** | 750 hrs/month | $7/month | MVP, small apps |
| **Heroku** | None | $7/month | Reliability, scale |
| **DigitalOcean** | None | $6/month | Full control, scale |

**Recommendation**: Start with Railway or Render for testing, then move to VPS for production scale.

---

## 🎯 Quick Start (Railway)

Fastest way to deploy:

```bash
# 1. Push code to GitHub (if not already)
git add .
git commit -m "Ready for deployment"
git push origin main

# 2. Go to railway.app
# 3. New Project → Deploy from GitHub
# 4. Add environment variables
# 5. Done! API is live
```

Total time: **5 minutes** ⚡

---

## 📞 Support

If you encounter issues:
1. Check server logs
2. Verify environment variables
3. Test locally first
4. Check MongoDB Atlas connection
5. Review error messages in deployment platform

---

**Backend is production-ready! 🎉**

Next steps:
- Deploy to Railway/Render
- Update frontend with production API URL
- Test full authentication flow
- Add OpenAI API key when ready for AI features
- Monitor logs and performance

Built for StudySpark with ❤️
