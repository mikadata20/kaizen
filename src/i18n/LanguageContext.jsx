import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from './translations';

const LanguageContext = createContext();

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within LanguageProvider');
    }
    return context;
};

export const LanguageProvider = ({ children }) => {
    const [currentLanguage, setCurrentLanguage] = useState(() => {
        // Load saved language from localStorage or default to 'id'
        return localStorage.getItem('appLanguage') || 'id';
    });

    useEffect(() => {
        // Save language preference to localStorage
        localStorage.setItem('appLanguage', currentLanguage);
    }, [currentLanguage]);

    const t = (key) => {
        const keys = key.split('.');
        let value = translations[currentLanguage];

        for (const k of keys) {
            value = value?.[k];
            if (value === undefined) {
                console.warn(`Translation missing for key: ${key} in language: ${currentLanguage}`);
                // Fallback to Indonesian if translation not found
                value = translations.id;
                for (const k of keys) {
                    value = value?.[k];
                }
                return value || key;
            }
        }

        return value || key;
    };

    const changeLanguage = (langCode) => {
        if (translations[langCode]) {
            setCurrentLanguage(langCode);
        } else {
            console.error(`Language ${langCode} not supported`);
        }
    };

    const value = {
        currentLanguage,
        changeLanguage,
        t
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};
