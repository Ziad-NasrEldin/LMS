import axios from "axios";
import api from "../services/errorHandling";

const API_URL = import.meta.env.VITE_API_URL;

export const getAuthHeader = () => {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};
// --------START FETCHING USERS--------
export const getAllStudents = async () => {
  try {
    const response = await axios.get(`${API_URL}/users/role/student`, {
      headers: getAuthHeader(),
    });
    console.log("Fetched students:", response);

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("API Error:", error);
    return `Failed to fetch students: ${error.message}`
  }
};

export const getAllParents = async () => {
  try {
    const response = await axios.get(`${API_URL}/users/role/parent`, {
      headers: getAuthHeader(),
    });
    console.log("Fetched parents:", response);

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("API Error:", error);
    return `Failed to fetch parents : ${error.message}`
  }
};

export const getAllAssistants = async () => {
  try {
    const response = await axios.get(`${API_URL}/users/role/assistant`, {
      headers: getAuthHeader(),
    });
    console.log("Fetched assistants:", response);

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("API Error:", error);
    return `Failed to fetch assistants: ${error.message}`
  }
};

export const getAllLecturers = async () => {
  try {
    const response = await axios.get(`${API_URL}/lecturers`, {
      headers: getAuthHeader(),
    });
    console.log("Fetched lecturers:", response);
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    console.error("API Error:", error);
    return `Failed to fetch lecturers: ${error.message}`
  }
};

export const getUserById = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}/users/${userId}`, {
      headers: getAuthHeader(),
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("API Error:", error);
    return `Failed to fetch user : ${error.message}`
  }
};

export const getAllUsers = async () => {
  try {
    const response = await axios.get(`${API_URL}/users/`, {
      headers: getAuthHeader(),
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("API Error:", error);
    return `Failed to fetch users: ${error.message}`
  }
};
// --------END FETCHING USERS--------

// --------START CREATE USER--------
export const createUser = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/users/`, userData, {
      headers: getAuthHeader(),
    });
    return { success: true, data: response.data };
  } catch (error) {
    if (error.response && error.response.data) {
      return {
        success: false,
        error: error.response.data.message || error.response.data.error || `Failed to create user: ${error.message}`,
      };
    }
    return {
      success: false,
      error: `Failed to create user: ${error.message}`,
    };
  }
};

export const bulkCreateUsers = async (formData) => {
  try {
    const response = await axios.post(`${API_URL}/users/accounts/bulk-create`, formData, {
      headers: {
        ...getAuthHeader(),
        "Content-Type": "multipart/form-data",
      },
    })
    return { success: true, data: response.data }
  } catch (error) {
    console.error("Bulk create users error:", error)

    // Handle different error scenarios
    if (error.response) {
      // The server responded with a status code outside the 2xx range
      const errorMessage =
        error.response.data?.message || error.response.data?.error || `Server error: ${error.response.status}`
      return { success: false, error: errorMessage }
    } else if (error.request) {
      // The request was made but no response was received
      return { success: false, error: "No response from server. Please check your connection." }
    } else {
      // Something happened in setting up the request
      return { success: false, error: `Failed to send request: ${error.message}` }
    }
  }
}

// --------END CREATE USER--------

// --------START DELETE USER--------
export const deleteUser = async (userId) => {
  try {
    const response = await axios.delete(`${API_URL}/users/${userId}`, {
      headers: getAuthHeader(),
    });
    return { success: true, data: response.data };
  } catch (error) {
    return `Failed to delete user: ${error.message}`
  }
};
// --------END DELETE USER--------