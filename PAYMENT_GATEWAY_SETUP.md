# Payment Gateway Integration - Setup Guide

## 🔑 Razorpay Setup (Required)

### Step 1: Get Razorpay Credentials
1. Go to https://razorpay.com/
2. Sign up for account (FREE for testing)
3. Go to Settings → API Keys
4. Copy:
   - **Key ID** (starts with `rzp_test_`)
   - **Key Secret**

### Step 2: Add to Environment Variables

**Backend (.env file):**
```env
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXX
RAZORPAY_KEY_SECRET=your_secret_key_here
```

**Frontend (.env file):**
```env
VITE_RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXX
```

### Step 3: Install Dependencies

**Backend:**
```bash
pip install razorpay
```

**Frontend:**
```bash
npm install razorpay
```

---

## 💡 TEST MODE vs PRODUCTION MODE

**Test Mode (Development):**
- Uses `rzp_test_` keys
- No real money charged
- Test cards available
- Full feature testing

**Production Mode (Live):**
- Uses `rzp_live_` keys
- Real transactions
- Requires KYC verification
- Bank account linked

---

## 🧪 Test Cards (Razorpay)

**Success:**
- Card: 4111 1111 1111 1111
- CVV: Any 3 digits
- Expiry: Any future date

**Failure:**
- Card: 4000 0000 0000 0002
- CVV: Any 3 digits
- Expiry: Any future date

---

## 📋 Implementation Status

- [ ] Install Razorpay library
- [ ] Setup environment variables
- [ ] Backend order creation endpoint
- [ ] Backend payment verification endpoint
- [ ] Frontend payment component
- [ ] Checkout flow integration
- [ ] Success/failure handling
- [ ] Payment history page

---

**Note:** For demo/testing, you can use test credentials provided by Razorpay without real money.

