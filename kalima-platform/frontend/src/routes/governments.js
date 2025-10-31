// src/routes/governments.js
import axios from "axios";
const API_URL = import.meta.env.VITE_API_URL;

// Helper function to get auth headers
const getAuthHeader = () => {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Fetch all governments from the API
 * @returns {Promise<Object>} Response object with success status and data/error
 */
export const getAllGovernments = async () => {
  try {
    const response = await axios.get(`${API_URL}/governments`, {
      headers: getAuthHeader(),
      withCredentials: true,
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: `Error fetching governments: ${error.message}`,
    };
  }
};

/**
 * Fetch administration zones for a specific government
 * @param {string} governmentName - The name of the government
 * @returns {Promise<Object>} Response object with success status and data/error
 */
export const getGovernmentZones = async (governmentName) => {
  if (!governmentName) {
    return {
      success: true,
      data: [],
    };
  }
  
  try {
    const response = await axios.get(`${API_URL}/governments/${encodeURIComponent(governmentName)}/zones`, {
      headers: getAuthHeader(),
      withCredentials: true,
    });

    return {
      success: true,
      data: response.data.zones || [],
    };
  } catch (error) {
    return {
      success: false,
      error: `Error fetching zones for ${governmentName}: ${error.message}`,
    };
  }
};