import { useState, useEffect } from 'react';

const useLocalStorage = (key, initialValue = []) => {
    const [storedValue, setStoredValue] = useState(initialValue);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from localStorage on mount (client-side only)
    useEffect(() => {
        try {
            if (typeof window !== 'undefined') {
                const item = window.localStorage.getItem(key);
                if (item) {
                    setStoredValue(JSON.parse(item));
                } else {
                    // Initialize localStorage with the default value if it doesn't exist
                    setStoredValue(initialValue);
                    window.localStorage.setItem(key, JSON.stringify(initialValue));
                }
            }
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            setStoredValue(initialValue);
        }
        setIsLoaded(true);
    }, [key, initialValue]);

    const setValue = (value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(key, JSON.stringify(valueToStore));
            }
        } catch (error) {
            console.error('Error writing to localStorage:', error);
        }
    };

    const addItem = (item) => {
        setValue([...storedValue, item]);
    };

    const removeItem = (index) => {
        setValue(storedValue.filter((_, i) => i !== index));
    };

    const clearAll = () => {
        setValue([]);
    };

    return { storedValue, setValue, addItem, removeItem, clearAll, isLoaded };
};

export default useLocalStorage;
