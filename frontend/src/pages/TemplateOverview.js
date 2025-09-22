import React, { useEffect, useState } from 'react';
import { useApp } from '../contexts/AppContext';

const TemplateOverview = () => {
  const { 
    templates, 
    fields, 
    language,
    loadTemplates, 
    loadFields,
    deleteTemplate,
    deleteField,
    loading,
    error 
  } = useApp();

  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadTemplates();
    loadFields();
  }, []);

  const getLocalizedText = (multiLangText) => {
    if (!multiLangText) return '';
    return multiLangText[language] || multiLangText.de || '';
  };

  const getFieldById = (fieldId) => {
    return fields.find(f => f.id === fieldId);
  };

  const filteredTemplates = templates.filter(template => {
    const name = getLocalizedText(template.name).toLowerCase();
    const matchesSearch = name.includes(searchTerm.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    if (filter === 'empty') return matchesSearch && (!template.fields || template.fields.length === 0);
    if (filter === 'populated') return matchesSearch && template.fields && template.fields.length > 0;
    
    return matchesSearch;
  });

  const handleDeleteTemplate = async (templateId) => {
    if (window.confirm(
      language === 'de' ? 'Sind Sie sicher, dass Sie diese Schablone löschen möchten?' :
      language === 'fr' ? 'Êtes-vous sûr de vouloir supprimer ce modèle ?' :
      'Sei sicuro di voler eliminare questo modello?'
    )) {
      try {
        await deleteTemplate(templateId);
      } catch (error) {
        console.error('Error deleting template:', error);
      }
    }
  };

  const handleDeleteField = async (fieldId) => {
    if (window.confirm(
      language === 'de' ? 'Sind Sie sicher, dass Sie dieses Feld löschen möchten?' :
      language === 'fr' ? 'Êtes-vous sûr de vouloir supprimer ce champ ?' :
      'Sei sicuro di voler eliminare questo campo?'
    )) {
      try {
        await deleteField(fieldId);
      } catch (error) {
        console.error('Error deleting field:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          {language === 'de' && 'Schablonen-Übersicht'}
          {language === 'fr' && 'Aperçu des modèles'}
          {language === 'it' && 'Panoramica modelli'}
        </h1>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder={
              language === 'de' ? 'Schablonen suchen...' :
              language === 'fr' ? 'Rechercher des modèles...' :
              'Cerca modelli...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
          />
        </div>
        <div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="form-select"
          >
            <option value="all">
              {language === 'de' ? 'Alle Schablonen' : language === 'fr' ? 'Tous les modèles' : 'Tutti i modelli'}
            </option>
            <option value="empty">
              {language === 'de' ? 'Leere Schablonen' : language === 'fr' ? 'Modèles vides' : 'Modelli vuoti'}
            </option>
            <option value="populated">
              {language === 'de' ? 'Gefüllte Schablonen' : language === 'fr' ? 'Modèles remplis' : 'Modelli popolati'}
            </option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Templates Section */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              {language === 'de' ? 'Schablonen' : language === 'fr' ? 'Modèles' : 'Modelli'} ({filteredTemplates.length})
            </h3>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="spinner" />
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTemplates.map(template => (
                  <div key={template.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {getLocalizedText(template.name)}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {getLocalizedText(template.description)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="text-red-500 hover:text-red-700 ml-2"
                        title={language === 'de' ? 'Löschen' : language === 'fr' ? 'Supprimer' : 'Elimina'}
                      >
                        🗑️
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="badge badge-blue">
                          {template.fields?.length || 0} {language === 'de' ? 'Felder' : language === 'fr' ? 'champs' : 'campi'}
                        </span>
                        <span className="text-xs text-gray-500">
                          ID: {template.id.slice(0, 8)}...
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {language === 'de' ? 'Erstellt:' : language === 'fr' ? 'Créé:' : 'Creato:'} {' '}
                        {new Date(template.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    
                    {template.fields && template.fields.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="text-xs text-gray-600 mb-2">
                          {language === 'de' ? 'Felder:' : language === 'fr' ? 'Champs:' : 'Campi:'}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {template.fields.map(fieldId => {
                            const field = getFieldById(fieldId);
                            return field ? (
                              <span key={fieldId} className={`badge badge-sm ${
                                field.type === 'text' ? 'badge-blue' :
                                field.type === 'select' ? 'badge-green' : 'badge-yellow'
                              }`}>
                                {getLocalizedText(field.name)}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {filteredTemplates.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    {language === 'de' ? 'Keine Schablonen gefunden' : 
                     language === 'fr' ? 'Aucun modèle trouvé' : 
                     'Nessun modello trovato'}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Fields Section */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              {language === 'de' ? 'Alle Felder' : language === 'fr' ? 'Tous les champs' : 'Tutti i campi'} ({fields.length})
            </h3>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="spinner" />
              </div>
            ) : (
              <div className="space-y-3">
                {fields.map(field => (
                  <div key={field.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900">
                          {getLocalizedText(field.name)}
                        </h5>
                      </div>
                      <button
                        onClick={() => handleDeleteField(field.id)}
                        className="text-red-500 hover:text-red-700 ml-2"
                        title={language === 'de' ? 'Löschen' : language === 'fr' ? 'Supprimer' : 'Elimina'}
                      >
                        🗑️
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`badge ${
                          field.type === 'text' ? 'badge-blue' :
                          field.type === 'select' ? 'badge-green' : 'badge-yellow'
                        }`}>
                          {field.type}
                        </span>
                        <span className={`badge ${field.requirement === 'required' ? 'badge-red' : 'badge-gray'}`}>
                          {field.requirement}
                        </span>
                        <span className={`badge ${field.visibility === 'visible' ? 'badge-gray' : 'badge-blue'}`}>
                          {field.visibility}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        ID: {field.id.slice(0, 8)}...
                      </div>
                    </div>
                    
                    {/* Field specific info */}
                    {field.type === 'select' && field.options && (
                      <div className="mt-2 text-xs text-gray-600">
                        {field.options.length} {language === 'de' ? 'Optionen' : language === 'fr' ? 'options' : 'opzioni'}
                      </div>
                    )}
                    
                    {field.type === 'document' && (
                      <div className="mt-2 text-xs text-gray-600">
                        {language === 'de' ? 'Modus:' : language === 'fr' ? 'Mode:' : 'Modalità:'} {field.document_mode || 'download'}
                      </div>
                    )}
                  </div>
                ))}
                
                {fields.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    {language === 'de' ? 'Keine Felder gefunden' : 
                     language === 'fr' ? 'Aucun champ trouvé' : 
                     'Nessun campo trovato'}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-blue-600">{templates.length}</div>
            <div className="text-sm text-gray-600">
              {language === 'de' ? 'Schablonen' : language === 'fr' ? 'Modèles' : 'Modelli'}
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-green-600">{fields.length}</div>
            <div className="text-sm text-gray-600">
              {language === 'de' ? 'Felder' : language === 'fr' ? 'Champs' : 'Campi'}
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {fields.filter(f => f.type === 'text').length}
            </div>
            <div className="text-sm text-gray-600">
              {language === 'de' ? 'Textfelder' : language === 'fr' ? 'Champs texte' : 'Campi testo'}
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-purple-600">
              {fields.filter(f => f.requirement === 'required').length}
            </div>
            <div className="text-sm text-gray-600">
              {language === 'de' ? 'Pflichtfelder' : language === 'fr' ? 'Champs obligatoires' : 'Campi obbligatori'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateOverview;