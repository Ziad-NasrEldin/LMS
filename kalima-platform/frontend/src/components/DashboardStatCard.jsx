import React from "react";

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
    <div className={`rounded-xl border p-4 ${className}`} style={style}>
      <div className="flex items-center gap-2 mb-2 text-primary">
        {icon}
        <h3 className={`font-semibold ${titleClassName}`}>{title}</h3>
      </div>

      <p className={`text-3xl font-extrabold ${valueClassName}`}>{value}</p>

      {subtitle ? <p className={`text-sm opacity-70 mt-1 ${subtitleClassName}`}>{subtitle}</p> : null}
    </div>
  );
};

export default DashboardStatCard;
