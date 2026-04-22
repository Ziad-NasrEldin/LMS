import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import CommentInput from "./CommentInput";
import CommentList from "./CommentList";
import { designTokens } from "../../constants/designTokens";

const CommunityTab = ({ lectureId, userId, userRole }) => {
    const { t, i18n } = useTranslation("lectureDisplay");
    const isRTL = i18n.language === "ar";
    const [refreshKey, setRefreshKey] = useState(0);
    const TOKENS = designTokens.colors;
    const SHADOWS = designTokens.shadows;
    const RADIUS = designTokens.radius;
    const GRADIENTS = designTokens.gradients;

    const handleCommentCreated = () => {
        setRefreshKey(prev => prev + 1);
    };

    return (
        <div className="mx-auto max-w-4xl px-2 py-4 sm:px-4">
            <section
                className="mb-6 overflow-hidden p-5 md:p-6"
                style={{
                    background: `${GRADIENTS.pageAtmosphere}, rgba(255,255,255,0.78)`,
                    borderColor: TOKENS.borderSubtle,
                    borderRadius: RADIUS.section,
                    boxShadow: SHADOWS.level1,
                }}
            >
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <span
                            className="inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.16em]"
                            style={{
                                background: "rgba(188,231,236,0.45)",
                                color: TOKENS.deepTeal,
                                border: `1px solid ${TOKENS.deepTealSubtle}`,
                            }}
                        >
                            {t("communityTitle", "Community")}
                        </span>
                        <h2 className="mt-3 text-3xl font-black tracking-tight" style={{ color: TOKENS.deepTeal }}>
                            {t("communitySubtitle", "Questions, replies, and lecture discussion")}
                        </h2>
                        <p className="mt-2 max-w-2xl text-sm md:text-base" style={{ color: TOKENS.slateText }}>
                            {t("communityDescription", "Keep the conversation tied to this lecture, ask for clarification, and respond in threaded discussions.")}
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 md:min-w-[260px]">
                        <div
                            className="rounded-2xl px-4 py-3"
                            style={{ background: TOKENS.neutralCloud, borderColor: TOKENS.borderSubtle }}
                        >
                            <p className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: TOKENS.slateText }}>
                                {t("threaded", "Threaded")}
                            </p>
                            <p className="mt-1 text-base font-black" style={{ color: TOKENS.deepTeal }}>
                                {t("replies", "Replies")}
                            </p>
                        </div>
                        <div
                            className="rounded-2xl px-4 py-3"
                            style={{ background: TOKENS.neutralCloud, borderColor: TOKENS.borderSubtle }}
                        >
                            <p className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: TOKENS.slateText }}>
                                {t("live", "Live")}
                            </p>
                            <p className="mt-1 text-base font-black" style={{ color: TOKENS.deepTeal }}>
                                {t("feedback", "Feedback")}
                            </p>
                        </div>
                    </div>
                </div>
            </section>
            <CommentInput 
                lectureId={lectureId} 
                onCommentCreated={handleCommentCreated} 
            />
            <CommentList 
                key={refreshKey}
                lectureId={lectureId} 
                userId={userId} 
                userRole={userRole} 
            />
        </div>
    );
};

export default CommunityTab;
