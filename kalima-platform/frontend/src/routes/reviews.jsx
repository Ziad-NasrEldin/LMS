import { API_BASE_URL } from "../utils/apiBase";
import axios from "axios"
import { getToken } from "./auth-services"
import { normalizeApiError } from "../utils/apiError"

const API_URL = API_BASE_URL

const authHeaders = (extraHeaders = {}) => ({
  Authorization: `Bearer ${getToken()}`,
  ...extraHeaders,
})

const authConfig = ({ withCredentials = true, headers = {}, ...rest } = {}) => ({
  ...rest,
  ...(withCredentials ? { withCredentials: true } : {}),
  headers: authHeaders(headers),
})

// ─── PUBLIC API ─────────────────────────────────────────────────────────────

// Get all approved reviews for a course (public - no auth required)
export const getCourseReviews = async (containerId) => {
  try {
    const response = await axios.get(
      `${API_URL}/reviews/course/${containerId}`,
      { withCredentials: true }
    )
    return response.data
  } catch (error) {
    return normalizeApiError(error, "Error fetching reviews")
  }
}

// ─── STUDENT API ────────────────────────────────────────────────────────────

// Create a new review
export const createReview = async (reviewData) => {
  try {
    const response = await axios.post(
      `${API_URL}/reviews`,
      reviewData,
      authConfig()
    )
    return response.data
  } catch (error) {
    return normalizeApiError(error, "Error creating review")
  }
}

// Get student's own review for a course
export const getMyReview = async (containerId) => {
  try {
    const response = await axios.get(
      `${API_URL}/reviews/my-review/${containerId}`,
      authConfig()
    )
    return response.data
  } catch (error) {
    return normalizeApiError(error, "Error fetching your review")
  }
}

// Update student's review
export const updateMyReview = async (containerId, reviewData) => {
  try {
    const response = await axios.patch(
      `${API_URL}/reviews/my-review/${containerId}`,
      reviewData,
      authConfig()
    )
    return response.data
  } catch (error) {
    return normalizeApiError(error, "Error updating review")
  }
}

// Delete student's review
export const deleteMyReview = async (containerId) => {
  try {
    const response = await axios.delete(
      `${API_URL}/reviews/my-review/${containerId}`,
      authConfig()
    )
    return response.data
  } catch (error) {
    return normalizeApiError(error, "Error deleting review")
  }
}

// ─── ADMIN API ──────────────────────────────────────────────────────────────

// Get all reviews (with filtering and pagination)
export const getAllReviews = async (params = {}) => {
  try {
    const response = await axios.get(
      `${API_URL}/reviews`,
      authConfig({ params })
    )
    return response.data
  } catch (error) {
    return normalizeApiError(error, "Error fetching reviews")
  }
}

// Get review statistics
export const getReviewStats = async () => {
  try {
    const response = await axios.get(
      `${API_URL}/reviews/stats`,
      authConfig()
    )
    return response.data
  } catch (error) {
    return normalizeApiError(error, "Error fetching review statistics")
  }
}

// Approve a review
export const approveReview = async (reviewId) => {
  try {
    const response = await axios.patch(
      `${API_URL}/reviews/${reviewId}/approve`,
      {},
      authConfig()
    )
    return response.data
  } catch (error) {
    return normalizeApiError(error, "Error approving review")
  }
}

// Reject a review
export const rejectReview = async (reviewId) => {
  try {
    const response = await axios.patch(
      `${API_URL}/reviews/${reviewId}/reject`,
      {},
      authConfig()
    )
    return response.data
  } catch (error) {
    return normalizeApiError(error, "Error rejecting review")
  }
}

// Respond to a review
export const respondToReview = async (reviewId, response) => {
  try {
    const res = await axios.patch(
      `${API_URL}/reviews/${reviewId}/respond`,
      { response },
      authConfig()
    )
    return res.data
  } catch (error) {
    return normalizeApiError(error, "Error responding to review")
  }
}

// Delete a review (admin)
export const deleteReview = async (reviewId) => {
  try {
    const response = await axios.delete(
      `${API_URL}/reviews/${reviewId}`,
      authConfig()
    )
    return response.data
  } catch (error) {
    return normalizeApiError(error, "Error deleting review")
  }
}
