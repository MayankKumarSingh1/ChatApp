import axios from "axios"

const API_URL =import.meta.env.VITE_API_URL;

export const registerUser = async (userData) => {
    try {
        const response = await axios.post(`${API_URL}/api/register`, userData);
        return response;
    } catch (error) {
        console.error("Backend error:", error.response?.data || error.message);
        return {error:error.response?.data?.message || "Server error"};
    }
};



export const loginUser = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/api/login`, userData);
    return { 
      success: true,
      token: response.data.token
     };
  } catch (error) {
    return { success: false, message: "Login failed. Please check your credentials." };
  }
};
