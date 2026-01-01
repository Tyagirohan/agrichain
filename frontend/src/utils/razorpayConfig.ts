/**
 * Razorpay Payment Gateway Configuration & Utilities
 * Handles payment order creation, verification, and processing
 */
import { getApiEndpoint } from '../config/api';

// Razorpay Key (Test mode - replace with your actual key)
export const RAZORPAY_KEY_ID = 'rzp_test_demo'; // Replace with your Razorpay key

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpaySuccessResponse) => void;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  theme: {
    color: string;
  };
  modal: {
    ondismiss: () => void;
  };
}

interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

/**
 * Create a payment order on backend
 */
export const createPaymentOrder = async (
  amount: number,
  orderId: string
): Promise<{ razorpay_order_id: string; key_id: string } | null> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login to make payment');
      return null;
    }

    const response = await fetch(getApiEndpoint('/payments/create-order'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        amount: amount,
        currency: 'INR',
        order_id: orderId
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create payment order');
    }

    const data = await response.json();
    return {
      razorpay_order_id: data.razorpay_order_id,
      key_id: data.key_id
    };
  } catch (error) {
    console.error('Payment order creation failed:', error);
    alert(`Payment initialization failed: ${error}`);
    return null;
  }
};

/**
 * Verify payment on backend
 */
export const verifyPayment = async (
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
  ourOrderId: string
): Promise<boolean> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Authentication error');
      return false;
    }

    const response = await fetch(getApiEndpoint('/payments/verify'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature,
        our_order_id: ourOrderId
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Payment verification failed');
    }

    return true;
  } catch (error) {
    console.error('Payment verification failed:', error);
    alert(`Payment verification failed: ${error}`);
    return false;
  }
};

/**
 * Open Razorpay payment modal
 */
export const initiatePayment = (
  amount: number,
  orderId: string,
  razorpayOrderId: string,
  keyId: string,
  userDetails: { name: string; email: string; contact: string },
  onSuccess: (paymentId: string) => void,
  onFailure: () => void
): void => {
  const options: RazorpayOptions = {
    key: keyId,
    amount: amount * 100, // Convert to paise
    currency: 'INR',
    name: 'AgriChain',
    description: `Order #${orderId}`,
    order_id: razorpayOrderId,
    handler: async (response: RazorpaySuccessResponse) => {
      // Payment successful - verify on backend
      const verified = await verifyPayment(
        response.razorpay_order_id,
        response.razorpay_payment_id,
        response.razorpay_signature,
        orderId
      );

      if (verified) {
        onSuccess(response.razorpay_payment_id);
      } else {
        onFailure();
      }
    },
    prefill: {
      name: userDetails.name,
      email: userDetails.email,
      contact: userDetails.contact
    },
    theme: {
      color: '#10B981' // Green color (matches AgriChain theme)
    },
    modal: {
      ondismiss: () => {
        console.log('Payment modal closed by user');
        onFailure();
      }
    }
  };

  if (window.Razorpay) {
    const rzp = new window.Razorpay(options);
    rzp.open();
  } else {
    alert('Payment gateway not loaded. Please refresh the page.');
    onFailure();
  }
};

/**
 * Get payment history for current user
 */
export const getPaymentHistory = async (): Promise<any[]> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return [];
    }

    const response = await fetch(getApiEndpoint('/payments/history'), {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch payment history');
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch payment history:', error);
    return [];
  }
};

/**
 * Complete payment flow (all-in-one function)
 */
export const processPayment = async (
  amount: number,
  orderId: string,
  userDetails: { name: string; email: string; contact: string }
): Promise<{ success: boolean; paymentId?: string }> => {
  return new Promise(async (resolve) => {
    // Step 1: Create payment order on backend
    const orderData = await createPaymentOrder(amount, orderId);
    
    if (!orderData) {
      resolve({ success: false });
      return;
    }

    // Step 2: Open Razorpay modal
    initiatePayment(
      amount,
      orderId,
      orderData.razorpay_order_id,
      orderData.key_id,
      userDetails,
      (paymentId) => {
        // Success callback
        resolve({ success: true, paymentId });
      },
      () => {
        // Failure callback
        resolve({ success: false });
      }
    );
  });
};

