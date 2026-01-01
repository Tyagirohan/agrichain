# 🚀 AgriChain - Setup & Deployment Guide

## 📋 Table of Contents
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [Deployment Options](#deployment-options)
- [Features Documentation](#features-documentation)

---

## 🖥️ Local Setup

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
python main.py
```

Server runs on: `http://localhost:8000`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

App runs on: `http://localhost:5173`

---

## 🔐 Environment Variables

### Backend (`.env` in `backend/` folder)

```env
# Razorpay Payment Gateway (Get from https://dashboard.razorpay.com/)
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_secret_key

# Optional: Database URL (if using PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost:5432/agrichain
```

### Frontend (No .env needed currently)
All configurations are in the source code.

---

## 🌐 Deployment Options

### Option 1: Render (Recommended - Free Tier Available)

#### Backend Deployment:
1. Go to [render.com](https://render.com)
2. Create new **Web Service**
3. Connect your GitHub repo
4. Configure:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Root Directory**: `backend`
5. Add environment variables (Razorpay keys)
6. Deploy!

#### Frontend Deployment:
1. Create new **Static Site**
2. Connect your GitHub repo
3. Configure:
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - **Root Directory**: `frontend`
4. Update API URLs in frontend code to use your backend URL
5. Deploy!

### Option 2: Vercel (Frontend) + Railway (Backend)

#### Frontend on Vercel:
```bash
cd frontend
vercel
```

#### Backend on Railway:
1. Go to [railway.app](https://railway.app)
2. Create new project from GitHub
3. Select `backend` folder
4. Add environment variables
5. Deploy!

### Option 3: Docker (Self-Hosted)

Coming soon...

---

## 📚 Features Documentation

### 1. Payment Gateway Integration
- **Provider**: Razorpay
- **Modes**: Test & Live
- **Setup Guide**: See `PAYMENT_GATEWAY_SETUP.md`

### 2. Real-time Chat System
- **Technology**: WebSocket
- **Features**: Instant messaging, online status, notifications
- **Details**: See `FEATURE_2_CHAT_SYSTEM_SUMMARY.md`

### 3. Progressive Web App (PWA)
- **Features**: Installable, offline support, push notifications
- **Icons**: See `PWA_ICONS_SETUP.md` for icon generation
- **Details**: See `FEATURE_3_PWA_SUMMARY.md`

### 4. Dynamic Rating System
- **Features**: Real-time ratings, farmer reputation badges
- **Details**: See `DYNAMIC_RATINGS_IMPLEMENTATION.md`

### 5. Delivery Integration
- **Features**: Tracking IDs, delivery partner simulation
- **Details**: See `FEATURE_5_DELIVERY_COMPLETE.md`

---

## 🗄️ Database Migration (Optional)

Currently using JSON file storage. For production:

See `FEATURE_4_DATABASE_IMPLEMENTATION_GUIDE.md` for PostgreSQL migration guide.

---

## 🧪 Testing

### Test Accounts:

**Farmer:**
- Email: `farmer@test.com`
- Password: `test123`

**Consumer:**
- Email: `consumer@test.com`
- Password: `test123`

### Payment Testing:

Use Razorpay test cards:
- Card: `4111 1111 1111 1111`
- CVV: `123`
- Expiry: Any future date

---

## 📞 Support

For issues or questions:
- Create an issue on GitHub
- Email: your-email@example.com

---

## 📄 License

MIT License - Feel free to use for your projects!

---

**Built with ❤️ by AgriChain Team**

