import { translateErrorMessage } from "./errorTranslator";

export const normalizeApiError = (error, fallbackMessage) => {
  const translatedMessage = translateErrorMessage(
    error?.response?.data?.message || error?.response?.data?.error || error?.message,
    fallbackMessage
  );

  return {
    status: "error",
    success: false,
    message: translatedMessage,
    error: translatedMessage,
    code: error?.response?.status,
    data: error?.response?.data,
  };
};

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
