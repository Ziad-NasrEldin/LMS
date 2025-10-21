import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
});

api.interceptors.response.use(
  response => response,
  error => {
    const customError = {
      status: error.response?.status || 'NETWORK_ERROR',
      message: error.response?.data?.message || 'حدث خطأ في الاتصال',
      data: error.response?.data || {}
    };
    
    // يمكن إضافة معالجة إضافية حسب نوع الخطأ
    // if (customError.status === 401) {
      // معالجة أخطاء المصادقة
    // }
    
    return Promise.reject(customError);
  }
);

export default api;