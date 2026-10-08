// Saves app data in the browser so it is still there later.
import { useState, useEffect } from 'react';

// Loads a saved value and saves it again whenever it changes.
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Keep the app running if the browser cannot save data.
    }
  }, [key, value]);

  return [value, setValue];
}

// Keeps a member signed in until this browser tab is closed.
export function useSessionStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.sessionStorage.getItem(key);
      return stored ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      if (value === null || value === undefined) {
        window.sessionStorage.removeItem(key);
      } else {
        window.sessionStorage.setItem(key, JSON.stringify(value));
      }
    } catch {
      // Keep the app running if the browser cannot save data.
    }
  }, [key, value]);

  return [value, setValue];
}
