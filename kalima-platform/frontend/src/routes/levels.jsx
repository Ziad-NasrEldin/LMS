import { API_BASE_URL } from "../utils/apiBase";
import axios from "axios";
import i18n from "../components/i18n";
import { normalizeApiError } from "../utils/apiError";
import { buildLevelHierarchy, normalizeLocale } from "../utils/levelHierarchy";
const API_URL = API_BASE_URL;

// Helper function to get auth headers
const getAuthHeader = () => {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getAllLevels = async () => {
  try {
    const currentLang = normalizeLocale(
      i18n.language || localStorage.getItem("lng") || localStorage.getItem("i18nextLng") || "en",
    );
    const locale = currentLang;

    const response = await axios.get(`${API_URL}/levels/`, {
      headers: getAuthHeader(),
      params: { lang: locale },
      withCredentials: true,
    });

    const payload = response.data?.data || {};
    const flatLevels = Array.isArray(payload.levels) ? payload.levels : [];
    const hierarchy = buildLevelHierarchy(flatLevels, locale);
    const sortedLevels = hierarchy.levels;

    return {
      success: true,
      data: sortedLevels,
      hierarchy,
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

export const updateLevel = async (levelId, levelData) => {
  try {
    const response = await axios.patch(`${API_URL}/levels/${levelId}`, levelData, {
      headers: getAuthHeader(),
      withCredentials: true,
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return normalizeApiError(error, "Error updating level");
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
