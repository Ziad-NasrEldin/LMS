import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { getLectureComments } from "../../routes/comments";
import CommentItem from "./CommentItem";
import Button from "../ui/Button";
import toast from "react-hot-toast";
import { designTokens } from "../../constants/designTokens";

const CommentList = ({ lectureId, userId, userRole }) => {
    const { t } = useTranslation("lectureDisplay");
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const TOKENS = designTokens.colors;
    const SHADOWS = designTokens.shadows;
    const RADIUS = designTokens.radius;
    const GRADIENTS = designTokens.gradients;

    const fetchComments = useCallback(async (pageNum = 1, append = false) => {
        setLoading(true);
        try {
            const result = await getLectureComments(lectureId, pageNum);
            if (result.status === "success") {
                const newComments = result.data;
                setComments(prev => append ? [...prev, ...newComments] : newComments);
                const currentPage = result.pagination?.page ?? pageNum;
                const totalPages = result.pagination?.pages ?? currentPage;
                setHasMore(currentPage < totalPages);
                setPage(currentPage);
            }
        } catch (error) {
            toast.error(error?.message || t("failedToLoadComments"));
        } finally {
            setLoading(false);
        }
    }, [lectureId, t]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    const loadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchComments(nextPage, true);
    };

    return (
        <div className="flex flex-col gap-4">
            {comments.length === 0 && !loading ? (
                <div
                    className="border px-5 py-10 text-center"
                    style={{
                        background: "rgba(255,255,255,0.72)",
                        borderColor: TOKENS.borderSubtle,
                        borderRadius: RADIUS.card,
                        boxShadow: SHADOWS.level1,
                        color: TOKENS.slateText,
                    }}
                >
                    <p className="text-lg font-black" style={{ color: TOKENS.deepTeal }}>
                        {t("noCommentsYet", "No comments yet")}
                    </p>
                    <p className="mt-2 italic">
                        {t("beFirstToAsk", "Be the first to ask a question.")}
                    </p>
                </div>
            ) : (
                <>
                    {comments.map(comment => (
                        <CommentItem 
                            key={comment._id} 
                            comment={comment} 
                            userId={userId} 
                            userRole={userRole} 
                            onCommentUpdate={() => fetchComments(1)} 
                        />
                    ))}
                    {hasMore && (
                        <div className="flex justify-center mt-4">
                    <Button 
                        onClick={loadMore} 
                        isDisabled={loading} 
                        variant="outline" 
                        size="sm"
                        className="rounded-full"
                        style={{
                            borderRadius: RADIUS.chip,
                            borderColor: TOKENS.deepTeal,
                            color: TOKENS.deepTeal,
                            background: "rgba(255,255,255,0.78)",
                        }}
                    >
                        {loading ? t("loading", "Loading...") : t("loadMore", "Load More")}
                    </Button>
                        </div>
                    )}
                </>
            )}
            {loading && comments.length === 0 && (
                <div className="flex justify-center py-10">
                    <div
                        className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
                        style={{ borderColor: TOKENS.deepTeal, borderTopColor: "transparent" }}
                    ></div>
                </div>
            )}
        </div>
    );
};

export default CommentList;
