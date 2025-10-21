import { ChevronDown } from "lucide-react";
import { useTranslation } from 'react-i18next';

export function FilterDropdown({ label, options, selectedValue, onSelect }) {
  const { t } = useTranslation("common");

  const handleSelect = (value) => {
    onSelect(value);
    document.activeElement?.blur();
  };

  return (
    <div className="form-control w-full">
      <label className="label">
        <span className="label-text">{label}</span>
      </label>
      <div className="dropdown dropdown-end w-full">
        <div tabIndex={0} role="button" className="btn w-full justify-between">
          <span>{selectedValue || t("select")}</span>
          <ChevronDown className="h-4 w-4" />
        </div>
        <ul
          tabIndex={0}
          className="dropdown-content z-[100] menu p-2 mt-1 shadow bg-base-100 rounded-box w-full"
          aria-labelledby="dropdown-button"
        >
          {options.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                onClick={() => handleSelect(option.value)}
                className="w-full text-left"
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

