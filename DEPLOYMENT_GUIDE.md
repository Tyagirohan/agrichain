# 🚀 AgriChain Deployment Guide

## 📋 Table of Contents
- [Deployment Options](#deployment-options)
- [Render Deployment](#render-deployment-recommended)
- [Vercel + Railway](#vercel--railway)
- [Docker Deployment](#docker-deployment)
- [Post-Deployment Steps](#post-deployment-steps)

---

## 🌐 Deployment Options

| Platform | Frontend | Backend | Cost | Difficulty |
|----------|----------|---------|------|------------|
| **Render** | ✅ | ✅ | Free (500hrs/month) | ⭐⭐ Easy |
| **Vercel + Railway** | ✅ | ✅ | Free tier available | ⭐⭐⭐ Medium |
| **Netlify + Heroku** | ✅ | ✅ | Free tier available | ⭐⭐ Easy |
| **Docker (VPS)** | ✅ | ✅ | $5-10/month | ⭐⭐⭐⭐ Hard |

---

## 🎯 Render Deployment (Recommended)

### Why Render?
- ✅ Free tier (500 hours/month)
- ✅ Both frontend & backend on same platform
- ✅ Auto-deploy on git push
- ✅ Built-in SSL certificates
- ✅ Environment variable management

### Step-by-Step Guide

#### 1. **Create Render Account**
- Go to [render.com](https://render.com)
- Sign up with GitHub

#### 2. **Deploy Backend (FastAPI)**

**2.1. Create New Web Service**
- Dashboard → "New +" → "Web Service"
- Connect GitHub repository
- Select `agrichain` repo

**2.2. Configure Service**
```
Name: agrichain-backend
Region: Choose nearest
Branch: main
Root Directory: backend
Runtime: Python 3
```

**2.3. Build & Start Commands**
```bash
# Build Command
pip install -r requirements.txt

# Start Command
uvicorn main:app --host 0.0.0.0 --port $PORT
```

**2.4. Environment Variables**
Add these in Render dashboard:
```
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_secret_key
```

**2.5. Deploy**
- Click "Create Web Service"
- Wait 2-3 minutes for deployment
- Copy the backend URL (e.g., `https://agrichain-backend.onrender.com`)

#### 3. **Deploy Frontend (React)**

**3.1. Create New Static Site**
- Dashboard → "New +" → "Static Site"
- Connect same GitHub repository

**3.2. Configure Site**
```
Name: agrichain-frontend
Branch: main
Root Directory: frontend
```

**3.3. Build Settings**
```bash
# Build Command
npm install && npm run build

# Publish Directory
dist
```

**3.4. Update API URLs**
Before deploying, update frontend code:

Edit `frontend/src/` files and replace:
```typescript
// OLD
http://localhost:8000

// NEW
https://agrichain-backend.onrender.com
```

Files to update:
- `src/pages/Marketplace.tsx`
- `src/pages/Login.tsx`
- `src/pages/Chat.tsx`
- `src/pages/ConsumerDashboard.tsx`
- `src/pages/FarmerDashboard.tsx`
- `src/components/NotificationCenter.tsx`
- `src/utils/razorpayConfig.ts`

**3.5. Deploy**
- Click "Create Static Site"
- Wait for build to complete
- Your app is live! 🎉

#### 4. **Custom Domain (Optional)**
- Go to Settings → Custom Domain
- Add your domain (e.g., `agrichain.com`)
- Update DNS records as instructed

---

## ⚡ Vercel + Railway

### Frontend on Vercel

**1. Install Vercel CLI**
```bash
npm install -g vercel
```

**2. Deploy**
```bash
cd frontend
vercel
```

**3. Follow prompts**
- Link to GitHub
- Configure project
- Deploy

### Backend on Railway

**1. Create Railway Account**
- Go to [railway.app](https://railway.app)
- Sign up with GitHub

**2. Create New Project**
- Dashboard → "New Project"
- "Deploy from GitHub repo"
- Select `agrichain` repository

**3. Configure**
- Root directory: `backend`
- Add environment variables (Razorpay keys)

**4. Deploy**
- Railway auto-deploys
- Copy backend URL
- Update frontend API URLs

---

## 🐳 Docker Deployment

### Prerequisites
- Docker installed
- Docker Compose installed

### Docker Files

**backend/Dockerfile**
```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**frontend/Dockerfile**
```dockerfile
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**docker-compose.yml** (root directory)
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - RAZORPAY_KEY_ID=${RAZORPAY_KEY_ID}
      - RAZORPAY_KEY_SECRET=${RAZORPAY_KEY_SECRET}
    volumes:
      - ./backend/data:/app/data

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
```

### Deploy
```bash
docker-compose up -d
```

---

## ✅ Post-Deployment Steps

### 1. **Test All Features**
- [ ] Login/Register
- [ ] Marketplace browsing
- [ ] Place order
- [ ] Payment gateway
- [ ] Chat system
- [ ] Notifications
- [ ] PWA install

### 2. **Update Razorpay Keys**
- Switch from test to live mode
- Update environment variables
- Test live payments

### 3. **Configure Domain**
- Point DNS to deployment
- Set up SSL (auto with Render/Vercel)
- Update CORS origins in backend

### 4. **Monitor Performance**
- Check logs for errors
- Monitor response times
- Set up alerts

### 5. **Database Migration (Optional)**
- Set up PostgreSQL on Render
- Run migration scripts
- Update connection strings

---

## 🔧 Common Issues & Solutions

### Issue: CORS Errors
**Solution**: Add frontend URL to backend CORS origins
```python
# backend/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend-url.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Issue: WebSocket Connection Failed
**Solution**: Ensure backend supports WebSocket connections
- Render: Enable WebSocket support in settings
- Use `wss://` instead of `ws://` for HTTPS

### Issue: Payment Gateway Not Working
**Solution**: 
- Check Razorpay keys are correct
- Ensure frontend domain is whitelisted in Razorpay dashboard
- Verify webhook URLs are set

### Issue: 502 Bad Gateway
**Solution**:
- Check backend logs
- Ensure all dependencies are installed
- Verify PORT environment variable

---

## 📊 Performance Optimization

### Backend
- Enable caching (Redis recommended)
- Use CDN for static assets
- Optimize database queries
- Enable gzip compression

### Frontend
- Code splitting
- Lazy loading
- Image optimization
- Service Worker caching

---

## 🔐 Security Checklist

- [ ] Environment variables secured
- [ ] API rate limiting enabled
- [ ] HTTPS enforced
- [ ] Input validation
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF tokens
- [ ] Secure payment processing

---

## 📞 Support

If you encounter issues:
1. Check deployment logs
2. Review this guide
3. Create GitHub issue
4. Contact: your-email@example.com

---

**🎉 Congratulations! Your AgriChain platform is now live!**

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [React Deployment](https://create-react-app.dev/docs/deployment/)

---

**Need help? Open an issue on GitHub!** 🚀

