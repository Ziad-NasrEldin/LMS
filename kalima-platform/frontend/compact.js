
const fs = require("fs");
const file = "src/pages/CourseDetails.jsx";
let content = fs.readFileSync(file, "utf8");

const newJsx = `  return (
    <div
      className={\`card mb-2 overflow-hidden transition-all duration-300 \${isExpanded ? "shadow-md ring-1 ring-primary/20" : "bg-base-100 shadow-sm"} border border-base-200/60\`}
      style={
        isExpanded
          ? {
              backgroundImage: "linear-gradient(135deg, rgba(14,85,99,0.03) 0%, rgba(243,154,63,0.05) 100%)",
            }
          : { background: "#FFFFFF" }
      }
    >
      <div className="p-2 sm:p-3 relative">
        <div className="flex items-center gap-2">
          {/* Icon */}
          <div className="flex-shrink-0">
            {container.type === "lecture" ? (
              <FaPlayCircle className="text-primary opacity-80" size={16} />
            ) : (
              <FaBook className="text-primary opacity-80" size={16} />
            )}
          </div>

          {/* Texts and badges */}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <h3 className="text-[13px] sm:text-sm font-bold leading-tight truncate text-slate-800">
              {container.name}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 font-sans">
              <span className="badge badge-accent font-semibold border-0 text-[10px] px-1.5 py-1 whitespace-nowrap min-h-0 h-4">
                {containerTypeLabel}
              </span>
              {container.price > 0 ? (
                <span className="badge badge-neutral font-semibold border-0 text-[10px] px-1.5 py-1 whitespace-nowrap min-h-0 h-4">
                  {container.price} {t("pricing.points")}
                </span>
              ) : (
                <span className="badge badge-success font-semibold border-0 text-[10px] px-1.5 py-1 whitespace-nowrap min-h-0 h-4 text-white">
                  {t("pricing.free")}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-shrink-0 items-center justify-end gap-1.5">
            {containerIsPurchased ? (
              <span className="text-success text-[10px] font-bold flex items-center gap-1 bg-success/10 px-1.5 py-0.5 rounded whitespace-nowrap">
                <FaUnlock size={10} />
                <span className="hidden sm:inline">
                  {parentPurchased ? t("purchase.availableInCourse") : t("purchase.purchased")}
                </span>
              </span>
            ) : (
              <button
                className={\`btn btn-xs rounded bg-primary text-white border-0 px-2 min-h-0 h-6 \${purchaseInProgress === containerId ? "loading" : ""}\`}
                style={{ fontSize: "11px", fontWeight: "700" }}
                onClick={() => onPurchase(containerId)}
                disabled={purchaseInProgress !== null}
              >
                {container.price > 0 ? t("purchase.buy") : t("purchase.getFree")}
              </button>
            )}

            {hasChildren && (
              <button
                className={\`btn btn-circle min-h-0 h-6 w-6 border-0 flex items-center justify-center transition-all shadow-sm \${isExpanded ? "text-white" : "bg-base-200 text-slate-600 hover:bg-base-300"}\`}
                style={isExpanded ? {
                  backgroundImage: "linear-gradient(120deg, #0E5563 0%, #146A78 52%, #F39A3F 100%)",
                } : undefined }
                onClick={fetchChildren}
                disabled={loading}
                aria-expanded={isExpanded}
              >
                {loading ? (
                  <span className="loading loading-spinner w-3 h-3"></span>
                ) : (
                  <FaChevronDown className={\`w-2.5 h-2.5 transition-transform duration-300 \${isExpanded ? "rotate-180" : "rotate-0"}\`} />
                )}
              </button>
            )}
          </div>
        </div>
      </div>\`;

const startIdx = content.indexOf("  return (\n    <div\n      className={`card mb-2");
const endIdx = content.indexOf("        </div>\n      </div>", startIdx);

if (startIdx !== -1 && endIdx !== -1) {
  content = content.substring(0, startIdx) + newJsx + content.substring(endIdx + 29);
  fs.writeFileSync(file, content);
  console.log("Updated!");
} else {
  console.log("Could not find bounds", startIdx, endIdx);
}

