import axios from "axios"
import { getToken } from "./auth-services"
import { normalizeApiError } from "../utils/apiError"

const rawApiUrl = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "")
const API_URL = /\/api\/v1$/i.test(rawApiUrl)
  ? rawApiUrl
  : `${rawApiUrl || ""}/api/v1`



export const updateCurrentUser = async (updateData) => {
  try {
    const isFormData = updateData instanceof FormData

    const response = await axios.patch(
      `${API_URL}/users/me/update`,
      updateData,
      {
        headers: {
          "Content-Type": isFormData ? "multipart/form-data" : "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
      }
    )

    return {
      success: true,
      data: response.data,
    }

  } catch (error) {
    return normalizeApiError(error, "Failed to update user data")
  }
}

/**
 * Updates the user's password
 * @param {Object} passwordData - { currentPassword: string, newPassword: string }
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export const updateUserPassword = async (passwordData) => {
  try {
    const response = await axios.patch(
      `${API_URL}/users/update/password`,
      passwordData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
      }
    );

    return {
      success: true,
      data: response.data
    };

  } catch (error) {
    return normalizeApiError(error, "Failed to update password");
  }
};

export const updateUser = async (userId, updateData) => {
  try {
    const response = await axios.patch(
      `${API_URL}/users/${userId}`,
      updateData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
      }
    )

    return {
      success: true,
      data: response.data,
      message: "User updated successfully"
    }

  } catch (error) {
    console.error("Update user error:", error)
    return normalizeApiError(error, "Failed to update user")
  }
}
