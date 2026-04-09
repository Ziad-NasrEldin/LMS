import React, { useState } from "react";
import { FiSend } from "react-icons/fi";
import Button from "../ui/Button";
import toast from "react-hot-toast";
import { createComment } from "../../routes/comments";
import { designTokens } from "../../constants/designTokens";

const CommentInput = ({
    lectureId,
    parentId = null,
    onCommentCreated,
    placeholder = "Write your comment here...",
    title = "Ask a question or leave a comment",
    submitLabel = null,
    compact = false,
}) => {
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);
    const TOKENS = designTokens.colors;
    const SHADOWS = designTokens.shadows;
    const RADIUS = designTokens.radius;
    const GRADIENTS = designTokens.gradients;

    const handleSubmit = async () => {
        if (!content.trim()) return;

        setLoading(true);
        try {
            const result = await createComment({
                lectureId,
                content,
                parentId,
            });
            if (result.status === "success") {
                setContent("");
                onCommentCreated?.(result.data);
                toast.success(parentId ? "Reply posted successfully" : "Comment posted successfully");
            }
        } catch (error) {
            toast.error(error?.message || "Failed to post comment");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className={`flex flex-col gap-3 border ${compact ? "p-3" : "mb-6 p-4 md:p-5"}`}
            style={{
                background: compact ? "rgba(255,255,255,0.82)" : TOKENS.neutralCloud,
                borderColor: TOKENS.borderSubtle,
                borderRadius: compact ? "1.2rem" : RADIUS.card,
                boxShadow: SHADOWS.level1,
            }}
        >
            {title ? (
                <div>
                    <h3 className="mb-1 text-sm font-black uppercase tracking-[0.12em]" style={{ color: TOKENS.deepTeal }}>
                        {title}
                    </h3>
                    {!compact ? (
                        <p className="text-sm" style={{ color: TOKENS.slateText }}>
                            Start a focused thread for this lecture.
                        </p>
                    ) : null}
                </div>
            ) : null}
            <div className={`flex gap-2 ${compact ? "items-end" : ""}`}>
                <textarea
                    className={`w-full p-3 text-sm outline-none transition-all duration-200 ${compact ? "min-h-[72px]" : "min-h-[108px]"}`}
                    placeholder={placeholder}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    style={{
                        borderRadius: compact ? "1rem" : "1.2rem",
                        border: `1px solid ${TOKENS.borderSubtle}`,
                        background: "rgba(255,255,255,0.92)",
                        color: TOKENS.inkText,
                        boxShadow: "inset 0 1px 2px rgba(17,24,39,0.04)",
                    }}
                />
                <Button 
                    variant="primary" 
                    onClick={handleSubmit} 
                    isLoading={loading}
                    className={submitLabel ? "shrink-0" : "aspect-square shrink-0"}
                    isDisabled={loading || !content.trim()}
                    style={{
                        background: GRADIENTS.cta,
                        color: "#F8FCFF",
                        borderRadius: compact ? "1rem" : RADIUS.chip,
                        boxShadow: SHADOWS.level1,
                    }}
                >
                    {submitLabel ? (
                        <>
                            <FiSend className="mr-2" />
                            {submitLabel}
                        </>
                    ) : (
                        <FiSend />
                    )}
                </Button>
            </div>
        </div>
    );
};

export default CommentInput;
