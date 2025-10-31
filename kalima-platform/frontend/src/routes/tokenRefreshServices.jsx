import axios from "axios"

const API_URL = import.meta.env.VITE_API_URL
const TOKEN_KEY = "accessToken"
const REFRESH_THRESHOLD_SECONDS = 60 // 1 minute before expiry
const CHECK_INTERVAL_MS = 60000 // Check every 60 seconds

// Create a dedicated axios instance for refresh token requests
const refreshAxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

let isRefreshing = false
let failedQueue = []
let refreshInterval = null

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

// Interceptor for refresh token requests only
refreshAxiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url === `${API_URL}/auth/refresh`
    ) {
      clearAuthData()
      processQueue(new Error("Token refresh failed"))
      return Promise.reject(new Error("Token refresh failed"))
    }

    return Promise.reject(error)
  },
)

// Start periodic token refresh check
export const startTokenRefreshCheck = () => {
  if (refreshInterval) return // Prevent multiple intervals

  refreshInterval = setInterval(async () => {
    if (isLoggedIn()) {
      const token = getToken()
      if (token && isTokenNearExpiry(token)) {
        await refreshToken()
      }
    } else {
      stopTokenRefreshCheck()
    }
  }, CHECK_INTERVAL_MS)
}

// Stop periodic token refresh check
export const stopTokenRefreshCheck = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
}

// Check if token is near expiry
export const isTokenNearExpiry = (token) => {
  try {
    const decodedToken = decodeToken(token)
    const currentTime = Date.now() / 1000
    return decodedToken.exp && decodedToken.exp - currentTime < REFRESH_THRESHOLD_SECONDS
  } catch (error) {
    console.error("Error checking token expiry:", error)
    return false
  }
}

// Token refresh function
export const refreshToken = async () => {
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject })
    })
  }

  isRefreshing = true

  try {
    const token = getToken()

    if (!token) {
      isRefreshing = false
      processQueue(new Error("No token available"))
      return { success: false, error: "No token available" }
    }

    const response = await refreshAxiosInstance.post(
      `${API_URL}/auth/refresh`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )

    if (response.data.accessToken) {
      setToken(response.data.accessToken)
      processQueue(null, response.data.accessToken)
      isRefreshing = false
      return {
        success: true,
        data: response.data,
        status: response.status,
        headers: response.headers,
      }
    } else {
      clearAuthData()
      processQueue(new Error("Refresh failed: No access token received"))
      isRefreshing = false
      return {
        success: false,
        error: "Refresh failed: No access token received",
      }
    }
  } catch (error) {
    clearAuthData()
    processQueue(error)
    isRefreshing = false
    return {
      success: false,
      status: error.response?.status,
      error: error.response?.data?.message || "Token refresh failed",
      details: error.response?.data,
    }
  }
}

// Helper functions that need to be imported from auth-services
let getToken, setToken, clearAuthData, decodeToken, isLoggedIn

// Initialize helper functions
export const initializeTokenHelpers = (helpers) => {
  getToken = helpers.getToken
  setToken = helpers.setToken
  clearAuthData = helpers.clearAuthData
  decodeToken = helpers.decodeToken
  isLoggedIn = helpers.isLoggedIn
}

// Export refresh state for use in auth-services
export const getRefreshState = () => ({
  isRefreshing,
  failedQueue,
  processQueue,
})
