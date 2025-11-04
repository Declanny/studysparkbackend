# 🚀 Quick Backend Deployment Setup

Complete step-by-step guide to deploy your StudySpark backend.

---

## Step 1: Create Separate GitHub Repository

Yes, the backend should be in a **separate GitHub repository** for clean deployment.

### Create New GitHub Repo

1. Go to [GitHub.com](https://github.com)
2. Click "+" → "New repository"
3. Name: `studypack-backend` or `studyspark-backend`
4. Description: "StudySpark Backend API - AI-powered study assistant"
5. **Important**: Choose **Private** (contains sensitive code)
6. ❌ Don't initialize with README (we already have files)
7. Click "Create repository"

---

## Step 2: Initialize Git and Push Code

Run these commands in your backend directory:

```bash
# Navigate to backend
cd /Users/i/studypack-backend

# Initialize git
git init

# Add all files
git add .

# Create .gitignore if not exists
echo "node_modules/
.env
.DS_Store
logs/
*.log" > .gitignore

# Initial commit
git commit -m "Initial backend setup with authentication and Swagger"

# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/studypack-backend.git

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## Step 3: Deploy to Railway (Easiest - 5 Minutes)

### Why Railway?
- ✅ Free $5 credit (500 hours)
- ✅ Automatic deploys from GitHub
- ✅ Easy environment variables
- ✅ Automatic HTTPS
- ✅ No credit card required initially

### Deployment Steps:

#### 1. Sign Up
- Go to [railway.app](https://railway.app)
- Click "Login" → "Login with GitHub"
- Authorize Railway

#### 2. Create New Project
- Click "New Project"
- Select "Deploy from GitHub repo"
- Choose `studypack-backend` repository
- Railway will auto-detect Node.js

#### 3. Add Environment Variables
Click on your service → "Variables" tab → Add these:

```env
NODE_ENV=production
PORT=3001

MONGODB_URI=mongodb+srv://chisomhenryg_db_user:7E9DHrRshI7CdKj8@cluster0.bgvopnc.mongodb.net/studyspark?retryWrites=true&w=majority

JWT_SECRET=your-new-production-secret-here
JWT_EXPIRES_IN=7d

FRONTEND_URL=https://studyspark.vercel.app

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**IMPORTANT**: Generate new JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### 4. Deploy
- Click "Deploy"
- Wait 2-3 minutes
- Watch build logs

#### 5. Generate Domain
- Go to "Settings" tab
- Click "Generate Domain"
- Copy your URL: `https://studypack-backend-production.up.railway.app`

#### 6. Update MongoDB Access
- Go to [MongoDB Atlas](https://cloud.mongodb.com)
- Network Access → "Add IP Address"
- Click "Allow Access from Anywhere" (0.0.0.0/0)
- Confirm

#### 7. Test API
```bash
# Replace with your Railway URL
curl https://your-app.railway.app/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "StudySpark API is running!",
  "docs": "/api-docs"
}
```

---

## Step 4: Deploy to Render (Alternative - Free Tier)

If you prefer Render:

### 1. Sign Up
- Go to [render.com](https://render.com)
- Sign up with GitHub

### 2. New Web Service
- Dashboard → "New +" → "Web Service"
- Connect your `studypack-backend` repository

### 3. Configure
- **Name**: `studyspark-api`
- **Environment**: `Node`
- **Region**: Choose closest to you
- **Branch**: `main`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### 4. Environment Variables
Add all variables (same as Railway above)

**IMPORTANT for Render**:
- Don't set PORT variable (Render sets it automatically)
- Or set it to: `PORT=10000`

### 5. Select Plan
- Choose "Free" plan
- Note: Spins down after 15 min inactivity

### 6. Create Web Service
- Click "Create Web Service"
- Wait 5-10 minutes for first deploy
- Copy your URL: `https://studyspark-api.onrender.com`

---

## Step 5: Connect Frontend to Backend

After backend is deployed:

### 1. Update Frontend Environment Variables

Edit `/Users/i/studypack/.env.local`:

```env
# Replace with your actual deployed backend URL
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app/api/v1

# Disable mock API
NEXT_PUBLIC_USE_MOCK_API=false

# WebSocket URL (for future live quiz feature)
NEXT_PUBLIC_WS_URL=wss://your-backend-url.railway.app
```

### 2. Update Backend CORS

In Railway/Render, update `FRONTEND_URL` variable to match your deployed frontend:

```env
FRONTEND_URL=https://studyspark.vercel.app
```

---

## Step 6: Test Full Integration

### 1. Test Backend Health
```bash
curl https://your-backend-url.railway.app/health
```

### 2. Test Registration
```bash
curl -X POST https://your-backend-url.railway.app/api/v1/auth/register \
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
Visit: `https://your-backend-url.railway.app/api-docs`

### 4. Test Frontend Login
1. Go to your frontend: `https://studyspark.vercel.app/auth/login`
2. Try logging in with registered user
3. Check browser console for any errors

---

## 🔥 Quick Commands Summary

```bash
# 1. Initialize Git
cd /Users/i/studypack-backend
git init
git add .
git commit -m "Initial backend setup"

# 2. Create GitHub repo and push
git remote add origin https://github.com/YOUR_USERNAME/studypack-backend.git
git push -u origin main

# 3. Deploy to Railway
# → Go to railway.app
# → Deploy from GitHub
# → Add environment variables
# → Done!

# 4. Get your API URL and update frontend
# NEXT_PUBLIC_API_URL=https://your-url.railway.app/api/v1
```

---

## 📋 Deployment Checklist

Before going live:

- [ ] Backend code pushed to GitHub (separate repo)
- [ ] Environment variables added in Railway/Render
- [ ] New JWT_SECRET generated for production
- [ ] MongoDB Atlas allows connections from anywhere
- [ ] Backend health endpoint returns 200 OK
- [ ] API documentation loads at `/api-docs`
- [ ] Frontend `.env.local` updated with backend URL
- [ ] CORS configured with correct frontend URL
- [ ] Test registration and login from frontend
- [ ] Check browser console for errors

---

## 🐛 Common Issues

### "Cannot connect to MongoDB"
**Solution**:
- Go to MongoDB Atlas → Network Access
- Add IP: 0.0.0.0/0 (Allow from anywhere)

### "CORS Error" in browser
**Solution**:
- Check FRONTEND_URL in backend matches your deployed frontend
- Redeploy backend after changing

### "502 Bad Gateway"
**Solution**:
- Check deployment logs in Railway/Render
- Verify all environment variables are set
- Check if PORT is set correctly

### Railway free tier expired
**Solution**:
- Upgrade to hobby plan ($5/month)
- Or switch to Render free tier

---

## 💰 Cost Breakdown

### Development (Current)
- MongoDB Atlas: **Free** (512MB)
- Local Backend: **Free**
- Local Frontend: **Free**

### Production (After Deployment)

#### Option 1: Railway (Recommended for MVP)
- **$0/month** (with $5 credit, ~500 hours)
- After credit: **~$5/month**
- MongoDB Atlas: **Free** (512MB)
- Frontend (Vercel): **Free**
- **Total: $0-5/month**

#### Option 2: Render Free Tier
- Backend: **Free** (750 hours/month)
- MongoDB Atlas: **Free**
- Frontend (Vercel): **Free**
- **Total: $0/month**
- Note: Spins down after 15 min inactivity

---

## 🎯 Production-Ready Features

Your backend already has:
- ✅ JWT Authentication
- ✅ Password hashing (bcrypt)
- ✅ MongoDB connection
- ✅ CORS configuration
- ✅ Rate limiting
- ✅ Helmet security headers
- ✅ Error handling
- ✅ Swagger documentation
- ✅ Health check endpoint

**You're ready to deploy!** 🚀

---

## Next Steps After Deployment

1. **Test Everything**
   - Registration, login, JWT tokens
   - View Swagger docs
   - Test from frontend

2. **Add AI Features**
   - Get OpenAI API key
   - Implement study assistant endpoints
   - Test AI chat functionality

3. **Implement Quiz System**
   - Personal quiz generation
   - Live quiz with WebSocket
   - Leaderboard

4. **Add Analytics**
   - Performance tracking
   - Study sessions
   - Progress reports

5. **Monitor & Scale**
   - Add Sentry for error tracking
   - Monitor API response times
   - Upgrade plan if needed

---

**Need help?**
- Railway docs: https://docs.railway.app
- Render docs: https://render.com/docs
- Check deployment logs for errors
- Test locally first with `npm run dev`

**Your backend is ready to go live! 🎉**
