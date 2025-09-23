import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';

const Layout = ({ children }) => {
  const location = useLocation();
  const { language, setLanguage, userRole, setUserRole } = useApp();

  const navigation = [
    { name: 'Schablonen-Builder', name_fr: 'Générateur de modèles', name_it: 'Generatore di modelli', path: '/builder', icon: '🛠️' },
    { name: 'Erweitert Builder', name_fr: 'Constructeur avancé', name_it: 'Costruttore avanzato', path: '/enhanced-builder', icon: '⚡' },
    { name: 'Übersicht', name_fr: 'Aperçu', name_it: 'Panoramica', path: '/overview', icon: '📋' },
    { name: 'Simulator', name_fr: 'Simulateur', name_it: 'Simulatore', path: '/simulator', icon: '🎮' },
    { name: 'Änderungsprotokoll', name_fr: 'Journal des modifications', name_it: 'Registro delle modifiche', path: '/changelog', icon: '📜' }
  ];

  const languages = [
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' }
  ];

  const roles = [
    { code: 'admin', name: 'Administrator', name_fr: 'Administrateur', name_it: 'Amministratore' },
    { code: 'anmelder', name: 'Anmelder', name_fr: 'Déclarant', name_it: 'Dichiarante' },
    { code: 'klient', name: 'Klient', name_fr: 'Client', name_it: 'Cliente' }
  ];

  const getLocalizedText = (item, suffix = '') => {
    const key = `name${suffix === 'fr' ? '_fr' : suffix === 'it' ? '_it' : ''}`;
    return item[key] || item.name;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Title */}
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                {language === 'de' && 'Vorprozess Regelwerk'}
                {language === 'fr' && 'Système de règles de préprocessus'}
                {language === 'it' && 'Sistema di regole di preprocess'}
              </h1>
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-4">
              {/* Language Selector */}
              <select 
                value={language} 
                onChange={(e) => setLanguage(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>

              {/* Role Selector (for testing) */}
              <select 
                value={userRole} 
                onChange={(e) => setUserRole(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {roles.map(role => (
                  <option key={role.code} value={role.code}>
                    {getLocalizedText(role, language === 'fr' ? '_fr' : language === 'it' ? '_it' : '')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-white shadow-sm min-h-screen">
          <div className="p-4">
            <ul className="space-y-2">
              {navigation.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className="mr-3">{item.icon}</span>
                      {getLocalizedText(item, language === 'fr' ? '_fr' : language === 'it' ? '_it' : '')}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;