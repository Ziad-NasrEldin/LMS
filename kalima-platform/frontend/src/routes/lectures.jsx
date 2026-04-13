import axios from "axios"
import { getToken, isLoggedIn } from "./auth-services"
import { normalizeApiError, normalizeApiErrorWithEmpty404 } from "../utils/apiError"
import { translateErrorMessage } from "../utils/errorTranslator"

const API_URL = import.meta.env.VITE_API_URL;

const authHeaders = (extraHeaders = {}) => ({
  Authorization: `Bearer ${getToken()}`,
  ...extraHeaders,
})

const authConfig = ({ withCredentials = true, headers = {}, ...rest } = {}) => ({
  ...rest,
  ...(withCredentials ? { withCredentials: true } : {}),
  headers: authHeaders(headers),
})

export const loadLecturePage = async (lectureId) => {
  try {
    const response = await axios.get(`${API_URL}/lectures/load-page/${lectureId}`, authConfig());
    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    return normalizeApiError(error, "Failed to load lecture page data");
  }
};

// Function to get all containers
export const getAllContainers = async (queryParams = {}) => {
  try {
    const response = await axios.get(
      `${API_URL}/containers`,
      authConfig({
        params: queryParams,
      })
    );
    return response.data;
  } catch (error) {
    return normalizeApiError(error, "Error fetching containers");
  }
};

export const getAllLecturesPublic = async (queryParams = {}) => {
  try {
    const response = await axios.get(`${API_URL}/lectures/public`, {
      params: queryParams,
      withCredentials: true,
      auth: `Bearer ${getToken()}`,
    })
    return response.data
  }
  catch (error) {
    return normalizeApiError(error, "Error fetching lectures")
  }
}

// Function to get all containers
export const getAllContainersPublic = async () => {
  try {
    const response = await axios.get(`${API_URL}/containers/public`, {
      withCredentials: true,

    })

    return response.data
  } catch (error) {
    return normalizeApiError(error, "Error fetching containers")
  }
}
//Function to purchase a container
export const purchaseContainer = async (containerId) => {
  try {
    const response = await axios.post(
      `${API_URL}/purchases/container`,
      { containerId },
      authConfig({
        headers: {
          "Content-Type": "application/json",
        },
      })
    )
    return response;

  } catch (error) {
    return {
      success: false,
      status: error.response?.status,
      error: translateErrorMessage(error.response?.data?.message || `Error purchasing container: ${error.message}`),
      data: error.response?.data,
    };
  }
}
// Function to get a container by ID
export const getContainerById = async (containerId) => {
  try {
    if (!containerId) {
      throw new Error(translateErrorMessage("Missing container ID"));
    }

    const response = await axios.get(`${API_URL}/containers/${containerId}`, authConfig());

    // Handle non-2xx status codes
    if (response.status < 200 || response.status >= 300) {
      throw new Error(translateErrorMessage(response.data.message || "Request failed"));
    }

    return response.data;

  } catch (error) {
    return normalizeApiError(error, "Error fetching container")
  }
};

// Get full container hierarchy with all nested children populated
export const getContainerHierarchy = async (containerId) => {
  try {
    if (!containerId) {
      throw new Error(translateErrorMessage("Missing container ID"));
    }

    const token = getToken();
    const config = token 
      ? authConfig() 
      : { withCredentials: true };

    const response = await axios.get(`${API_URL}/containers/${containerId}/hierarchy`, config);

    // Handle non-2xx status codes
    if (response.status < 200 || response.status >= 300) {
      throw new Error(translateErrorMessage(response.data.message || "Request failed"));
    }

    return response.data;

  } catch (error) {
    return normalizeApiError(error, "Error fetching container hierarchy")
  }
};

