import React from 'react';
import { useApp } from '../contexts/AppContext';

const MultiLanguageInput = ({ 
  value = { de: '', fr: '', it: '' }, 
  onChange, 
  placeholder = '', 
  label = '',
  required = false,
  className = '',
  type = 'input' // 'input' or 'textarea'
}) => {
  const { language } = useApp();
  
  const languages = [
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' }
  ];

  const handleChange = (langCode, newValue) => {
    onChange({
      ...value,
      [langCode]: newValue
    });
  };

  const getPlaceholder = (langCode) => {
    if (typeof placeholder === 'object') {
      return placeholder[langCode] || '';
    }
    return placeholder;
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div className="space-y-2">
        {languages.map((lang) => (
          <div key={lang.code} className="relative">
            <div className="flex items-center mb-1">
              <span className="text-sm font-medium text-gray-600 mr-2">
                {lang.flag} {lang.name}
              </span>
              {lang.code === language && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                  Aktuelle Sprache
                </span>
              )}
            </div>
            
            {type === 'textarea' ? (
              <textarea
                value={value[lang.code] || ''}
                onChange={(e) => handleChange(lang.code, e.target.value)}
                placeholder={getPlaceholder(lang.code)}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  lang.code === language ? 'ring-2 ring-blue-200' : ''
                }`}
                rows={3}
              />
            ) : (
              <input
                type="text"
                value={value[lang.code] || ''}
                onChange={(e) => handleChange(lang.code, e.target.value)}
                placeholder={getPlaceholder(lang.code)}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  lang.code === language ? 'ring-2 ring-blue-200' : ''
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MultiLanguageInput;