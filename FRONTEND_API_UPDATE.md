# Frontend API Configuration Update

## What Changed?

All hardcoded API URLs (`http://localhost:8000`) have been replaced with a centralized configuration system that automatically switches between:
- **Development**: `http://localhost:8000` (local backend)
- **Production**: `https://agrichain-backend.onrender.com` (deployed backend)

## New File Created

### `frontend/src/config/api.ts`
Centralized API configuration that:
- Automatically detects if the app is in production or development
- Provides helper functions for constructing API and WebSocket URLs
- Makes it easy to change backend URL in one place

## Files Updated (10 files)

1. **`frontend/src/pages/Login.tsx`** - Auth endpoints
2. **`frontend/src/pages/Chat.tsx`** - WebSocket + Chat API endpoints
3. **`frontend/src/pages/Marketplace.tsx`** - Product & order endpoints
4. **`frontend/src/pages/ConsumerDashboard.tsx`** - Consumer order & analytics endpoints
5. **`frontend/src/pages/FarmerDashboard.tsx`** - Farmer order & analytics endpoints
6. **`frontend/src/pages/SupplyChain.tsx`** - Supply chain tracking endpoints
7. **`frontend/src/pages/GovtSchemes.tsx`** - Government schemes endpoints
8. **`frontend/src/pages/CropDiseaseDetection.tsx`** - ML prediction endpoints
9. **`frontend/src/components/NotificationCenter.tsx`** - Notification endpoints
10. **`frontend/src/utils/razorpayConfig.ts`** - Payment gateway endpoints

## Total API Calls Updated

**29 API endpoints** + **1 WebSocket connection** = **30 total connections** now use centralized config

## How It Works

```typescript
// OLD (hardcoded):
fetch('http://localhost:8000/auth/login', {...})

// NEW (dynamic):
import { getApiEndpoint } from '../config/api';
fetch(getApiEndpoint('/auth/login'), {...})
```

The system automatically uses:
- `http://localhost:8000/auth/login` in **development**
- `https://agrichain-backend.onrender.com/auth/login` in **production**

## Next Steps

✅ **Step 1**: Backend Deployed (DONE)  
✅ **Step 2**: Frontend API URLs Updated (DONE)  
⏳ **Step 3**: Commit & Push to GitHub  
⏳ **Step 4**: Deploy Frontend to Render/Vercel/Netlify

---

**Note**: The frontend will automatically connect to the production backend once deployed!

