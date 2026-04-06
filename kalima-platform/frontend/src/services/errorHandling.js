import axios from 'axios';
import { translateErrorMessage } from '../utils/errorTranslator';

const SESSION_REVOKED_MESSAGE = "Session has been replaced by a newer login. Please login again.";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
});

// Flag to prevent multiple session revoked redirects
let isHandlingSessionRevoked = false;

// Session revoked handler - simple redirect approach
const handleSessionRevoked = () => {
  if (isHandlingSessionRevoked) return;
  isHandlingSessionRevoked = true;
  
  // Clear auth data
  localStorage.removeItem("accessToken");
  localStorage.removeItem("user");
  localStorage.removeItem("impersonationSession");
  
  // Set a flag for login page to show message (only if not already there)
  if (!window.location.pathname.includes('/login')) {
    sessionStorage.setItem("sessionRevoked", "true");
    window.location.href = "/login";
  }
};

api.interceptors.response.use(
  response => response,
  async error => {
    const rawMessage = error.response?.data?.message || error.response?.data?.error || error.message;
    const translatedMessage = translateErrorMessage(rawMessage, error.message);
    
    // Check for session revocation (401 with specific message)
    if (error.response?.status === 401 && rawMessage === SESSION_REVOKED_MESSAGE) {
      handleSessionRevoked();
    }
    
    const customError = {
      status: error.response?.status || 'NETWORK_ERROR',
      message: translatedMessage,
      error: translatedMessage,
      data: {
        ...(error.response?.data || {}),
        message: translatedMessage,
        error: translatedMessage
      }
    };
    
    return Promise.reject(customError);
  }
);

export default api;
