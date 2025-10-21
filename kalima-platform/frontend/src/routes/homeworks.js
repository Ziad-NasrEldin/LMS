import axios from "axios";
import { getToken } from "./auth-services";
import { getSocket } from "../utils/socket";

/**
 * Upload homework for a lecture
 * @param {string} lectureId - The ID of the lecture
 * @param {Object} homeworkData - The homework data (type and attachment)
 * @returns {Promise<Object>} - The response data
 */
export const uploadHomework = async (lectureId, homeworkData) => {
  try {
    if (!lectureId) {
      throw new Error("Lecture ID is required");
    }

    if (!homeworkData || !homeworkData.attachment) {
      throw new Error("Homework data and attachment are required");
    }

    // Create form data
    const formData = new FormData();
    formData.append("type", homeworkData.type || "homeworks");
    formData.append("file", homeworkData.attachment); // Changed from attachment to file to match backend

    const response = await axios.post(
      `${
        import.meta.env.VITE_API_URL
      }/api/v1/attachments/upload-homework/${lectureId}`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    // If upload successful, emit a custom event through socket if available
    if (response.data.status === "success") {
      const socket = getSocket();
      if (socket && socket.connected) {
        // Emit custom event for anyone who wants to listen (e.g., notifications)
        socket.emit("homework:uploaded", {
          lectureId,
          fileName: homeworkData.attachment.name,
          uploadDate: new Date().toISOString(),
        });
      }
    }

    return {
      success: response.data.status === "success",
      data: response.data.data,
      status: response.data.status,
    };
  } catch (error) {
    console.error("Error uploading homework:", error);
    return {
      success: false,
      error:
        error.response?.data?.message ||
        error.message ||
        "Failed to upload homework",
    };
  }
};

/**
 * Get homeworks for a lecture
 * @param {string} lectureId - The ID of the lecture
 * @param {Object} options - Query options (limit, page)
 * @returns {Promise<Object>} - The response data
 */
export const getLectureHomeworks = async (
  lectureId,
  options = { limit: 100, page: 1 }
) => {
  try {
    if (!lectureId) {
      throw new Error("Lecture ID is required");
    }

    const { limit, page } = options;

    const response = await axios.get(
      `${
        import.meta.env.VITE_API_URL
      }/api/v1/lectures/${lectureId}/homework?limit=${limit}&page=${page}`,
      {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
      }
    );

    return {
      success: response.data.status === "success",
      data: response.data.data,
      status: response.data.status,
      results: response.data.result,
    };
  } catch (error) {
    console.error("Error fetching lecture homeworks:", error);
    return {
      success: false,
      error:
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch lecture homeworks",
    };
  }
};
