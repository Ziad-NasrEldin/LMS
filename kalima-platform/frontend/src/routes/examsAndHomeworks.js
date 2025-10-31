import axios from "axios";
import { getToken } from "./auth-services"; // Adjust the path based on your project structure
import { getAuthHeader } from "./fetch-users"; // Adjust the path based on your project structure

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Fetches student submissions for a specific lecture
 * @param {string} lectureId - The ID of the lecture
 * @returns {Promise<{ success: boolean, data?: any, error?: string }>} 
 *          - On success: { success: true, data: response.data }
 *          - On failure: { success: false, error: errorMessage }
 */
export const getStudentSubmissionsByLectureId = async (lectureId) => {
  try {
    const token = getToken();

    if (!token) {
      return {
        success: false,
        error: "Authentication token not found. Please log in again.",
      };
    }

    const response = await axios.get(`${API_URL}/assistant-homework/lecture/${lectureId}`, {
      headers: {
        ...getAuthHeader(),
        "Content-Type": "application/json",
      },
    });

    return { success: true, data: response.data.data };
  } catch (error) {
    console.error("Error fetching student submissions:", error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || "Failed to fetch student submissions",
    };
  }
};

/**
 * Verify if a student has submitted and passed an exam for a specific lecture
 * @param {string} lectureId - The ID of the lecture
 * @returns {Promise<Object>} - The response data
 */
export const verifyExamSubmission = async (lectureId) => {
  try {
    if (!lectureId) {
      throw new Error("Lecture ID is required")
    }

    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/exam-submissions/verify/${lectureId}`,
      {}, // Empty object as request body
      {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
      }
    )

    return {
      success: true,
      status: response.data.status,
      data: response.data.data,
      passed: response.data.data?.passed || false
    }
  } catch (error) {
    console.error("Error verifying exam submission:", error)
    return {
      success: false,
      status: "fail",
      error: error.response?.data?.message || error.message || "Failed to verify exam submission",
    }
  }
}

/**
 * Check if a student has access to a lecture
 * @param {string} lectureId - The ID of the lecture
 * @returns {Promise<Object>} - The response data
 */
export const checkLectureAccess = async (lectureId) => {
  try {
    if (!lectureId) {
      throw new Error("Lecture ID is required")
    }

    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}/student-lecture-access/check/${lectureId}`,
      {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
      } // Removed extra comma here
    )

    // Return the direct response data, which includes status, message, and data
    return response.data
  } catch (error) {
    console.error("Error checking lecture access:", error)
    return {
      status: "error",
      message: error.response?.data?.message || error.message || "Failed to check lecture access",
    }
  }
}