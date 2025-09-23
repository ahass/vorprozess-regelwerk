import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const DependencySimulator = ({ template, fields, onFieldChange }) => {
  const { language } = useApp();
  const [fieldValues, setFieldValues] = useState({});
  const [visibleFields, setVisibleFields] = useState(fields || []);
  const [isProcessing, setIsProcessing] = useState(false);

  const getLocalizedText = (multiLangText) => {
    if (!multiLangText) return '';
    return multiLangText[language] || multiLangText.de || '';
  };

  // Process dependencies when field values change
  useEffect(() => {
    if (template && fields && Object.keys(fieldValues).length > 0) {
      processFieldDependencies();
    }
  }, [fieldValues, template, fields]);

  const processFieldDependencies = () => {
    if (!template || !fields) return;

    const newVisibleFields = [];

    fields.forEach(field => {
      let shouldShow = true;

      // Check dependencies
      if (field.dependencies && field.dependencies.length > 0) {
        shouldShow = field.dependencies.every(dep => 
          evaluateDependency(dep, fieldValues)
        );
      }

      if (shouldShow) {
        newVisibleFields.push(field);
      }
    });

    setVisibleFields(newVisibleFields);
  };

  const evaluateDependency = (dependency, values) => {
    const { field_id, operator, condition_value } = dependency;
    const currentValue = values[field_id];

    switch (operator) {
      case 'equals':
        return currentValue === condition_value;
      case 'not_equals':
        return currentValue !== condition_value;
      case 'in':
        if (Array.isArray(condition_value)) {
          return condition_value.includes(currentValue);
        }
        return false;
      case 'not_in':
        if (Array.isArray(condition_value)) {
          return !condition_value.includes(currentValue);
        }
        return true;
      case 'contains':
        return String(currentValue).toLowerCase().includes(String(condition_value).toLowerCase());
      case 'is_empty':
        return !currentValue || currentValue === '';
      case 'is_not_empty':
        return currentValue && currentValue !== '';
      case 'greater_than':
        return parseFloat(currentValue) > parseFloat(condition_value);
      case 'less_than':
        return parseFloat(currentValue) < parseFloat(condition_value);
      default:
        return true;
    }
  };

  const handleFieldValueChange = (fieldId, value) => {
    const newFieldValues = {
      ...fieldValues,
      [fieldId]: value
    };
    setFieldValues(newFieldValues);
    onFieldChange?.(fieldId, value, newFieldValues);
  };

  const renderField = (field) => {
    const fieldName = getLocalizedText(field.name);
    const fieldValue = fieldValues[field.id] || '';
    const isRequired = field.requirement === 'required';
    const isEditable = field.visibility === 'editable';

    switch (field.type) {
      case 'text':
        return (
          <div key={field.id} className="field-preview text">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {fieldName}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            {isEditable ? (
              <input
                type="text"
                value={fieldValue}
                onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
                className="form-input"
                placeholder={`${fieldName} eingeben...`}
                disabled={!isEditable}
              />
            ) : (
              <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-600">
                {fieldValue || (language === 'de' ? 'Nur sichtbar' : language === 'fr' ? 'Visible seulement' : 'Solo visibile')}
              </div>
            )}
            {field.validation && (
              <div className="text-xs text-gray-500 mt-1">
                {field.validation.string?.min_length && `Min: ${field.validation.string.min_length} Zeichen`}
                {field.validation.string?.max_length && ` Max: ${field.validation.string.max_length} Zeichen`}
              </div>
            )}
          </div>
        );

      case 'select':
        return (
          <div key={field.id} className="field-preview select">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {fieldName}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            {isEditable ? (
              <div className="space-y-2">
                {field.options?.map((option, index) => (
                  <label key={index} className="flex items-center">
                    <input 
                      type={field.select_type === 'multiple' ? 'checkbox' : 'radio'}
                      name={field.id}
                      value={option.value}
                      checked={
                        field.select_type === 'multiple' 
                          ? (fieldValue || []).includes(option.value)
                          : fieldValue === option.value
                      }
                      onChange={(e) => {
                        if (field.select_type === 'multiple') {
                          const currentValues = fieldValue || [];
                          const newValues = e.target.checked
                            ? [...currentValues, option.value]
                            : currentValues.filter(v => v !== option.value);
                          handleFieldValueChange(field.id, newValues);
                        } else {
                          handleFieldValueChange(field.id, option.value);
                        }
                      }}
                      className="mr-2"
                      disabled={!isEditable}
                    />
                    <span className="text-sm">{getLocalizedText(option.label)}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-600">
                {language === 'de' ? 'Nur sichtbar' : language === 'fr' ? 'Visible seulement' : 'Solo visibile'}
              </div>
            )}
          </div>
        );

      case 'document':
        return (
          <div key={field.id} className="field-preview document">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {fieldName}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              {field.document_mode === 'download' ? (
                <div>
                  <div className="text-gray-600 mb-2">📄</div>
                  <button className="btn-primary btn-sm">
                    {language === 'de' ? 'Herunterladen' : language === 'fr' ? 'Télécharger' : 'Scarica'}
                  </button>
                </div>
              ) : (
                <div>
                  <div className="text-gray-600 mb-2">📁</div>
                  <p className="text-sm text-gray-500 mb-2">
                    {language === 'de' ? 'Datei hier ablegen oder' : 
                     language === 'fr' ? 'Déposer le fichier ici ou' : 
                     'Trascina il file qui o'}
                  </p>
                  <input 
                    type="file"
                    onChange={(e) => handleFieldValueChange(field.id, e.target.files[0])}
                    className="hidden"
                    id={`file-${field.id}`}
                    disabled={!isEditable}
                  />
                  <label htmlFor={`file-${field.id}`} className="btn-secondary btn-sm cursor-pointer">
                    {language === 'de' ? 'Datei wählen' : language === 'fr' ? 'Choisir un fichier' : 'Scegli file'}
                  </label>
                  {fieldValue && (
                    <div className="mt-2 text-sm text-gray-600">
                      {fieldValue.name || fieldValue}
                    </div>
                  )}
                </div>
              )}
              {field.document_constraints && (
                <div className="text-xs text-gray-500 mt-2">
                  {field.document_constraints.max_size_mb && `Max: ${field.document_constraints.max_size_mb}MB`}
                  {field.document_constraints.allowed_formats && ` Formate: ${field.document_constraints.allowed_formats.join(', ')}`}
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getDependencyInfo = (field) => {
    if (!field.dependencies || field.dependencies.length === 0) return null;

    return (
      <div className="text-xs text-blue-600 mt-1">
        📎 {language === 'de' ? 'Abhängig von:' : language === 'fr' ? 'Dépend de:' : 'Dipende da:'} {' '}
        {field.dependencies.map((dep, i) => (
          <span key={i}>
            {dep.field_id} {dep.operator} "{dep.condition_value}"
            {i < field.dependencies.length - 1 && ', '}
          </span>
        ))}
      </div>
    );
  };

  const getHiddenFieldsInfo = () => {
    const hiddenFields = fields?.filter(field => 
      !visibleFields.some(vf => vf.id === field.id)
    ) || [];

    if (hiddenFields.length === 0) return null;

    return (
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h4 className="font-medium text-yellow-800 mb-2">
          {language === 'de' ? 'Ausgeblendete Felder' : language === 'fr' ? 'Champs masqués' : 'Campi nascosti'} ({hiddenFields.length})
        </h4>
        <div className="space-y-1">
          {hiddenFields.map(field => (
            <div key={field.id} className="text-sm text-yellow-700">
              • {getLocalizedText(field.name)}
              {getDependencyInfo(field)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!template || !fields) {
    return (
      <div className="text-center py-8 text-gray-500">
        {language === 'de' ? 'Keine Schablone ausgewählt' : 
         language === 'fr' ? 'Aucun modèle sélectionné' : 
         'Nessun modello selezionato'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Template Info */}
      <div className="border-b pb-4">
        <h3 className="font-semibold text-lg">{getLocalizedText(template.name)}</h3>
        {template.description && (
          <p className="text-gray-600 text-sm mt-1">{getLocalizedText(template.description)}</p>
        )}
        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
          <span>
            {language === 'de' ? 'Sichtbare Felder:' : language === 'fr' ? 'Champs visibles:' : 'Campi visibili:'} {' '}
            <strong>{visibleFields.length}</strong> / {fields.length}
          </span>
          {isProcessing && (
            <span className="flex items-center">
              <div className="spinner spinner-sm mr-1" />
              {language === 'de' ? 'Verarbeite...' : language === 'fr' ? 'Traitement...' : 'Elaborazione...'}
            </span>
          )}
        </div>
      </div>

      {/* Field Values Display (for debugging) */}
      {Object.keys(fieldValues).length > 0 && (
        <details className="border border-gray-200 rounded p-3">
          <summary className="cursor-pointer font-medium text-sm text-gray-700">
            {language === 'de' ? 'Aktuelle Feldwerte' : language === 'fr' ? 'Valeurs des champs actuelles' : 'Valori dei campi attuali'} ({Object.keys(fieldValues).length})
          </summary>
          <div className="mt-2 space-y-1 text-xs">
            {Object.entries(fieldValues).map(([fieldId, value]) => (
              <div key={fieldId} className="flex justify-between">
                <span className="text-gray-600">{fieldId}:</span>
                <span className="font-mono text-gray-800">
                  {Array.isArray(value) ? JSON.stringify(value) : String(value)}
                </span>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Visible Fields */}
      <div className="space-y-4">
        {visibleFields.map(field => (
          <div key={field.id}>
            {renderField(field)}
            {getDependencyInfo(field)}
          </div>
        ))}
        
        {visibleFields.length === 0 && (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
            {language === 'de' ? 'Keine Felder sichtbar bei aktueller Konfiguration' : 
             language === 'fr' ? 'Aucun champ visible avec la configuration actuelle' : 
             'Nessun campo visibile con la configurazione attuale'}
          </div>
        )}
      </div>

      {/* Hidden Fields Info */}
      {getHiddenFieldsInfo()}

      {/* Simulation Controls */}
      <div className="border-t pt-4">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {language === 'de' ? 'Ändern Sie Feldwerte um Dependencies zu testen' : 
             language === 'fr' ? 'Modifiez les valeurs des champs pour tester les dépendances' : 
             'Modifica i valori dei campi per testare le dipendenze'}
          </div>
          <button
            onClick={() => {
              setFieldValues({});
              setVisibleFields(fields || []);
            }}
            className="btn-secondary btn-sm"
          >
            {language === 'de' ? 'Zurücksetzen' : language === 'fr' ? 'Réinitialiser' : 'Reimposta'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DependencySimulator;