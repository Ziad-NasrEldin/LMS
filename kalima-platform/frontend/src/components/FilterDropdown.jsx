import { ChevronDown } from "lucide-react";
import { useTranslation } from 'react-i18next';
import Button from './ui/Button'

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
         <Button className="w-full justify-between">
           <span>{selectedValue || t("select")}</span>
           <ChevronDown className="h-4 w-4" />
         </Button>
         <ul
           tabIndex={0}
           className="dropdown-content z-[100] menu p-2 mt-1 shadow bg-white rounded-lg w-full"
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

