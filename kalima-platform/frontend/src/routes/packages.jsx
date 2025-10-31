import axios from 'axios';
import { getToken } from "./auth-services";
import { isLoggedIn } from "./auth-services";

const API_URL = import.meta.env.VITE_API_URL;

export const fetchPackages = async () => {
  try {
      const response = await axios.get(`${API_URL}/packages/`, {
          headers: {
              Authorization: `Bearer ${getToken()}`,
              'Content-Type': 'application/json',
          },
      });
      return {
          success: true,
          data: response.data.data.packages,
      };
  } catch (error) {
      return {
          success: false,
          error: error.response?.data?.message || error.message || 'Failed to fetch packages',
      };
  }
};

export const createPackage = async (packageData) => {
    try {
      if (!isLoggedIn()) {
        throw new Error('Not authenticated');
      }
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/packages/`, packageData, {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
      });
  
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Package created successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to create package',
      };
    }
  };

  export const fetchPackageById = async (packageId) => {
    try {
        const response = await axios.get(`${API_URL}/packages/${packageId}`, {
            headers: {
                Authorization: `Bearer ${getToken()}`,
                'Content-Type': 'application/json',
            },
        });
        return response.data.data.package;
    } catch (error) {
        console.error('Error fetching package by ID:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch package';
        throw new Error(errorMessage);
    }
};

export const deletePackage = async (packageId) => {
  try {
      const response = await axios.delete(`${API_URL}/packages/${packageId}`, {
          headers: {
              Authorization: `Bearer ${getToken()}`,
              'Content-Type': 'application/json',
          },
      });
      return {
          success: true,
          data: response.data,
      };
  } catch (error) {
      return {
          success: false,
          error: error.response?.data?.message || error.message || 'Failed to delete package',
      };
  }
};

export const purchasePackage = async (packageId) => {
  try {
    const response = await axios.post(`${API_URL}/purchases/package`, {
      packageId: packageId,
    }, {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
      },
    })
    return {
      success: response.data.status === "success",
      data: response.data,
      message: response.data.message || "Package purchased successfully"
    }
  } catch (error) {
    console.error("Error purchasing package:", error)
    return {
      success: false,
      error: error,
      message: error.response?.data?.message || "Failed to purchase package"
    }
  }
}