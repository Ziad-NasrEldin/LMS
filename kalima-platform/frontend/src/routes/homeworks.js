import axios from "axios";
import { getToken } from "./auth-services";
import { translateErrorMessage } from "../utils/errorTranslator";
import { normalizeApiError } from "../utils/apiError";

/**
 * Upload homework for a lecture
 * @param {string} lectureId - The ID of the lecture
 * @param {Object} homeworkData - The homework data (type and attachment)
 * @returns {Promise<Object>} - The response data
 */
export const uploadHomework = async (lectureId, homeworkData) => {
  try {
    if (!lectureId) {
      throw new Error(translateErrorMessage("Lecture ID is required"));
    }

    if (!homeworkData || !homeworkData.attachment) {
      throw new Error(translateErrorMessage("Homework data and attachment are required"));
    }

    // Create form data
    const formData = new FormData();
    formData.append("type", homeworkData.type || "homeworks");
    formData.append("file", homeworkData.attachment); // Changed from attachment to file to match backend

    const response = await axios.post(
      `${
        import.meta.env.VITE_API_URL
      }/attachments/upload-homework/${lectureId}`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );

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
      throw new Error(translateErrorMessage("Lecture ID is required"));
    }

    const { limit, page } = options;

    const response = await axios.get(
      `${
        import.meta.env.VITE_API_URL
      }/lectures/${lectureId}/homework?limit=${limit}&page=${page}`,
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

export const updateHomeworkFeedback = async (attachmentId, feedbackData) => {
  try {
    if (!attachmentId) {
      throw new Error(translateErrorMessage("Attachment ID is required"));
    }

    const response = await axios.patch(
      `${import.meta.env.VITE_API_URL}/attachments/${attachmentId}/feedback`,
      feedbackData,
      {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
      }
    );

    return {
      success: response.data.status === "success",
      data: response.data.data?.attachment || null,
      status: response.data.status,
    };
  } catch (error) {
    console.error("Error updating homework feedback:", error);
    return normalizeApiError(error, "Failed to update homework feedback");
  }
};
