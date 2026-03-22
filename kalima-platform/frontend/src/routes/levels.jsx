import axios from "axios";
import { normalizeApiError } from "../utils/apiError";
const API_URL = import.meta.env.VITE_API_URL;

// Helper function to get auth headers
const getAuthHeader = () => {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getAllLevels = async () => {
  try {
    const response = await axios.get(`${API_URL}/levels/`, {
      headers: getAuthHeader(),
      withCredentials: true,
    });


    const levels = response.data.data.levels;

    const order = ["3rd Secondary", "2nd Secondary", "1st Secondary", "3rd Preparatory", "2nd Preparatory", "1st Preparatory", "6th Primary", "5th Primary", "4th Primary", "3rd Primary", "2nd Primary", "1st Primary",

    ];

    const sortedLevels = levels.sort(
      (a, b) => order.indexOf(a.name) - order.indexOf(b.name)
    );

    return {
      success: true,
      data: sortedLevels,
    };
  } catch (error) {
    return normalizeApiError(error, "Error fetching levels");
  }
};

export const createLevel = async (levelData) => {
  try {
    const response = await axios.post(`${API_URL}/levels/`, levelData, {
      headers: getAuthHeader(),
      withCredentials: true,
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return normalizeApiError(error, "Error creating level");
  }
};

export const deleteLevel = async (levelId) => {
  try {
    const response = await axios.delete(`${API_URL}/levels/${levelId}`, {
      headers: getAuthHeader(),
      withCredentials: true,
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return normalizeApiError(error, "Error deleting level");
  }
};