import { io } from "socket.io-client";
import { getToken } from "../routes/auth-services";

let socket = null;
let reconnectDisabled = false;

const API_URL = import.meta.env.VITE_API_URL || "";

const resolveSocketServerUrl = () => {
  // Socket.IO server is mounted on the backend host root (path defaults to /socket.io).
  if (/^https?:\/\//i.test(API_URL)) {
    return API_URL.replace(/\/api\/v1\/?$/i, "").replace(/\/$/, "");
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "";
};

const shouldDisableReconnect = (error) => {
  const msg = String(error?.message || "").toLowerCase();
  return msg.includes("authentication") || msg.includes("invalid namespace");
};

export const initializeSocket = (userId) => {
  if (reconnectDisabled) {
    return null;
  }

  if (!userId) {
    console.error("Cannot initialize socket: Missing userId");
    return null;
  }

  if (socket?.connected) {
    return socket;
  }

  const token = getToken();
  if (!token) {
    console.error("Cannot initialize socket: No authentication token");
    return null;
  }

  // Close any existing socket before creating a new one
  if (socket) {
    socket.close();
    socket = null;
  }

  const socketServerUrl = resolveSocketServerUrl();

  socket = io(socketServerUrl, {
    auth: {
      token,
    },
    query: {
      userId,
    },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
    randomizationFactor: 0.5,
    timeout: 20000,
  });

  socket.on("connect", () => {
    reconnectDisabled = false;
    socket.emit("subscribe", userId);
  });

  socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error?.message || error);

    // Stop retry storms for auth/namespace failures until explicit reconnect.
    if (shouldDisableReconnect(error)) {
      reconnectDisabled = true;
      socket.disconnect();
    }
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", reason);
  });

  socket.on("error", (error) => {
    console.error("Socket error:", error);
  });

  socket.on("newHomework", (notification) => {
    console.log("Received homework notification:", notification);
  });

  socket.on("newLecture", (notification) => {
    console.log("Received lecture notification:", notification);
  });

  socket.on("newContainer", (notification) => {
    console.log("Received container notification:", notification);
  });

  socket.on("notification", (notification) => {
    console.log("Received general notification:", notification);
  });

  socket.on("newAttachment", (notification) => {
    console.log("Received attachment notification:", notification);
  });

  socket.on("lectureUpdate", (notification) => {
    console.log("Received lecture update notification:", notification);
  });

  return socket;
};

export const getSocket = () => {
  if (!socket?.connected) {
    console.warn("Attempted to get socket, but none is connected");
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    console.log("Manually disconnecting socket");
    socket.disconnect();
    socket = null;
  }
};

export const forceReconnect = (userId) => {
  reconnectDisabled = false;
  disconnectSocket();
  return initializeSocket(userId);
};
