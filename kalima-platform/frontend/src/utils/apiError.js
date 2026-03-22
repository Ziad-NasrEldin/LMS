export const normalizeApiError = (error, fallbackMessage) => ({
  status: "error",
  success: false,
  message: error?.response?.data?.message || `${fallbackMessage}: ${error?.message || "Unknown error"}`,
  error: error?.response?.data?.message || `${fallbackMessage}: ${error?.message || "Unknown error"}`,
  code: error?.response?.status,
  data: error?.response?.data,
});

export const normalizeApiErrorWithEmpty404 = (error, fallbackMessage) => {
  if (error?.response?.status === 404) {
    return {
      status: "success",
      success: true,
      data: [],
      message: "",
      error: null,
      code: 404,
    };
  }

  return normalizeApiError(error, fallbackMessage);
};
