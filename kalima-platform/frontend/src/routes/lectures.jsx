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

const FILE_EXTENSION_BY_CONTENT_TYPE = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "text/plain": "txt",
  "application/zip": "zip",
  "application/x-rar-compressed": "rar",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const parseContentDispositionFileName = (contentDisposition) => {
  if (!contentDisposition) return "";

  const utf8Match = contentDisposition.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch (_error) {
      return utf8Match[1];
    }
  }

  const quotedMatch = contentDisposition.match(/filename\s*=\s*"([^"]+)"/i);
  if (quotedMatch?.[1]) {
    return quotedMatch[1];
  }

  const plainMatch = contentDisposition.match(/filename\s*=\s*([^;]+)/i);
  if (plainMatch?.[1]) {
    return plainMatch[1].trim();
  }

  return "";
};

const sanitizeDownloadName = (value, fallbackName) => {
  const normalized = String(value || "")
    .replace(/[\r\n]/g, "")
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "-")
    .trim();

  return normalized || fallbackName;
};

const ensureExtension = (fileName, contentType) => {
  if (/\.[a-z0-9]{2,8}$/i.test(fileName)) {
    return fileName;
  }

  const extension = FILE_EXTENSION_BY_CONTENT_TYPE[String(contentType || "").toLowerCase()];
  if (!extension) return fileName;
  return `${fileName}.${extension}`;
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

    const encodedHeaderName = response.headers?.["x-download-filename"];
    let headerFileName = "";
    if (encodedHeaderName) {
      try {
        headerFileName = decodeURIComponent(encodedHeaderName);
      } catch (_error) {
        headerFileName = encodedHeaderName;
      }
    } else {
      headerFileName = parseContentDispositionFileName(response.headers?.["content-disposition"]);
    }
    const fallbackName = `attachment-${attachmentId}`;
    const fileName = ensureExtension(
      sanitizeDownloadName(headerFileName, fallbackName),
      response.data?.type || response.headers?.["content-type"],
    );

    // Create a blob URL and trigger download
    const url = window.URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return {
      status: "success",
      data: response.data,
      fileName,
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
    const response = await axios.post(`${API_URL}/containers`, formData, authConfig());
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

export const getMyContainers = async () => {
  try {
    const response = await axios.get(`${API_URL}/containers/my-containers`, authConfig())

    return {
      status: "success",
      data: response.data.data
    }
  } catch (error) {
    return normalizeApiErrorWithEmpty404(error, "Failed to fetch containers")
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

export const getContainersByLecturerId = async (lecturerId) => {
  try {
    const response = await axios.get(`${API_URL}/containers/lecturer/${lecturerId}`, authConfig());
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

// Function to delete a container by ID
export const deleteContainerById = async (containerId) => {
  try {
    const response = await axios.delete(
      `${API_URL}/containers/${containerId}`,
      authConfig({ withCredentials: false })
    )
    if (response.status === 200) {
      alert(`Container ${containerId} deleted successfully`)
    }
    return response.data
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
