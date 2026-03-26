import axios from "axios";
import { getToken } from "./auth-services";
import { getAuthHeader } from "./fetch-users";

const API_URL = import.meta.env.VITE_API_URL;

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
      data: response.data,
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

    return {
      success: true,
      data: response.data.data.examConfig,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || error.message,
    };
  }
};