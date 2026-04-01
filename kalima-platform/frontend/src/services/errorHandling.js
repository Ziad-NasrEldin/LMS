import axios from 'axios';
import { translateErrorMessage } from '../utils/errorTranslator';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
});

api.interceptors.response.use(
  response => response,
  error => {
    const translatedMessage = translateErrorMessage(
      error.response?.data?.message || error.response?.data?.error || error.message,
      error.message
    );
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
    
    // يمكن إضافة معالجة إضافية حسب نوع الخطأ
    // if (customError.status === 401) {
      // معالجة أخطاء المصادقة
    // }
    
    return Promise.reject(customError);
  }
);

export default api;
