/**
 * API Configuration
 * Centralized API endpoint configuration for easy environment switching
 */

// Determine the API URL based on environment
const getApiUrl = (): string => {
  // Check if we're in production (deployed frontend)
  if (import.meta.env.PROD) {
    // Production backend URL (Render)
    return 'https://agrichain-backend.onrender.com';
  }
  
  // Development/Local backend URL
  return 'http://localhost:8000';
};

export const API_BASE_URL = getApiUrl();

// WebSocket URL (ws:// for local, wss:// for production)
export const WS_BASE_URL = API_BASE_URL.replace('https://', 'wss://').replace('http://', 'ws://');

// Helper function to construct full API endpoint URLs
export const getApiEndpoint = (path: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${API_BASE_URL}/${cleanPath}`;
};

// Helper function to construct WebSocket URLs
export const getWsEndpoint = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${WS_BASE_URL}/${cleanPath}`;
};

// Export for debugging
console.log('[API Config] Using API Base URL:', API_BASE_URL);
console.log('[API Config] Using WebSocket URL:', WS_BASE_URL);

