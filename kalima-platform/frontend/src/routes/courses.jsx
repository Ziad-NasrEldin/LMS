import axios from "axios";
import { getToken, isLoggedIn } from "./auth-services";
import api from "../services/errorHandling";

const API_URL = import.meta.env.VITE_API_URL;

// Fetch all subjects
export const getAllSubjects = async () => {
  try {
    if (!isLoggedIn()) {
      throw new Error('Not authenticated');
    }
    const response = await axios.get(`${API_URL}/api/v1/subjects/`, {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });

    return {
      success: true,
      data: response.data.data.subjects, // Extract the subjects array
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to fetch subjects: ${error.message}`,
    };
  }
};

// Get subject by ID
export const getSubjectById = async (subjectId) => {
  try {
    if (!isLoggedIn()) {
      throw new Error('Not authenticated');
    }
    const response = await axios.get(`${API_URL}/api/v1/subjects/${subjectId}`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });

    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to fetch subject: ${error.message}`,
    };
  }
};

// Get lectures by subject
export const getLecturesBySubject = async (subjectId) => {
  try {
    if (!isLoggedIn()) {
      throw new Error('Not authenticated');
    }
    const response = await axios.get(`${API_URL}/api/v1/lectures?subject=${subjectId}`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return {
      success: true,
      data: response.data.data.lectures,
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to fetch lectures: ${error.message}`,
    };
  }
};

// Create a new subject
export const createSubject = async (subjectData) => {
  try {
    if (!isLoggedIn()) {
      throw new Error('Not authenticated');
    }
    const response = await axios.post(`${API_URL}/api/v1/subjects/`, subjectData, {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
      },
    });

    return {
      success: true,
      data: response.data.data,
      message: response.data.message || 'Subject created successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to create subject',
    };
  }
};

export const deleteSubject = async (subjectId) => {
  try {
    if (!isLoggedIn()) {
      throw new Error('Not authenticated');
    }
    const response = await axios.delete(`${API_URL}/api/v1/subjects/${subjectId}`, {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to delete subject: ${error.message}`,
    };
  }
};
