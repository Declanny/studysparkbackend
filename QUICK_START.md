# 🚀 StudySpark Backend - Quick Start Guide

## ✅ What's Been Created

Your backend MVP is ready with:
- ✅ Express server
- ✅ MongoDB connection
- ✅ User authentication (register/login)
- ✅ JWT token system
- ✅ Protected routes
- ✅ Error handling
- ✅ CORS configured
- ✅ Rate limiting
- ✅ Placeholder routes for Quiz, Study, Analytics

## 🎯 Step 1: Install MongoDB

### Option A: Install Locally (Mac)
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

### Option B: Use MongoDB Atlas (Cloud - Recommended)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create cluster
4. Get connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/studyspark`)
5. Update `.env` with your connection string

## 🎯 Step 2: Start Backend

```bash
cd /Users/i/studypack-backend
npm run dev
```

You should see:
```
✅ MongoDB Connected: localhost
🚀 StudySpark API running on port 3001
📊 Environment: development
🌐 Frontend URL: http://localhost:3000
```

## 🎯 Step 3: Test Authentication

### Test 1: Health Check
```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "StudySpark API is running!",
  "timestamp": "2025-01-04T..."
}
```

### Test 2: Register User
```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@studyspark.com",
    "password": "password123",
    "name": "Test User",
    "school": "Test University",
    "course": "Computer Science",
    "level": "200"
  }'
```

Expected response:
```json
{
  "success": true,
  "user": {
    "_id": "...",
    "email": "test@studyspark.com",
    "name": "Test User",
    ...
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Test 3: Login
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@studyspark.com",
    "password": "password123"
  }'
```

## 🎯 Step 4: Connect Frontend

1. Go to frontend folder:
```bash
cd /Users/i/studypack
```

2. Update `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:3001
NEXT_PUBLIC_USE_MOCK_API=false
```

3. Start frontend:
```bash
npm run dev
```

4. Visit http://localhost:3000
5. Try logging in with:
   - Email: test@studyspark.com
   - Password: password123

## 🎉 Success Checklist

- [ ] Backend running on port 3001
- [ ] MongoDB connected
- [ ] Health check passes
- [ ] Can register new user
- [ ] Can login with user
- [ ] Frontend loads
- [ ] Frontend login works
- [ ] Dashboard shows after login

## 🐛 Common Issues

### Issue: "MongooseServerSelectionError"
**Solution:** MongoDB not running or wrong connection string

- Local: `brew services start mongodb-community`
- Cloud: Check your MongoDB Atlas connection string in `.env`

### Issue: "CORS Error" in browser
**Solution:** Check `FRONTEND_URL` in `.env` matches your frontend URL

### Issue: "JWT_SECRET not defined"
**Solution:** Check `.env` file exists and has `JWT_SECRET`

### Issue: Port 3001 already in use
**Solution:** 
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9
# Or change PORT in .env
```

## 📁 Project Structure

```
studypack-backend/
├── src/
│   ├── server.js                  # Main entry point
│   ├── config/
│   │   └── database.js           # MongoDB connection
│   ├── models/
│   │   └── User.js               # User model
│   ├── controllers/
│   │   └── authController.js     # Auth logic
│   ├── routes/
│   │   ├── auth.js               # Auth routes
│   │   ├── study.js              # Study routes (placeholder)
│   │   ├── quiz.js               # Quiz routes (placeholder)
│   │   └── analytics.js          # Analytics routes (placeholder)
│   └── middleware/
│       ├── auth.js               # JWT authentication
│       └── errorHandler.js       # Error handling
├── .env                           # Environment variables
├── .gitignore
├── package.json
└── README.md
```

## 🚀 Next Steps

Now that authentication works, we'll implement:

1. **AI Study Assistant** - Chat with AI, get recommendations
2. **Quiz System** - Generate and take quizzes
3. **Live Quiz** - Real-time quiz with WebSocket
4. **Analytics** - Performance tracking

Ready to implement the next feature? Let me know!

## 📞 Need Help?

1. Check logs in terminal
2. Verify `.env` configuration
3. Test endpoints with curl/Postman
4. Check MongoDB connection

---

Built for working-class students 🎓
