import { API_BASE_URL } from "../utils/apiBase";
import axios from "axios";
import { getToken } from "./auth-services";
import { getAuthHeader } from "./fetch-users";

const API_URL = API_BASE_URL;

export const extractExamConfigs = (payload) => {
  if (!payload) return [];

  if (Array.isArray(payload)) return payload;

  if (Array.isArray(payload.examConfigs)) return payload.examConfigs;
  if (Array.isArray(payload.data?.examConfigs)) return payload.data.examConfigs;
  if (Array.isArray(payload.data?.data?.examConfigs)) return payload.data.data.examConfigs;

  return [];
};

export const extractCreatedExamConfig = (payload) => {
  if (!payload) return null;

  if (payload._id) return payload;

  if (payload.examConfig?._id) return payload.examConfig;
  if (payload.data?.examConfig?._id) return payload.data.examConfig;
  if (payload.data?.data?.examConfig?._id) return payload.data.data.examConfig;

  return null;
};

export const getExamConfigs = async () => {
  try {
    const response = await axios.get(`${API_URL}/exam-configs`, {
      headers: {
        ...getAuthHeader(),
        Authorization: `Bearer ${getToken()}`,
      },
      withCredentials: true,
    });

    return {
      success: true,
      data: extractExamConfigs(response.data),
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || error.message,
    };
  }
};

export const createExamConfig = async (configData) => {
  try {
    const response = await axios.post(`${API_URL}/exam-configs`, configData, {
      headers: {
        ...getAuthHeader(),
        Authorization: `Bearer ${getToken()}`,
      },
      withCredentials: true,
    });

    const createdConfig = extractCreatedExamConfig(response.data);
    if (!createdConfig?._id) {
      return {
        success: false,
        message: "Failed to parse created exam configuration",
      };
    }

    return {
      success: true,
      data: createdConfig,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || error.message,
    };
  }
};
