import axios from "axios";
import { normalizeApiError, normalizeApiErrorWithEmpty404 } from "../utils/apiError";

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
    return normalizeApiErrorWithEmpty404(error, "Failed to fetch students");
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
    return normalizeApiErrorWithEmpty404(error, "Failed to fetch parents");
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
    return normalizeApiErrorWithEmpty404(error, "Failed to fetch assistants");
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
    return normalizeApiError(error, "Failed to fetch lecturers");
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
    return normalizeApiError(error, "Failed to fetch user");
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
    return normalizeApiErrorWithEmpty404(error, "Failed to fetch users");
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
    return normalizeApiError(error, "Failed to create user");
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
    return normalizeApiError(error, "Failed to send request")
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
    return normalizeApiError(error, "Failed to delete user");
  }
};
// --------END DELETE USER--------