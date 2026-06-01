import { API_BASE_URL } from "../utils/apiBase";
import axios from "axios";
import { getToken, isLoggedIn } from "./auth-services";
import { normalizeApiError, normalizeApiErrorWithEmpty404 } from "../utils/apiError";
const API_URL = API_BASE_URL
export const AssistantService = {
  // Fetch all assistants
  getAssistants: async () => {
    try {
      const response = await axios.get(`${API_URL}/assistants/`)

      if (response.data.status === "success") {
        return {
          success: true,
          data: response.data.data,
        }
      } else {
        return {
          success: false,
          error: "Failed to fetch assistants",
        }
      }
    } catch (error) {
      return normalizeApiError(error, "An error occurred while fetching assistants");
    }
  },

  getMyData: async () => {
    try {
      if (!isLoggedIn()) throw new Error("User not authenticated");

      const response = await axios.get(`${API_URL}/users/me/dashboard`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      return {
        success: true,
        data: response.data.data.userInfo
      };
    } catch (error) {
      return normalizeApiError(error, "Failed to fetch user data");
    }
  },

  getAssistantsByLecturer: async (lecturerId) => {
    try {
      if (!isLoggedIn()) throw new Error("User not authenticated");

      const response = await axios.get(
        `${API_URL}/assistants/lecturer/${lecturerId}`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      return {
        success: true,
        data: response.data.data.assistants
      };
    } catch (error) {
      return normalizeApiErrorWithEmpty404(error, "Failed to fetch assistants");
    }
  }
};

export const CreateAssistant = async (data) => {
  try {
    if (!isLoggedIn()) throw new Error("User not authenticated");

    const response = await axios.post(`${API_URL}/assistants`, data, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });

    return {
      success: true,
      data: response.data.data.assistant
    };
  } catch (error) {
    return normalizeApiError(error, "Failed to create assistant");
  }
}

export const deleteAssistant = async (assistantId) => {
  try {
    if (!isLoggedIn()) throw new Error("User not authenticated");

    const response = await axios.delete(`${API_URL}/assistants/${assistantId}`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return normalizeApiError(error, "Failed to delete assistant");
  }
};

// Update an assistant
export const updateAssistant = async (assistantId, data) => {
  try {
    if (!isLoggedIn()) throw new Error("User not authenticated");

    const response = await axios.patch(`${API_URL}/assistants/${assistantId}`, data, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });

    return {
      success: true,
      data: response.data.data.assistant
    };
  } catch (error) {
    return normalizeApiError(error, "Failed to update assistant");
  }
};