import  axios  from "axios";
import { getToken, isLoggedIn } from "./auth-services";
import api from "../services/errorHandling";
const API_URL = import.meta.env.VITE_API_URL
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
        return `An error occurred while fetching assistants: ${error.message}`
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
        return `Failed to fetch user data: ${error.message}`
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
        return `Failed to fetch assistants: ${error.message}`
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
      return `Failed to create assistant: ${error.message}`
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
      return {
        success: false,
        error: error.message
      };
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
      return {
        success: false,
        error: error.message
      };
    }
  };