import axios from "axios"
import { getToken } from "./auth-services"
import { normalizeApiError } from "../utils/apiError"

const API_URL = import.meta.env.VITE_API_URL

// Function to check if user is logged in
const isLoggedIn = () => {
  return !!getToken()
}

// Function to get all product purchases with pagination
export const getAllProductPurchases = async (queryParams = {}) => {
  try {
    if (!isLoggedIn()) {
      throw new Error("Not authenticated")
    }
    const response = await axios.get(`${API_URL}/ec/purchases/`, {
      params: {
        limit: 6, // Fixed limit as requested
        ...queryParams,
      },
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    })
    return {
      success: true,
      data: response.data,
    }
  } catch (error) {
    return normalizeApiError(error, "Failed to fetch product purchases")
  }
}

// Function to get all book purchases with pagination

// Function to confirm a product purchase
export const confirmProductPurchase = async (purchaseId) => {
  try {
    if (!isLoggedIn()) {
      throw new Error("Not authenticated")
    }

    const response = await axios.patch(
      `${API_URL}/ec/purchases/${purchaseId}/confirm`,
      {},
      {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
      },
    )

    return {
      success: true,
      data: response.data,
    }
  } catch (error) {
    return normalizeApiError(error, "Failed to confirm product purchase")
  }
}

// Function to confirm a book purchase
export const confirmBookPurchase = async (purchaseId) => {
  try {
    if (!isLoggedIn()) {
      throw new Error("Not authenticated")
    }

    const response = await axios.patch(
      `${API_URL}/ec/book-purchases/${purchaseId}/confirm`,
      {},
      {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
      },
    )

    return {
      success: true,
      data: response.data,
    }
  } catch (error) {
    return normalizeApiError(error, "Failed to confirm book purchase")
  }
}

export const getAllStats = async () => {
  try {
    if (!isLoggedIn()) {
      throw new Error("Not authenticated")
    }

    const response = await axios.get(`${API_URL}/ec/purchases/stats`, {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    })

    return {
      success: true,
      data: response.data,
    }
  } catch (error) {
    return normalizeApiError(error, "Failed to fetch stats")
  }
}

export const getProductStats = async (date = null) => {
  try {
    if (!isLoggedIn()) {
      throw new Error("Not authenticated")
    }

    let url = `${API_URL}/ec/purchases/product-purchase-stats`

    // If date is provided, use the stats endpoint with date parameter
    if (date) {
      url = `${API_URL}/ec/purchases/stats?date=${date}`
    }

    const response = await axios.get(url, {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    })

    return {
      success: true,
      data: response.data,
    }
  } catch (error) {
    return normalizeApiError(error, "Failed to fetch product stats")
  }
}

export const updatePurchase = async (purchaseId, updateData) => {
  try {
    if (!isLoggedIn()) {
      throw new Error("Not authenticated")
    }

    const response = await axios.patch(
      `${API_URL}/ec/purchases/${purchaseId}`,
      updateData,
      {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
      },
    )

    return {
      success: true,
      data: response.data,
    }
  } catch (error) {
    return normalizeApiError(error, "Failed to update purchase")
  }
}
