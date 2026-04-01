import axios from "axios"
import { getToken } from "./auth-services"

const API_URL = import.meta.env.VITE_API_URL

export const RecalculateInvites = async () => {
  try {
    const response = await axios.post(
      `${API_URL}/ec/referrals/recalculate`,
      {},
      {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
      },
    )
    return response.data
  } catch (error) {
    console.error(`Error Calculating Invites: ${error.message}`)
    throw new Error(error.response?.data?.message || error.message || "Request failed")
  }
}
