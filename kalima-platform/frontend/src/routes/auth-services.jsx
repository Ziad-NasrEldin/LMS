import axios from "axios"
import { jwtDecode } from "jwt-decode"
import api from "../services/errorHandling"
import {
  refreshToken,
  startTokenRefreshCheck,
  stopTokenRefreshCheck,
  isTokenNearExpiry,
  initializeTokenHelpers,
  getRefreshState,
} from "./tokenRefreshServices"

const API_URL = import.meta.env.VITE_API_URL
const TOKEN_KEY = "accessToken"

// --- AUTH HELPERS ---

export const getToken = () => localStorage.getItem(TOKEN_KEY)

export const setToken = (token) => {
  if (!token) {
    console.warn("Attempted to set empty token")
    return
  }
  localStorage.setItem(TOKEN_KEY, token)
}

export const removeToken = () => localStorage.removeItem(TOKEN_KEY)

export const clearAuthData = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem("user")
  stopTokenRefreshCheck() // Stop periodic refresh when clearing auth data
}

export const decodeToken = (token) => {
  try {
    return jwtDecode(token)
  } catch (error) {
    return `Error decoding token: ${error.message}`
  }
}

export const isLoggedIn = async () => {
  const token = getToken()
  if (!token) return false

  try {
    const decodedToken = decodeToken(token)
    const currentTime = Date.now() / 1000

    if (decodedToken.exp && decodedToken.exp < currentTime) {
      console.warn("Token has expired")
      clearAuthData()
      return false
    }

    // Proactively refresh token if near expiry
    if (isTokenNearExpiry(token)) {
      const refreshResult = await refreshToken()
      if (!refreshResult.success) {
        clearAuthData()
        return false
      }
    }

    return true
  } catch (error) {
    clearAuthData()
    return `Error checking token validity: ${error.message}`
  }
}

export const getUserFromToken = () => {
  const token = getToken()
  if (!token) return null

  try {
    const decodedToken = decodeToken(token)
    const currentTime = Date.now() / 1000

    if (decodedToken.exp && decodedToken.exp < currentTime) {
      console.warn("Token has expired")
      return null
    }

    const { exp, iat, nbf, jti, ...userData } = decodedToken
    return userData
  } catch (error) {
    return `Error extracting user from token: ${error.message}`
  }
}

export const hasRole = (role) => {
  const user = getUserFromToken()
  if (!user || !user.role) return false

  if (Array.isArray(user.role)) {
    return user.role.includes(role)
  }
  return user.role === role
}

export const debugAuthState = () => {
  const token = getToken()
  const isLoggedInStatus = isLoggedIn()
  const user = getUserFromToken()

  return {
    hasToken: !!token,
    isLoggedIn: isLoggedInStatus,
    userData: user,
  }
}

// Initialize token helpers for the refresh service
initializeTokenHelpers({
  getToken,
  setToken,
  clearAuthData,
  decodeToken,
  isLoggedIn,
})

// --- AUTH API CALLS ---

export const registerUser = async (userData) => {
  try {
    const response = await api.post(`${API_URL}/api/v1/register`, userData, {
      headers: {
        "Content-Type": "application/json",
      },
    })

    return {
      success: true,
      data: response.data,
      status: response.status,
      headers: response.headers,
    }
  } catch (error) {
    return `Registration failed: ${error.message}`
  }
}

export const loginUser = async (credentials) => {
  try {
    const response = await api.post(`${API_URL}/api/v1/auth`, credentials, {
      headers: { "Content-Type": "application/json" },
    });

    if (response.data.accessToken) {
      setToken(response.data.accessToken);
      if (response.data.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }
      startTokenRefreshCheck();

      return {
        success: true,
        data: response.data,
        status: response.status,
        headers: response.headers,
      };
    } else {
      return {
        success: false,
        error: response.data.error || "Login failed: No access token received",
        details: response.data,
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || "Login failed",
      details: error.response?.data,
    };
  }
};


export const requestPasswordReset = async (email) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/v1/password-reset/request`,
      { email },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
    return response.data
  } catch (error) {
    throw error
  }
}

export const verifyOtp = async (email, otp) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/v1/password-reset/verify-otp`,
      { email, otp },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
    return response.data
  } catch (error) {
    throw error
  }
}

