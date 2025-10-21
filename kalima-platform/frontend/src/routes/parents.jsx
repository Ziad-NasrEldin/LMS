import axios from "axios";
import { getToken } from "../routes/auth-services";

/**
 * Fetches the children data for the logged-in parent user
 * @returns {Promise<{success: boolean, data?: any, error?: string}>} 
 *          - On success: { success: true, data: response.data }
 *          - On failure: { success: false, error: errorMessage }
 */
const API_URL = import.meta.env.VITE_API_URL;
export const getChildrenData = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/v1/users/me/children`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
    });

    return { 
      success: true, 
      data: response.data 
    };

  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 
            error.message || 
            "Failed to fetch children data"
    };
  }
};