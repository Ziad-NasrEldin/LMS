import axios from "axios"
import { getToken } from "./auth-services"
import { getAuthHeader } from "./fetch-users"
import { normalizeApiError } from "../utils/apiError"

export const verifyExamSubmission = async (lectureId) => {
  try {
    if (!lectureId) {
      throw new Error("Lecture ID is required")
    }

    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/exam-submissions/verify/${lectureId}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
      },
    )

    return {
      success: true,
      status: response.data.status,
      data: response.data.data,
      passed: response.data.data?.passed || false,
    }
  } catch (error) {
    console.error("Error verifying exam submission:", error)
    const normalizedError = normalizeApiError(error, "Failed to verify exam submission")
    return {
      success: false,
      status: "fail",
      error: normalizedError.message,
    }
  }
}

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
      },
    )

    return response.data
  } catch (error) {
    console.error("Error checking lecture access:", error)
    return {
      status: "error",
      message: error.response?.data?.message || error.message || "Failed to check lecture access",
    }
  }
}
