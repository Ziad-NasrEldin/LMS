import { useState, useEffect } from "react";

function getStorageValue(key, defaultValue) {
    // getting stored value
    const saved = localStorage.getItem(key);
    if (saved === null) {
        return defaultValue;
    }
    try {
        const initial = JSON.parse(saved);
        return initial  || defaultValue;
    } catch (e) {
        // If it's not valid JSON, return the raw string
        return saved || defaultValue;
    }
}
export const getAccessToken = () => {
    return getStorageValue('accessToken', '');
};
export const useLocalStorage = (key, defaultValue) => {
  const [value, setValue] = useState(() => {
    return getStorageValue(key, defaultValue);
  });

  useEffect(() => {
    // storing input name
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}