export const resetPassword = async (resetToken, password, confirmPassword) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/v1/password-reset/reset`,
      { resetToken, password, confirmPassword },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
    return response.data
  } catch (error) {
    throw error
  }
}

export const logoutUser = async () => {
  try {
    const token = getToken()

    if (token) {
      await api.post(
        `${API_URL}/api/v1/auth/logout`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      )
    }

    clearAuthData()
    stopTokenRefreshCheck() // Stop periodic refresh on logout
    return { success: true }
  } catch (error) {
    clearAuthData()
    stopTokenRefreshCheck() // Stop periodic refresh on logout
    return {
      success: false,
      error: "Logout failed on server, but local session was cleared",
    }
  }
}

// Re-export refreshToken for backward compatibility
export { refreshToken }

// --- USER DATA API CALLS ---

export const getUserDashboard = async ({ params = {} } = {}) => {
  const defaultParams = { page: 1, limit: 200 }
  const finalParams = { ...defaultParams, ...params }

  try {
    if (!isLoggedIn()) {
      return { success: false, error: "Not authenticated" }
    }

    const token = getToken()

    const response = await api.get(`${API_URL}/api/v1/users/me/dashboard`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      params: finalParams,
    })

    return {
      success: true,
      data: response.data,
      status: response.status,
      headers: response.headers,
    }
  } catch (error) {
    if (error.response?.status === 401) {
      const { isRefreshing, failedQueue, processQueue } = getRefreshState()

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((newToken) => {
            return axios
              .get(`${API_URL}/api/v1/users/me/dashboard`, {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${newToken}`,
                },
                params: finalParams,
              })
              .then((response) => ({
                success: true,
                data: response.data,
                status: response.status,
                headers: response.headers,
              }))
          })
          .catch((err) => ({
            success: false,
            error: err.message || "Failed to fetch dashboard data after token refresh",
          }))
      }

      try {
        const refreshResult = await refreshToken()

        if (refreshResult.success && refreshResult.data.accessToken) {
          processQueue(null, refreshResult.data.accessToken)

          const response = await axios.get(`${API_URL}/api/v1/users/me/dashboard`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${refreshResult.data.accessToken}`,
            },
            params: finalParams,
          })

          return {
            success: true,
            data: response.data,
            status: response.status,
            headers: response.headers,
          }
        } else {
          clearAuthData()
          processQueue(new Error("Token refresh failed"))
          return { success: false, error: "Token refresh failed" }
        }
      } catch (refreshError) {
        clearAuthData()
        processQueue(refreshError)
        return {
          success: false,
          error: "Token refresh failed",
        }
      }
    }

    if (error.response) {
      return {
        success: false,
        status: error.response.status,
        error: error.response.data?.message || "Failed to fetch dashboard data",
        details: error.response.data,
      }
    } else if (error.request) {
      return {
        success: false,
        error: "No response from server. Please check your internet connection.",
      }
    } else {
      return {
        success: false,
        error: "An error occurred while fetching dashboard data.",
      }
    }
  }
}

// --- AUTHENTICATED API HELPERS ---

const handleAuthenticatedRequest = async (requestFn, url, ...args) => {
  try {
    const token = getToken()
    const fullUrl = `${API_URL}${url}`

    const response = await requestFn(fullUrl, ...args, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      ...(args[args.length - 1] || {}),
    })

    return {
      success: true,
      data: response.data,
      status: response.status,
      headers: response.headers,
    }
  } catch (error) {
    if (error.response?.status === 401) {
      const { isRefreshing, failedQueue, processQueue } = getRefreshState()

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((newToken) => {
            return requestFn(`${API_URL}${url}`, ...args, {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${newToken}`,
              },
              ...(args[args.length - 1] || {}),
            }).then((response) => ({
              success: true,
              data: response.data,
              status: response.status,
              headers: response.headers,
            }))
          })
          .catch((err) => ({
            success: false,
            error: err.message || "Request failed after token refresh",
          }))
      }

      try {
        const refreshResult = await refreshToken()

        if (refreshResult.success && refreshResult.data.accessToken) {
          processQueue(null, refreshResult.data.accessToken)

          const response = await requestFn(`${API_URL}${url}`, ...args, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${refreshResult.data.accessToken}`,
            },
            ...(args[args.length - 1] || {}),
          })

          return {
            success: true,
            data: response.data,
            status: response.status,
            headers: response.headers,
          }
        } else {
          clearAuthData()
          processQueue(new Error("Token refresh failed"))
          return { success: false, error: "Token refresh failed" }
        }
      } catch (refreshError) {
        clearAuthData()
        processQueue(refreshError)
        return {
          success: false,
          error: "Token refresh failed",
        }
      }
    }

    return {
      success: false,
      status: error.response?.status,
      error: error.response?.data?.message || error.message || "Request failed",
      details: error.response?.data,
    }
  }
}

export const getAuthenticatedRequest = async (url, options = {}) => {
  return handleAuthenticatedRequest(api.get, url, options)
}

export const postAuthenticatedRequest = async (url, data = {}, options = {}) => {
  return handleAuthenticatedRequest(api.post, url, data, options)
}

export const putAuthenticatedRequest = async (url, data = {}, options = {}) => {
  return handleAuthenticatedRequest(api.put, url, data, options)
}

export const deleteAuthenticatedRequest = async (url, options = {}) => {
  return handleAuthenticatedRequest(api.delete, url, options)
}
