import { API_BASE_URL } from "../utils/apiBase";
import axios from "axios"
import { getToken } from "./auth-services"
import { normalizeApiError } from "../utils/apiError"
import { translateErrorMessage } from "../utils/errorTranslator"

const API_URL = API_BASE_URL

const authHeaders = (extraHeaders = {}) => ({
  Authorization: `Bearer ${getToken()}`,
  ...extraHeaders,
})

const buildWorkflowResult = (response) => ({
  success: true,
  status: response.data.status,
  data: response.data.data,
  passed: response.data.data?.passed || false,
})

export const verifyExamSubmission = async (lectureId) => {
  try {
    if (!lectureId) {
      throw new Error(translateErrorMessage("Lecture ID is required"))
    }

    const response = await axios.post(
      `${API_URL}/exam-submissions/verify/${lectureId}`,
      {},
      {
        headers: authHeaders({
          "Content-Type": "application/json",
        }),
      },
    )

    return buildWorkflowResult(response)
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
      throw new Error(translateErrorMessage("Lecture ID is required"))
    }

    const response = await axios.get(
      `${API_URL}/student-lecture-access/check/${lectureId}`,
      {
        headers: authHeaders({
          "Content-Type": "application/json",
        }),
      },
    )

    return buildWorkflowResult(response)
  } catch (error) {
    console.error("Error checking lecture access:", error)
    return normalizeApiError(error, "Failed to check lecture access")
  }
}
