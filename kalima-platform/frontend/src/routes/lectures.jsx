import axios from "axios"
import { getToken, isLoggedIn } from "./auth-services"

const API_URL = import.meta.env.VITE_API_URL;

// Function to get all containers
export const getAllContainers = async (queryParams = {}) => {
  try {
    const response = await axios.get(`${API_URL}/api/v1/containers`, {
      params: queryParams, // Pass query parameters like limit and type
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return response.data;
  } catch (error) {
    return `Error fetching containers: ${error.message}`;
  }
};

export const getAllLecturesPublic = async (queryParams = {}) => {
  try {
    const response = await axios.get(`${API_URL}/api/v1/lectures/public`, {
      params: queryParams,
      withCredentials: true,
      auth: `Bearer ${getToken()}`,
    })
    return response.data
  }
  catch (error) {
    return `Error fetching lectures: ${error.message}`
  }
}

// Function to get all containers
export const getAllContainersPublic = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/v1/containers/public`, {
      withCredentials: true,

    })

    return response.data
  } catch (error) {
    return `Error fetching containers: ${error.message}`
  }
}
//Function to purchase a container
export const purchaseContainer = async (containerId) => {
  try {
    const response = await axios.post(`${API_URL}/api/v1/purchases/container`, 
      { containerId }, // Send containerId in the request body
      {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      }
    )
    return response;
    
  } catch (error) {
    return `Error purchasing container : ${error.message}`
  }
}
// Function to get a container by ID
export const getContainerById = async (containerId) => {
  try {
    if (!containerId) {
      throw new Error("Missing container ID");
    }

    const response = await axios.get(
      `${API_URL}/api/v1/containers/${containerId}`,
      {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      }
    );

    // Handle non-2xx status codes
    if (response.status < 200 || response.status >= 300) {
      throw new Error(response.data.message || "Request failed");
    }

    return response.data;

  } catch (error) {
    return `Error fetching container : ${error.message}`
  }
};

export const getLectureAttachments = async (lectureId) => {
  try {
    const token = getToken();

    if (!token) {
      return {
        status: "error",
        message: "Authentication required",
      };
    }

    const response = await axios.get(`${API_URL}/api/v1/lectures/attachments/${lectureId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return {
      status: "success",
      data: response.data,
    };
  } catch (error) {
    return `Failed to fetch lecture attachments. Please try again later : ${error.message}`;
  }
};

/**
 * Delete a lecture by ID
 * @param {string} lectureId - The ID of the lecture to delete
 * @returns {Promise<Object>} - The response from the API
 */
export const deleteLecture = async (lectureId) => {
  try {
    const token = getToken()

    if (!token) {
      return {
        success: false,
        message: "Authentication required",
      }
    }

    const response = await axios.delete(`${API_URL}/api/v1/lectures/${lectureId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return {
      success: true,
      message: "Lecture deleted successfully",
      data: response.data,
    }
  } catch (error) {
    console.error("Error deleting lecture:", error)

    return {
      success: false,
      message: error.response?.data?.message || "Failed to delete lecture",
      error: error.message,
    }
  }
}


export const downloadAttachmentById = async (attachmentId) => {
  try {
    const token = getToken();

    if (!token) {
      throw new Error("Authentication required");
    }

    const response = await axios.get(`${API_URL}/api/v1/lectures/attachment/${attachmentId}/file`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      responseType: "blob", // Important for handling binary data (PDF)
    });

    // Create a blob URL and trigger download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `attachment_${attachmentId}.pdf`); // Default filename
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return {
      status: "success",
      data: response.data,
    };
  } catch (error) {
    console.error("Error downloading attachment:", error);
    throw new Error(`Failed to download attachment: ${error.message}`);
  }
};


export const createLecture = async (lectureData) => {
  try {
    const isFormData = lectureData instanceof FormData

    const response = await axios.post(`${API_URL}/api/v1/lectures`, lectureData, {
      withCredentials: true,
      headers: {
        "Content-Type": isFormData ? "multipart/form-data" : "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
    })

    return response.data
  } catch (error) {
    console.error("Error details:", error)
    // Return a structured error object instead of a string
    return {
      status: "error",
      message: `Error creating lecture: ${error.message}`,
      error,
    }
  }
}


export const createContainer = async (formData) => {
  try {
    const response = await axios.post(`${API_URL}/api/v1/containers`, formData, {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error creating container");
  }
};

export const getMyContainers = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/v1/containers/my-containers`, {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    })

    return {
      status: "success",
      data: response.data.data
    }
  } catch (error) {
    console.error("Error fetching my containers:", error)
    return `Failed to fetch containers : ${error.message}`
  }
}

// Function to get all lectures
export const getAllLectures = async (queryParams = {}) => {
  try {
    const response = await axios.get(`${API_URL}/api/v1/lectures`, {
      params: queryParams,
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },});
    return response.data;
  } catch (error) {
    console.error("Error fetching lectures:", error);
    return `Failed to fetch lectures : ${error.message}`
  }
};

export const getContainersByLecturerId = async (lecturerId) => {
  try {
    const response = await axios.get(`${API_URL}/api/v1/containers/lecturer/${lecturerId}`, {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return response.data;
  } catch (error) {
    return `Error fetching containers for lecturer ${lecturerId}: ${error.message}`;
  }
};

// Function to get lectures by container ID
export const getLecturesByContainerId = async (containerId) => {
  try {
    if (!isLoggedIn()) {
      throw new Error("User not authenticated")
    }

    const containerResponse = await getContainerById(containerId)
    const containerData = containerResponse.data
    const childrenArray = containerData?.children || containerData?.container?.children || []


    if (!childrenArray.length) {
      return { data: { lectures: [] } }
    }

    const lectures = childrenArray.map(child => ({
      _id: child._id || child.id,
      name: child.name,
      kind: child.kind || "Lecture",
      parent: containerId,
      price: child.price || 0,
      description: child.description || "",
      numberOfViews: child.numberOfViews || 0,
    }))

    return { data: { lectures } }
  } catch (error) {
    return `Error fetching lectures for container ${containerId}: ${error.message}`;
  }
}


// Function to get a lecture by ID
export const getLectureById = async (lectureId) => {
  try {
    const response = await axios.get(`${API_URL}/api/v1/lectures/${lectureId}`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    })

    return {
      success: true,
      data: response.data.data, // Access the data property from the response
    }
  } catch (error) {
    return error.message;
  }
}

// Function to delete a container by ID
export const deleteContainerById = async (containerId) => {
  try {
    const response = await axios.delete(`${API_URL}/api/v1/containers/${containerId}`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    })
    if (response.status === 200) {
      alert(`Container ${containerId} deleted successfully`)
    }
    return response.data
  } catch (error) {
    return `Error deleting container ${containerId}: ${error.message}`;
  }
}

export const createLectureAttachment = async (lectureId, attachmentData, isFormData = false) => {
  try {
    let formData;
    if (isFormData) {
      formData = attachmentData;
    } else {
      formData = new FormData();
      formData.append("type", attachmentData.type);
      formData.append("attachment", attachmentData.attachment);
    }

    const response = await axios.post(
      `${API_URL}/api/v1/lectures/attachments/${lectureId}`,
      formData,
      {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error uploading lecture attachment:", error);
    throw error;
  }
};
