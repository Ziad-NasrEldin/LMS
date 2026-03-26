import React from "react";
import { designTokens } from "../constants/designTokens";

const TOKENS = designTokens.colors;
const SHADOWS = designTokens.shadows;
const RADIUS = designTokens.radius;

const DashboardStatCard = ({
  icon,
  title,
  value,
  subtitle,
  className = "",
  style,
  titleClassName = "",
  valueClassName = "",
  subtitleClassName = "",
}) => {
  return (
    <div
      className={`border p-5 sm:p-6 ${className}`}
      style={{
        background: TOKENS.neutralCloud,
        borderColor: "rgba(17,24,39,0.08)",
        boxShadow: SHADOWS.level1,
        borderRadius: RADIUS.card,
        ...style,
      }}
    >
      <div className="mb-3 flex items-center gap-3">
        <div
          className="grid h-10 w-10 place-items-center rounded-full"
          style={{ background: TOKENS.lightAquaMist, color: TOKENS.deepTeal }}
        >
          {icon}
        </div>
        <h3 className={`text-xs font-bold uppercase tracking-[0.16em] ${titleClassName}`} style={{ color: TOKENS.slateText }}>
          {title}
        </h3>
      </div>

      <p className={`text-3xl font-black tracking-tight ${valueClassName}`} style={{ color: TOKENS.inkText }}>
        {value}
      </p>

      {subtitle ? (
        <p className={`text-sm mt-2 ${subtitleClassName}`} style={{ color: TOKENS.slateText }}>
          {subtitle}
        </p>
      ) : null}
    </div>
  );
};

export default DashboardStatCard;
