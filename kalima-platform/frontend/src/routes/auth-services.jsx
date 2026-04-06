import axios from "axios"
import { jwtDecode } from "jwt-decode"
import api from "../services/errorHandling"
import { translateErrorMessage } from "../utils/errorTranslator"
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
const IMPERSONATION_STORAGE_KEY = "impersonationSession"

const normalizeRole = (role) => String(role || "").trim().toLowerCase()
const createFailureResponse = (message, extra = {}) => {
  const rawMessage = String(message || "").trim()
  const translated = translateErrorMessage(rawMessage || extra?.details?.message || "")

  return {
    success: false,
    ...extra,
    status: extra.status ?? "error",
    message: translated,
    error: translated,
    rawMessage,
  }
}

const emitImpersonationChange = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("impersonation-changed"))
    window.dispatchEvent(new Event("user-auth-changed"))
  }
}

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

export const getImpersonationSession = () => {
  try {
    const rawSession = localStorage.getItem(IMPERSONATION_STORAGE_KEY)
    if (!rawSession) return null
    const parsed = JSON.parse(rawSession)
    if (!parsed?.isActive) return null
    return parsed
  } catch (_error) {
    return null
  }
}

export const setImpersonationSession = (session) => {
  if (!session) return
  localStorage.setItem(IMPERSONATION_STORAGE_KEY, JSON.stringify(session))
  emitImpersonationChange()
}

export const clearImpersonationSession = ({ silent = false } = {}) => {
  localStorage.removeItem(IMPERSONATION_STORAGE_KEY)
  if (!silent) {
    emitImpersonationChange()
  }
}

export const isImpersonationActive = () => !!getImpersonationSession()

export const getEffectiveUserRole = () => {
  const session = getImpersonationSession()
  if (session?.isActive && session?.targetRole) {
    return normalizeRole(session.targetRole)
  }

  const tokenUser = getUserFromToken()
  const tokenRole = tokenUser?.role || tokenUser?.UserInfo?.role
  return normalizeRole(tokenRole)
}

export const clearAuthData = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem("user")
  clearImpersonationSession({ silent: true })
  stopTokenRefreshCheck() // Stop periodic refresh when clearing auth data
}

export const decodeToken = (token) => {
  try {
    return jwtDecode(token)
  } catch (error) {
    console.error(translateErrorMessage(`Error decoding token: ${error.message}`))
    return null
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
    console.error(translateErrorMessage(`Error checking token validity: ${error.message}`))
    clearAuthData()
    return false
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
    console.error(translateErrorMessage(`Error extracting user from token: ${error.message}`))
    return null
  }
}

