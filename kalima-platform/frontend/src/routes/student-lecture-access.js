import axios from "axios"
import { getToken } from "./auth-services"
import { normalizeApiError } from "../utils/apiError"

/**
 * Get all student lecture accesses for a specific lecture
 * @param {string} lectureId - The ID of the lecture
 * @param {number} limit - The maximum number of records to return
 * @returns {Promise<Object>} - The response data
 */
export const getAllStudentLectureAccess = async (lectureId, limit = 100) => {
  try {
    if (!lectureId) {
      throw new Error("Lecture ID is required")
    }

    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}/student-lecture-access/lecture/${lectureId}`,
      {
        params: { limit },
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
      },
    )

    return {
      success: true,
      data: response.data.data?.accessRecords || [],
      lecture: response.data.data?.lecture || null,
      results: response.data.results,
      status: response.data.status,
    }
  } catch (error) {
    console.error("Error fetching student lecture access:", error)
    return normalizeApiError(error, "Failed to fetch student lecture access")
  }
}

/**
 * Get student lecture access by lecture ID
 * @param {string} lectureId - The ID of the lecture
 * @returns {Promise<Object>} - The response data
 */
export const getStudentLectureAccessByLectureId = async (lectureId) => {
  try {
    if (!lectureId) {
      throw new Error("Lecture ID is required")
    }

    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}/student-lecture-access/lecture/${lectureId}`,
      {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
      },
    )

    return {
      success: response.data.status === "success",
      data: response.data.data,
      status: response.data.status,
      results: response.data.results,
    }
  } catch (error) {
    console.error("Error fetching student lecture access by lecture ID:", error)
    return normalizeApiError(error, "Failed to fetch student lecture access")
  }
}

export const updateStudentLectureAccess = async (accessId, data) => {
  try {
    if (!accessId) {
      throw new Error("Access ID is required")
    }

    const response = await axios.patch(
      `${import.meta.env.VITE_API_URL}/student-lecture-access/${accessId}`,
      data,
      {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
      },
    )

    return {
      success: response.data.status === "success",
      data: response.data.data,
    }
  } catch (error) {
    console.error("Error updating student lecture access:", error)
    return normalizeApiError(error, "Failed to update student lecture access")
  }
}

export const accountStudentLecturePlayStart = async (accessId, eventId, purchaseId = null) => {
  try {
    if (!accessId) {
      throw new Error("Access ID is required")
    }

    if (!eventId) {
      throw new Error("eventId is required")
    }

    const payload = { eventId }

    if (purchaseId) {
      payload.purchaseId = purchaseId
    }

    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/student-lecture-access/${accessId}/play-start`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
      },
    )

    return {
      success: response.data.status === "success",
      data: response.data.data,
    }
  } catch (error) {
    console.error("Error accounting student lecture play start:", error)
    return normalizeApiError(error, "Failed to account lecture play start")
  }
}

export const consumeStudentLectureView = async (accessId, eventId, purchaseId = null) =>
  accountStudentLecturePlayStart(accessId, eventId, purchaseId)

// Update the checkStudentLectureAccess function to handle both container and standalone lectures
export const checkStudentLectureAccess = async (studentId, lectureId, purchaseId, isStandaloneLecture = false) => {
  try {
    if (!studentId) {
      throw new Error("Student ID is required")
    }
    if (!lectureId) {
      throw new Error("Lecture ID is required")
    }
    if (!purchaseId) {
      throw new Error("Purchase ID is required")
    }

    let apiUrl;
    if (isStandaloneLecture) {
      // Use standalone lecture endpoint
      apiUrl = `${import.meta.env.VITE_API_URL}/lectures/student/${studentId}/lecture/${lectureId}/purchase/${purchaseId}`;
    } else {
      // Use container-based lecture endpoint
      apiUrl = `${import.meta.env.VITE_API_URL}/containers/student/${studentId}/container/${lectureId}/purchase/${purchaseId}`;
    }

    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
    })

    return {
      success: response.data.status === "success",
      data: response.data.data,
      status: response.data.status,
    }
  } catch (error) {
    console.error("Error checking student lecture access:", error)
    return normalizeApiError(error, "Failed to check student lecture access")
  }
}
