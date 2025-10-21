import axios from "axios";
import { getToken, isLoggedIn } from "./auth-services";
import api from "../services/errorHandling";

const API_URL = import.meta.env.VITE_API_URL;

export const getAuditLogs = async (page = 1, limit = 10, filters = {}) => {
  try {
    if (!isLoggedIn()) {
      throw new Error("User not authenticated");
    }

    // Flatten and transform filters for query params
    const transformedFilters = {
      ...filters,
    };

    if (filters.role) {
      transformedFilters["user.role"] = filters.role; // 👈 correct param name
      delete transformedFilters.role;
    }

    const params = {
      page,
      limit,
      ...Object.fromEntries(Object.entries(transformedFilters).filter(([_, v]) => v !== "" && v !== undefined)),
    };

    const token = getToken();

    const response = await axios.get(`${API_URL}/api/v1/audit-logs`, {
      params,
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    return {
      status: "success",
      data: response.data.data,
    };
  } catch (error) {
    return {
      status: "error",
      error: error?.response?.data?.message || error.message || "Unknown error",
    };
  }
};

export const getAuditLogById = async (logId) => {
  try {
    if (!isLoggedIn()) {
      throw new Error("User not authenticated");
    }

    const response = await axios.get(`${API_URL}/api/v1/audit-logs/${logId}`, {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
    });

    return {
      status: "success",
      data: response.data
    };
  } catch (error) {
    return `Error fetching audit log ${logId}: ${error.message}`
  }
};

export const getAuditLogsByEmail = async (email) => {
  try {
    if (!isLoggedIn()) throw new Error("User not authenticated");

    const response = await axios.get(`${API_URL}/api/v1/audit-logs/user/email/${email}`, {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
    });

    return {
      status: "success",
      data: response.data.data,
    };
  } catch (error) {
    return {
      status: "error",
      error: error?.response?.data?.message || error.message || "Unknown error",
    };
  }
};
