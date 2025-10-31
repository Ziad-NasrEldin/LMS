import axios from "axios";
import { getToken, isLoggedIn } from "./auth-services";
import api from "../services/errorHandling";

// Use the correct API URL format
const API_URL = import.meta.env.VITE_API_URL;

export const getAllCenters = async () => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error("Authentication token is required");
    }

    const response = await axios.get(`${API_URL}/centers/`, {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    // Check if the response has the expected structure
    if (response.data && response.data.status === "success") {
      return {
        status: "success",
        data: response.data
      };
    } else {
      console.error("Unexpected API response structure:", response.data);
      return {
        status: "error",
        message: "Unexpected API response structure"
      };
    }
  } catch (error) {
    return `Failed to fetch centers: ${error.message}`
  }
};

// New function to get center data by type
export const getCenterDataByType = async (centerId, type) => {
  try {
    if (!centerId) {
      throw new Error("Center ID is required");
    }
    
    if (!type || !["lecturers", "students", "lessons"].includes(type)) {
      throw new Error("Valid type is required (lecturers, students, or lessons)");
    }

    const token = getToken();
    if (!token) {
      throw new Error("Authentication token is required");
    }

    const response = await axios.get(`${API_URL}/centers/${centerId}/${type}`, {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    // Check if the response has the expected structure
    if (response.data && response.data.status === "success") {
      return {
        status: "success",
        data: response.data.data
      };
    } else {
      console.error("Unexpected API response structure:", response.data);
      return {
        status: "error",
        message: "Unexpected API response structure"
      };
    }
  } catch (error) {
    return `Failed to fetch ${type} : ${error.message}`
  }
};

// Keep this function for backward compatibility if needed
export const getCenterTimetable = async (centerId) => {
  try {
    if (!centerId) {
      throw new Error("Center ID is required");
    }

    const token = getToken();
    if (!token) {
      throw new Error("Authentication token is required");
    }

    const response = await axios.get(`${API_URL}/centers/${centerId}/timetable`, {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
    });

    // Check if the response has the expected structure
    if (response.data && response.data.status === "success" && response.data.data) {
      return {
        status: "success",
        data: response.data.data
      };
    } else {
      console.error("Unexpected API response structure:", response.data);
      return {
        status: "error",
        message: "Unexpected API response structure"
      };
    }
  } catch (error) {
    return `Failed to fetch timetable:${error.message}`
  }
};

export const addNewLesson = async (lessonData) => {
  try {
    if (!lessonData) {
      throw new Error("Lesson data is required");
    }

    // Validate required fields
    const requiredFields = ['subject', 'lecturer', 'level', 'startTime', 'duration', 'centerId'];
    for (const field of requiredFields) {
      if (!lessonData[field]) {
        throw new Error(`${field} is required`);
      }
    }

    const token = getToken();
    if (!token) {
      throw new Error("Authentication token is required");
    }

    // Format date to YYYY-MM-DD if it's a Date object
    let formattedData = { ...lessonData };
    if (formattedData.startTime instanceof Date) {
      formattedData.startTime = formattedData.startTime.toISOString().split('T')[0];
    }

    // Ensure duration is a number
    formattedData.duration = parseInt(formattedData.duration);

    const response = await axios.post(
      `${API_URL}/centers/lessons`,
      formattedData,
      {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Check if the response has the expected structure
    if (response.data && response.data.status === "success") {
      return {
        status: "success",
        data: response.data.data
      };
    } else {
      console.error("Unexpected API response structure:", response.data);
      return {
        status: "error",
        message: "Unexpected API response structure"
      };
    }
  } catch (error) {
    return `Failed to add new lesson:${error.message}`
  }
};

export const getAllParents = async () => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error("Authentication token is required");
    }

    const response = await axios.get(`${API_URL}/parents`, {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.data && response.data.status === "success") {
      return {
        status: "success",
        data: response.data.data.parents,
      };
    } else {
      console.error("Unexpected API response structure:", response.data);
      return {
        status: "error",
        message: "Unexpected API response structure",
      };
    }
  } catch (error) {
    return `Failed to fetch parents: ${error.message}`;
  }
};

// Send report per lesson
export const sendLessonReport = async (reportData) => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error("Authentication token is required");
    }

    const response = await axios.post(
      `${API_URL}/reports/lesson`,
      reportData,
      {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data && response.data.status === "success") {
      return {
        status: "success",
        data: response.data,
      };
    } else {
      console.error("Unexpected API response structure:", response.data);
      return {
        status: "error",
        message: "Unexpected API response structure",
      };
    }
  } catch (error) {
    return `Failed to send lesson report: ${error.message}`;
  }
};

// Send report per month
export const sendMonthReport = async (reportData) => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error("Authentication token is required");
    }

    const response = await axios.post(
      `${API_URL}/reports/month`,
      reportData,
      {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data && response.data.status === "success") {
      return {
        status: "success",
        data: response.data,
      };
    } else {
      console.error("Unexpected API response structure:", response.data);
      return {
        status: "error",
        message: "Unexpected API response structure",
      };
    }
  } catch (error) {
    return `Failed to send month report: ${error.message}`;
  }
};

// Send report per course
export const sendCourseReport = async (reportData) => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error("Authentication token is required");
    }

    const response = await axios.post(
      `${API_URL}/reports/course`,
      reportData,
      {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data && response.data.status === "success") {
      return {
        status: "success",
        data: response.data,
      };
    } else {
      console.error("Unexpected API response structure:", response.data);
      return {
        status: "error",
        message: "Unexpected API response structure",
      };
    }
  } catch (error) {
    return `Failed to send course report: ${error.message}`;
  }
};

export const getAllAttendance = async () => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error("Authentication token is required");
    }

    const response = await axios.get(`${API_URL}/attendance`, {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.data && response.data.status === "success") {
      return {
        status: "success",
        data: response.data.data.attendance || [],
      };
    } else {
      console.error("Unexpected API response structure:", response.data);
      return {
        status: "error",
        message: "Unexpected API response structure",
      };
    }
  } catch (error) {
    return {
      status: "error",
      message: `Failed to fetch attendance: ${error.message}`,
    };
  }
};


export const getLessonById = async (lessonId) => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error("Authentication token is required");
    }

    const response = await axios.get(`${API_URL}/lessons/${lessonId}`, {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.data && response.data.status === "success") {
      return {
        status: "success",
        data: response.data.data.lesson,
      };
    } else {
      console.error("Unexpected API response structure:", response.data);
      return {
        status: "error",
        message: "Unexpected API response structure",
      };
    }
  } catch (error) {
    return {
      status: "error",
      message: `Failed to fetch lesson: ${error.message}`,
    };
  }
};

export const recordAttendance = async (attendanceData) => {
  try {
    if (!isLoggedIn()) {
      throw new Error('Not authenticated');
    }
    const token = getToken();
    const response = await axios.post(`${API_URL}/attendance`, attendanceData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return {
      success: true,
      data: response.data.data,
      message: response.data.message || 'Attendance recorded successfully',
    };
  } catch (error) {
    console.error('Error recording attendance:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to record attendance',
    };
  }
};

export const createLecturer = async (lecturerData) => {
  try {
    if (!isLoggedIn()) {
      throw new Error('Not authenticated');
    }
    const response = await axios.post(`${API_URL}/center-lecturer/`, lecturerData, {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
      },
    });

    return {
      success: true,
      data: response.data.data,
      message: response.data.message || 'Lecturer created successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to create lecturer',
    };
  }
};