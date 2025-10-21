import { io } from "socket.io-client";
import { getToken } from "../routes/auth-services";

let socket = null;

export const initializeSocket = (userId) => {
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

  socket = io(import.meta.env.VITE_API_URL, {
    auth: {
      token,
    },
    query: {
      userId,
    },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 20000,
  });

  socket.on("connect", () => {
    socket.emit("subscribe", userId);
  });

  socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error);
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", reason);

    // Attempt to reconnect if it was server-initiated
    if (reason === "io server disconnect") {
      console.log("Server initiated disconnect, attempting to reconnect...");
      socket.connect();
    }
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
  disconnectSocket();
  return initializeSocket(userId);
};
