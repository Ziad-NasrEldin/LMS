import axios from "axios"
import { getToken, isLoggedIn } from "./auth-services"

const API_URL = import.meta.env.VITE_API_URL

// Get all coupons
export const getAllCoupons = async () => {
  try {
    if (!isLoggedIn()) {
      throw new Error("Not authenticated")
    }

    const response = await axios.get(`${API_URL}/api/v1/ec/coupons`, {
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
    return {
      success: false,
      error: `Failed to fetch coupons: ${error.message}`,
    }
  }
}

// Get active coupons
export const getActiveCoupons = async () => {
  try {
    if (!isLoggedIn()) {
      throw new Error("Not authenticated")
    }

    const response = await axios.get(`${API_URL}/api/v1/ec/coupons/active`, {
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
    return {
      success: false,
      error: `Failed to fetch active coupons: ${error.message}`,
    }
  }
}

// Get used coupons
export const getUsedCoupons = async () => {
  try {
    if (!isLoggedIn()) {
      throw new Error("Not authenticated")
    }

    const response = await axios.get(`${API_URL}/api/v1/ec/coupons/used`, {
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
    return {
      success: false,
      error: `Failed to fetch used coupons: ${error.message}`,
    }
  }
}

// Get coupon by ID
export const getCouponById = async (couponId) => {
  try {
    if (!isLoggedIn()) {
      throw new Error("Not authenticated")
    }

    const response = await axios.get(`${API_URL}/api/v1/ec/coupons/${couponId}`, {
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
    return {
      success: false,
      error: `Failed to fetch coupon: ${error.message}`,
    }
  }
}

// Create new coupon
export const createCoupon = async (couponData) => {
  try {
    if (!isLoggedIn()) {
      throw new Error("Not authenticated")
    }

    const response = await axios.post(`${API_URL}/api/v1/ec/coupons`, couponData, {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
    })

    return {
      success: true,
      data: response.data,
    }
  } catch (error) {
    return {
      success: false,
      error: `Failed to create coupon: ${error.response?.data?.message || error.message}`,
    }
  }
}

// Delete coupon
export const deleteCoupon = async (couponId) => {
  try {
    if (!isLoggedIn()) {
      throw new Error("Not authenticated")
    }

    const response = await axios.delete(`${API_URL}/api/v1/ec/coupons/${couponId}`, {
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
    return {
      success: false,
      error: `Failed to delete coupon: ${error.response?.data?.message || error.message}`,
    }
  }
}

export const useCoupon = async (couponCode, purchaseId) => {
  try {
    if (!isLoggedIn()) {
      throw new Error("Not authenticated")
    }

    const response = await axios.post(
      `${API_URL}/api/v1/ec/coupons/use`,
      {
        couponCode: couponCode,
        purchaseId: purchaseId,
      },
      {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
      }
    )

    return {
      success: true,
      data: response.data,
    }
  } catch (error) {
    return {
      success: false,
      error: `Failed to apply coupon: ${error.response?.data?.message || error.message}`,
    }
  }
}

// Validate coupon (optional - to check if coupon is valid before purchase)
export const validateCoupon = async (couponCode) => {
  try {
    if (!isLoggedIn()) {
      throw new Error("Not authenticated")
    }

    const response = await axios.post(
      `${API_URL}/api/v1/ec/coupons/validate/`,
      {
        couponCode: couponCode,
      },
      {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
      }
    )

    return {
      success: true,
      data: response.data,
    }
  } catch (error) {
    return {
      success: false,
      error: `Failed to validate coupon: ${error.response?.data?.message || error.message}`,
    }
  }
}