export const getCachedUserSummary = () => {
  const tokenUser = getUserFromToken()
  const localUser = (() => {
    try {
      const rawUser = localStorage.getItem("user")
      return rawUser ? JSON.parse(rawUser) : null
    } catch (_error) {
      return null
    }
  })()
  const impersonationSession = getImpersonationSession()

  const mergedUser = {
    ...(localUser && typeof localUser === "object" ? localUser : {}),
    ...(tokenUser && typeof tokenUser === "object" ? tokenUser : {}),
  }

  const role = impersonationSession?.isActive
    ? impersonationSession.targetRole || mergedUser.role || mergedUser?.UserInfo?.role || null
    : mergedUser.role || mergedUser?.UserInfo?.role || null

  const id = impersonationSession?.isActive
    ? impersonationSession.targetUserId || mergedUser.id || mergedUser?._id || mergedUser?.UserInfo?.id || null
    : mergedUser.id || mergedUser?._id || mergedUser?.UserInfo?.id || null

  const name = impersonationSession?.isActive
    ? impersonationSession.targetName || mergedUser.name || null
    : mergedUser.name || null

  return {
    id,
    name,
    email: mergedUser.email || null,
    role,
    profilePic: mergedUser.profilePic || null,
    userSerial: mergedUser.userSerial || null,
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
    const response = await api.post(`/register`, userData, {
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
    return createFailureResponse(error.response?.data?.message || error.message || "Registration failed", {
      details: error.response?.data,
    })
  }
}

export const loginUser = async (credentials) => {
  try {
    const response = await api.post(`/auth`, credentials, {
      headers: { "Content-Type": "application/json" },
    });

    if (response.data.accessToken) {
      setToken(response.data.accessToken);
      clearImpersonationSession({ silent: true })
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
        status: "error",
        message: translateErrorMessage(response.data.error || "Login failed: No access token received"),
        error: translateErrorMessage(response.data.error || "Login failed: No access token received"),
        details: response.data,
      };
    }
  } catch (error) {
    return {
      success: false,
      status: "error",
      message: translateErrorMessage(error.response?.data?.error || error.message || "Login failed"),
      error: translateErrorMessage(error.response?.data?.error || error.message || "Login failed"),
      details: error.response?.data,
    };
  }
};

export const checkActiveSession = async (credentials) => {
  try {
    const response = await api.post(`/auth/check-session`, credentials, {
      headers: { "Content-Type": "application/json" },
    });

    return {
      success: true,
      hasActiveSession: response.data.hasActiveSession,
      requiresConfirmation: response.data.requiresConfirmation,
      role: response.data.role,
      data: response.data,
      status: response.status,
    };
  } catch (error) {
    return {
      success: false,
      status: "error",
      message: translateErrorMessage(error.response?.data?.error || error.message || "Failed to check active session"),
      error: translateErrorMessage(error.response?.data?.error || error.message || "Failed to check active session"),
      details: error.response?.data,
    };
  }
};

export const requestPasswordReset = async (email) => {
  try {
    const response = await axios.post(
      `${API_URL}/password-reset/request`,
      { email },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
    return response.data
  } catch (error) {
    return createFailureResponse(error.response?.data?.message || error.message || "Request failed", {
      details: error.response?.data,
    })
  }
}

export const verifyOtp = async (email, otp) => {
  try {
    const response = await axios.post(
      `${API_URL}/password-reset/verify-otp`,
      { email, otp },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
    return response.data
  } catch (error) {
    return createFailureResponse(error.response?.data?.message || error.message || "Request failed", {
      details: error.response?.data,
    })
  }
}

export const resetPassword = async (resetToken, password, confirmPassword) => {
  try {
    const response = await axios.post(
      `${API_URL}/password-reset/reset`,
      { resetToken, password, confirmPassword },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
    return response.data
  } catch (error) {
    return createFailureResponse(error.response?.data?.message || error.message || "Request failed", {
      details: error.response?.data,
    })
  }
}

export const logoutUser = async () => {
  try {
    const token = getToken()

    if (token) {
      await api.post(
        `/auth/logout`,
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
    return createFailureResponse("Logout failed on server, but local session was cleared")
  }
}

export const startImpersonation = async ({ targetUserId, targetRole }) => {
  try {
    const token = getToken()
    if (!token) {
      return createFailureResponse("Not authenticated")
    }

    if (isImpersonationActive()) {
      return createFailureResponse("Nested impersonation is not allowed. Exit current view first.")
    }

    const response = await api.post(
      `/auth/impersonation/start`,
      { targetUserId, targetRole },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    )

    if (!response?.data?.accessToken) {
      return createFailureResponse(response?.data?.message || "Failed to start impersonation", {
        status: response.status,
        details: response.data,
      })
    }

    setToken(response.data.accessToken)

    setImpersonationSession({
      isActive: true,
      sessionId: response.data.sessionId,
      actorRole: response.data.actor?.role,
      actorUserId: response.data.actor?.id,
      actorName: response.data.actor?.name,
      targetRole: response.data.target?.role,
      targetUserId: response.data.target?.id,
      targetName: response.data.target?.name,
      startedAt: response.data.startedAt || new Date().toISOString(),
    })

    return {
      success: true,
      data: response.data,
      status: response.status,
      headers: response.headers,
    }
  } catch (error) {
    const rawErrorMessage =
      error?.response?.data?.rawMessage ||
      error?.response?.data?.message ||
      error?.rawMessage ||
      error?.message ||
      "Failed to start impersonation"

    return createFailureResponse(rawErrorMessage, {
      status: error.response?.status,
      details: error.response?.data,
    })
  }
}

export const stopImpersonation = async () => {
  try {
    const token = getToken()
    const session = getImpersonationSession()

    if (!token || !session?.sessionId) {
      clearImpersonationSession()
      return createFailureResponse("No active impersonation session")
    }

    const response = await api.post(
      `/auth/impersonation/stop`,
      { sessionId: session.sessionId },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    )

    if (response?.data?.accessToken) {
      setToken(response.data.accessToken)
    }
    clearImpersonationSession()

    return {
      success: true,
      data: response.data,
      status: response.status,
      headers: response.headers,
    }
  } catch (error) {
    if (error.response?.status === 400) {
      clearImpersonationSession()
    }
    const rawErrorMessage =
      error?.response?.data?.rawMessage ||
      error?.response?.data?.message ||
      error?.rawMessage ||
      error?.message ||
      "Failed to stop impersonation"

    return createFailureResponse(rawErrorMessage, {
      status: error.response?.status,
      details: error.response?.data,
    })
  }
}

// Re-export refreshToken for backward compatibility
export { refreshToken }

// --- USER DATA API CALLS ---

export const getUserDashboard = async ({ params = {} } = {}) => {
  const defaultParams = { page: 1, limit: 200 }
  const finalParams = { ...defaultParams, ...params }

  try {
    const isAuth = await isLoggedIn()
    if (!isAuth) {
      return createFailureResponse("Not authenticated")
    }

    const token = getToken()

    const response = await api.get(`/users/me/dashboard`, {
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
              .get(`${API_URL}/users/me/dashboard`, {
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
            ...createFailureResponse(err.response?.data?.message || err.message || "Request failed"),
            status: err.response?.status,
            details: err.response?.data,
          }))
      }

      try {
        const refreshResult = await refreshToken()

        if (refreshResult.success && refreshResult.data.accessToken) {
          processQueue(null, refreshResult.data.accessToken)

          const response = await axios.get(`${API_URL}/users/me/dashboard`, {
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
          processQueue(new Error(translateErrorMessage("Token refresh failed")))
          return createFailureResponse("Token refresh failed")
        }
      } catch (refreshError) {
        clearAuthData()
        processQueue(refreshError)
        return createFailureResponse("Token refresh failed")
      }
    }

    if (error.response) {
      return {
        success: false,
        status: error.response.status,
        message: translateErrorMessage(error.response.data?.message || "Failed to fetch dashboard data"),
        error: translateErrorMessage(error.response.data?.message || "Failed to fetch dashboard data"),
        details: error.response.data,
      }
    } else if (error.request) {
      return createFailureResponse("No response from server. Please check your internet connection.")
    } else {
      return createFailureResponse("An error occurred while fetching dashboard data.")
    }
  }
}

export const getMyPurchasedCourseContainers = async ({ params = {} } = {}) => {
  const finalParams = { page: 1, limit: 200, ...params }

  try {
    const isAuth = await isLoggedIn()
    if (!isAuth) {
      return createFailureResponse("Not authenticated")
    }

    const token = getToken()

    const response = await api.get(`/users/me/purchased-course-containers`, {
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
    return createFailureResponse(error.response?.data?.message || "Failed to fetch purchased course containers", {
      status: error.response?.status,
      details: error.response?.data,
    })
  }
}

// --- AUTHENTICATED API HELPERS ---

const handleAuthenticatedRequest = async (requestFn, url, ...args) => {
  try {
    const token = getToken()
    const fullUrl = `${url}`

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
            return requestFn(`${url}`, ...args, {
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
            ...createFailureResponse(err.response?.data?.message || err.message || "Request failed"),
            status: err.response?.status,
            details: err.response?.data,
          }))
      }

      try {
        const refreshResult = await refreshToken()

        if (refreshResult.success && refreshResult.data.accessToken) {
          processQueue(null, refreshResult.data.accessToken)

          const response = await requestFn(`${url}`, ...args, {
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
          processQueue(new Error(translateErrorMessage("Token refresh failed")))
          return createFailureResponse("Token refresh failed")
        }
      } catch (refreshError) {
        clearAuthData()
        processQueue(refreshError)
        return createFailureResponse("Token refresh failed")
      }
    }

    return createFailureResponse(error.response?.data?.message || error.message || "Request failed", {
      status: error.response?.status,
      details: error.response?.data,
    })
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
