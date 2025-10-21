// src/routes/revenue.js
import axios from "axios";
import { getToken } from "./auth-services";
import api from "../services/errorHandling";

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Fetch overall revenue summary
 * @returns {Promise<object>} summary data or throws error
 */
export const getRevenueSummary = async () => {
  try {
    const response = await axios.get(
      `${API_URL}/api/v1/revenue/`,
      {
        withCredentials: true,
        headers: { Authorization: `Bearer ${getToken()}` }
      }
    );
    return response.data.data;
  } catch (error) {
    console.error("Error fetching revenue summary:", error);
    throw error;
  }
};

/**
 * Fetch revenue breakdown by lesson
 * @returns {Promise<Array>} breakdown array or throws error
 */
export const getRevenueBreakdown = async () => {
  try {
    const response = await axios.get(
      `${API_URL}/api/v1/revenue/breakdown`,
      {
        withCredentials: true,
        headers: { Authorization: `Bearer ${getToken()}` }
      }
    );
    return response.data.data.breakdown;
  } catch (error) {
    console.error("Error fetching revenue breakdown:", error);
    throw error;
  }
};

export const getLecturerMonthlyRevenue = async (lecturerId) => {
  try {
    const response = await axios.get(
      `${API_URL}/api/v1/containers/${lecturerId}/monthly-revenue`,
      {
        withCredentials: true,
        headers: { Authorization: `Bearer ${getToken()}` }
      }
    );
    return response.data.data;
  } catch (error) {
    console.error("Error fetching lecturer monthly revenue:", error);
    throw error;
  }
};