export const getLectureAttachments = async (lectureId) => {
  try {
    const token = getToken();

    if (!token) {
      return {
        status: "error",
        message: translateErrorMessage("Authentication required"),
      };
    }

    const response = await axios.get(`${API_URL}/lectures/attachments/${lectureId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return {
      status: "success",
      data: response.data,
    };
  } catch (error) {
    return normalizeApiError(error, "Failed to fetch lecture attachments. Please try again later");
  }
};

export const getMyContainers = async () => {
  try {
    const response = await axios.get(`${API_URL}/containers/my-containers`, authConfig())
    return response.data
  } catch (error) {
    return normalizeApiError(error, "Error fetching lecturer containers")
  }
}

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
        message: translateErrorMessage("Authentication required"),
      }
    }

    const response = await axios.delete(`${API_URL}/lectures/${lectureId}`, {
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
      message: translateErrorMessage(error.response?.data?.message || "Failed to delete lecture"),
      error: translateErrorMessage(error.message),
    }
  }
}


export const downloadAttachmentById = async (attachmentId) => {
  try {
    const token = getToken();

    if (!token) {
      throw new Error(translateErrorMessage("Authentication required"));
    }

    const response = await axios.get(`${API_URL}/lectures/attachment/${attachmentId}/file`, {
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
    throw new Error(translateErrorMessage(`Failed to download attachment: ${error.message}`));
  }
};


export const createLecture = async (lectureData) => {
  try {
    const isFormData = lectureData instanceof FormData

    const response = await axios.post(
      `${API_URL}/lectures`,
      lectureData,
      authConfig({
        headers: {
          "Content-Type": isFormData ? "multipart/form-data" : "application/json",
        },
      })
    )

    return response.data
  } catch (error) {
    console.error("Error details:", error)
    // Return a structured error object instead of a string
    return {
      status: "error",
      message: translateErrorMessage(`Error creating lecture: ${error.message}`),
      error,
    }
  }
}

export const updateLecture = async (lectureId, lectureData) => {
  try {
    const isFormData = lectureData instanceof FormData

    const response = await axios.patch(
      `${API_URL}/lectures/${lectureId}`,
      lectureData,
      authConfig({
        headers: {
          "Content-Type": isFormData ? "multipart/form-data" : "application/json",
        },
      })
    )

    return response.data
  } catch (error) {
    return {
      status: "error",
      message: translateErrorMessage(`Error updating lecture: ${error.message}`),
      error,
    }
  }
}


export const createContainer = async (formData) => {
  try {
    const isFormData = formData instanceof FormData

    const response = await axios.post(
      `${API_URL}/containers`,
      formData,
      authConfig({
        headers: {
          "Content-Type": isFormData ? "multipart/form-data" : "application/json",
        },
      })
    )
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error creating container");
  }
};

export const updateContainer = async (containerId, formData) => {
  try {
    const isFormData = formData instanceof FormData

    const response = await axios.patch(
      `${API_URL}/containers/${containerId}`,
      formData,
      authConfig({
        headers: {
          "Content-Type": isFormData ? "multipart/form-data" : "application/json",
        },
      })
    )

    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error updating container")
  }
}

export const getLecturerAnalytics = async (queryParams = {}) => {
  try {
    const response = await axios.get(
      `${API_URL}/lecturers/me/analytics`,
      authConfig({
        params: queryParams,
      })
    );

    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    return normalizeApiError(error, "Failed to fetch lecturer analytics");
  }
};

// Function to get all lectures
export const getAllLectures = async (queryParams = {}) => {
  try {
    const response = await axios.get(
      `${API_URL}/lectures`,
      authConfig({
        params: queryParams,
      })
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching lectures:", error);
    return normalizeApiError(error, "Failed to fetch lectures")
  }
};

export const getContainersByLecturerId = async (lecturerId, queryParams = {}) => {
  try {
    const response = await axios.get(
      `${API_URL}/containers/lecturer/${lecturerId}`,
      authConfig({ params: queryParams })
    );
    return response.data;
  } catch (error) {
    return normalizeApiError(error, `Error fetching containers for lecturer ${lecturerId}`);
  }
};

// Function to get lectures by container ID
export const getLecturesByContainerId = async (containerId) => {
  try {
    if (!isLoggedIn()) {
      throw new Error(translateErrorMessage("User not authenticated"))
    }

    const containerResponse = await getContainerById(containerId)
    if (containerResponse?.status === "error") {
      return containerResponse
    }

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
    return normalizeApiError(error, `Error fetching lectures for container ${containerId}`);
  }
}


// Function to get a lecture by ID
export const getLectureById = async (lectureId) => {
  try {
    const response = await axios.get(`${API_URL}/lectures/${lectureId}`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    })

    return {
      success: true,
      status: response.data.status,
      message: response.data.message,
      data: response.data.data, // Access the data property from the response
    }
  } catch (error) {
    const normalizedError = normalizeApiError(error, "Failed to fetch lecture");
    return {
      success: false,
      error: normalizedError.message,
      status: error.response?.status,
      data: error.response?.data,
    };
  }
}

// Function to get enrollment count for a course
export const getEnrollmentCount = async (containerId) => {
  try {
    if (!containerId) {
      throw new Error(translateErrorMessage("Missing container ID"));
    }

    const response = await axios.get(
      `${API_URL}/containers/${containerId}/enrollment-count`
    );

    return {
      success: true,
      count: response.data.data?.enrollmentCount || 0,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      count: 0,
      error: translateErrorMessage(error.response?.data?.message || "Failed to fetch enrollment count"),
    };
  }
};

// Trigger backend recalculation of total duration for a container (uses YouTube API + Redis cache)
export const recalculateContainerDuration = async (containerId) => {
  try {
    const response = await axios.post(
      `${API_URL}/containers/${containerId}/recalculate-duration`,
      {},
      authConfig()
    )
    return { success: true, data: response.data.data }
  } catch (error) {
    return { success: false, error: error.response?.data?.message || "Failed to recalculate duration" }
  }
}

// Function to delete a container by ID
export const deleteContainerById = async (containerId) => {
  try {
    const response = await axios.delete(
      `${API_URL}/containers/${containerId}`,
      authConfig()
    )

    // Backend may return 204 (no content) on successful delete.
    if (response.status === 200 || response.status === 204) {
      return {
        status: "success",
        success: true,
        data: response.data ?? null,
      }
    }

    return {
      status: "error",
      success: false,
      message: "Failed to delete container",
      data: response.data ?? null,
    }
  } catch (error) {
    return normalizeApiError(error, `Error deleting container ${containerId}`);
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
      `${API_URL}/lectures/attachments/${lectureId}`,
      formData,
      authConfig({
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
    );
    return response.data;
  } catch (error) {
    console.error("Error uploading lecture attachment:", error);
    throw new Error(translateErrorMessage(error.message || "Request failed"));
  }
};

export const updateLectureAttachment = async (lectureId, attachmentData, isFormData = false) => {
  try {
    let formData;
    if (isFormData) {
      formData = attachmentData;
    } else {
      formData = new FormData();
      formData.append("type", attachmentData.type);
      formData.append("attachment", attachmentData.attachment);
    }

    const response = await axios.patch(
      `${API_URL}/lectures/attachments/${lectureId}`,
      formData,
      authConfig({
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
    );
    return response.data;
  } catch (error) {
    console.error("Error updating lecture attachment:", error);
    throw new Error(translateErrorMessage(error.message || "Request failed"));
  }
};
