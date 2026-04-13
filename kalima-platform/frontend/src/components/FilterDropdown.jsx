import { useTranslation } from "react-i18next";
import DSSelect from "./DSSelect";

export function FilterDropdown({ label, options, selectedValue, onSelect, placeholder }) {
  const { t } = useTranslation("common");

  return (
    <div className="form-control w-full">
      <label className="label">
        <span className="label-text">{label}</span>
      </label>
      <DSSelect
        value={selectedValue ?? ""}
        onChange={(event) => onSelect(event.target.value)}
        className="h-12 w-full"
        aria-label={label}
      >
        <option value="">{placeholder || t("select")}</option>
        {options.map((option) => (
          <option key={`${option.value}-${option.label}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </DSSelect>
    </div>
  );
}
