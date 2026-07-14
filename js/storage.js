/**
 * Umnik Storage Wrapper
 * Provides safe access to localStorage with clean fallback to memory storage
 * to avoid crashes in restricted environments (e.g., iframe, file://, disabled cookies).
 */

const UmnikStorage = (() => {
  // Memory fallback storage
  const memoryStore = {};

  const isLocalStorageAvailable = () => {
    try {
      const testKey = '__umnik_test__';
      localStorage.setItem(testKey, '1');
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  };

  const useLocal = isLocalStorageAvailable();

  return {
    getItem: (key) => {
      try {
        if (useLocal) {
          return localStorage.getItem(key);
        }
      } catch (e) {
        console.warn('localStorage.getItem failed, using memory fallback:', e);
      }
      return memoryStore[key] || null;
    },

    setItem: (key, value) => {
      try {
        if (useLocal) {
          localStorage.setItem(key, value);
          return;
        }
      } catch (e) {
        console.warn('localStorage.setItem failed, using memory fallback:', e);
      }
      memoryStore[key] = String(value);
    },

    removeItem: (key) => {
      try {
        if (useLocal) {
          localStorage.removeItem(key);
          return;
        }
      } catch (e) {
        console.warn('localStorage.removeItem failed, using memory fallback:', e);
      }
      delete memoryStore[key];
    },

    clear: () => {
      try {
        if (useLocal) {
          localStorage.clear();
          return;
        }
      } catch (e) {
        console.warn('localStorage.clear failed, using memory fallback:', e);
      }
      for (const key in memoryStore) {
        delete memoryStore[key];
      }
    }
  };
})();

// Assign to window for global access
window.UmnikStorage = UmnikStorage;
