import api from "../services/errorHandling";
import { getToken } from "./auth-services";

const COMMENTS_BASE_PATH = "/comments";
const authConfig = () => ({
    headers: {
        Authorization: `Bearer ${getToken()}`,
    },
});

export const getLectureComments = async (lectureId, page = 1, limit = 20) => {
    const response = await api.get(
        `${COMMENTS_BASE_PATH}/lecture/${lectureId}?page=${page}&limit=${limit}`,
        authConfig()
    );
    return response.data;
};

export const getCommentReplies = async (commentId, page = 1, limit = 10) => {
    const response = await api.get(
        `${COMMENTS_BASE_PATH}/comment/${commentId}/replies?page=${page}&limit=${limit}`,
        authConfig()
    );
    return response.data;
};

export const createComment = async (commentData) => {
    const response = await api.post(COMMENTS_BASE_PATH, commentData, authConfig());
    return response.data;
};

export const updateComment = async (commentId, content) => {
    const response = await api.patch(`${COMMENTS_BASE_PATH}/${commentId}`, { content }, authConfig());
    return response.data;
};

export const deleteComment = async (commentId) => {
    const response = await api.delete(`${COMMENTS_BASE_PATH}/${commentId}`, authConfig());
    return response.data;
};

export const toggleCommentLike = async (commentId) => {
    const response = await api.post(`${COMMENTS_BASE_PATH}/${commentId}/like`, {}, authConfig());
    return response.data;
};
