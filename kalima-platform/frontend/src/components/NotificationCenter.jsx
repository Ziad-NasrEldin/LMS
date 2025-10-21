"use client"

import { useEffect, useState, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { FiBell, FiX, FiRefreshCw } from "react-icons/fi"
import { initializeSocket, getSocket, forceReconnect } from "../utils/socket"
import { getToken } from "../routes/auth-services"
import axios from "axios"

const NotificationCenter = ({ userId }) => {
  const { t, i18n } = useTranslation("notifications")
  const isRTL = i18n.language === "ar"

  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [socketConnected, setSocketConnected] = useState(false)

  // Function to manually fetch unsent notifications
  const fetchUnsentNotifications = useCallback(async () => {
    if (!userId) {
      console.error(t("errors.noUserId"))
      return
    }

    setIsLoading(true)
    try {
      const token = getToken()
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/notifications/unsent`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.data.status === "success" && response.data.data.length > 0) {
        setNotifications((prev) => {
          // Filter out duplicates
          const existingIds = new Set(prev.map((n) => n.notificationId))
          const newNotifications = response.data.data.filter((n) => !existingIds.has(n.notificationId))

          return [...newNotifications, ...prev]
        })
        setUnreadCount((prev) => prev + response.data.data.length)
      }
    } catch (error) {
      console.error(t("errors.fetchNotifications"), error)
    } finally {
      setIsLoading(false)
    }
  }, [userId, t])

  // Function to manually reconnect socket
  const handleReconnect = useCallback(() => {
    const socket = forceReconnect(userId)
    if (socket) {
      setupSocketListeners(socket)
    }
    fetchUnsentNotifications()
  }, [userId, fetchUnsentNotifications])

  // Setup socket event listeners
  const setupSocketListeners = useCallback((socket) => {
    if (!socket) return

    // Check socket connection status
    if (socket.connected) {
      setSocketConnected(true)
    }

    socket.on("connect", () => {
      setSocketConnected(true)
    })

    socket.on("disconnect", () => {
      setSocketConnected(false)
    })

    // Custom socket event handlers
    const eventTypes = ["newHomework", "newLecture", "newContainer", "notification", "newAttachment", "lectureUpdate"]

    // Remove existing listeners before adding new ones
    eventTypes.forEach((eventType) => {
      socket.off(eventType)
    })

    // Add new listeners
    eventTypes.forEach((eventType) => {
      socket.on(eventType, (notification) => {
        // Add the new notification to the list, avoid duplicates
        setNotifications((prev) => {
          const exists = prev.some((n) => n.notificationId === notification.notificationId)
          if (exists) return prev
          return [notification, ...prev]
        })
        setUnreadCount((prev) => prev + 1)
      })
    })
  }, [])

  useEffect(() => {
    if (userId) {
      // Initialize the socket
      const socket = initializeSocket(userId)

      if (!socket) {
        console.error(t("errors.socketInitFailed"))
        return
      }

      // Setup event listeners
      setupSocketListeners(socket)

      // Try to fetch any unsent notifications
      fetchUnsentNotifications()

      // Clean up on unmount
      return () => {
        const currentSocket = getSocket()
        if (currentSocket) {
          ;["newHomework", "newLecture", "newContainer", "notification", "newAttachment", "lectureUpdate"].forEach(
            (eventType) => currentSocket.off(eventType),
          )
        }
      }
    }
  }, [userId, setupSocketListeners, fetchUnsentNotifications, t])

  // Setup periodic ping to keep connection alive
  useEffect(() => {
    if (!userId) return

    // Send periodic pings to keep the socket connection alive
    const pingInterval = setInterval(() => {
      const socket = getSocket()
      if (socket?.connected) {
        socket.emit("ping")
      } else if (socket) {
        handleReconnect()
      }
    }, 30000) // Every 30 seconds

    return () => {
      clearInterval(pingInterval)
    }
  }, [userId, handleReconnect])

  const handleMarkAsRead = (notificationId) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.notificationId === notificationId ? { ...notif, read: true } : notif)),
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))

    // Optional: Mark as read on the server
    try {
      const token = getToken()
      axios.patch(
        `${import.meta.env.VITE_API_URL}/api/v1/notifications/${notificationId}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
    } catch (error) {
      console.error(t("errors.markAsRead"), error)
    }
  }

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications)
  }

  return (
    <div className={`relative ${isRTL ? "rtl" : "ltr"}`} dir={isRTL ? "rtl" : "ltr"}>
      <button
        className="btn btn-ghost btn-circle"
        onClick={toggleNotifications}
        title={t("buttons.toggleNotifications")}
      >
        <div className="indicator">
          <FiBell className="h-6 w-6" />
          {unreadCount > 0 && <span className="badge badge-sm badge-primary indicator-item">{unreadCount}</span>}
        </div>
      </button>

      {showNotifications && (
        <div
          className={`absolute ${isRTL ? "left-0" : "right-0"} mt-2 w-80 bg-base-100 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto`}
        >
          <div className="flex justify-between items-center p-3 border-b">
            <div className="flex items-center">
              <h3 className="font-semibold">{t("title")}</h3>
              {!socketConnected && (
                <span
                  className={`${isRTL ? "mr-2" : "ml-2"} w-2 h-2 rounded-full bg-red-500`}
                  title={t("status.disconnected")}
                ></span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleReconnect}
                disabled={isLoading}
                className="btn btn-ghost btn-xs"
                title={t("buttons.refresh")}
              >
                <FiRefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </button>
              <button onClick={() => setShowNotifications(false)} title={t("buttons.close")}>
                <FiX className="h-5 w-5" />
              </button>
            </div>
          </div>

          {isLoading && (
            <div className="p-4 text-center">
              <span className="loading loading-spinner loading-sm"></span>
              <p className="mt-2 text-sm text-gray-500">{t("status.loading")}</p>
            </div>
          )}

          {!isLoading && notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <div className="text-4xl mb-2">🔔</div>
              <p>{t("emptyState.title")}</p>
              <p className="text-xs mt-1">{t("emptyState.description")}</p>
            </div>
          ) : (
            <div>
              {notifications.map((notification, idx) => (
                <div
                  key={notification.notificationId || idx}
                  className={`p-3 border-b hover:bg-base-200 cursor-pointer transition-colors ${
                    !notification.read ? "bg-base-200" : ""
                  }`}
                  onClick={() => handleMarkAsRead(notification.notificationId)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{notification.title}</div>
                      <div className="text-sm text-gray-600 mt-1">{notification.message}</div>
                      <div className="text-xs text-gray-500 mt-2">
                        {new Date(notification.createdAt || new Date()).toLocaleString(isRTL ? "ar-EG" : "en-US")}
                      </div>
                    </div>
                    {!notification.read && <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1"></div>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {notifications.length > 0 && (
            <div className="p-3 border-t bg-base-50">
              <button
                className="text-xs text-primary hover:text-primary-focus w-full text-center"
                onClick={() => {
                  // Mark all as read
                  setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
                  setUnreadCount(0)
                }}
              >
                {t("buttons.markAllAsRead")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationCenter
