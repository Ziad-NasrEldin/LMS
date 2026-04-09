import { translateErrorMessage } from "./errorTranslator";

export const normalizeApiError = (error, fallbackMessage) => {
  const rawMessage =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallbackMessage

  const translatedMessage = translateErrorMessage(rawMessage, fallbackMessage);
  const apiError = error?.response?.data?.error;

  return {
    status: "error",
    success: false,
    message: translatedMessage,
    error: translatedMessage,
    rawMessage,
    translatedMessage,
    code: error?.response?.status,
    errorCode: error?.response?.data?.code || apiError?.code,
    field: error?.response?.data?.field || apiError?.field,
    statusCode: error?.response?.data?.statusCode || apiError?.statusCode || error?.response?.status,
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
