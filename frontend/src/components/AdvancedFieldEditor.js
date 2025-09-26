import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import MultiLanguageInput from './MultiLanguageInput';

const AdvancedFieldEditor = ({ field, onSave, onCancel, availableFields = [] }) => {
  const { language, createField, updateField } = useApp();
  
  const [fieldData, setFieldData] = useState({
    name: { de: '', fr: '', it: '' },
    type: 'text',
    validation: {},
    select_type: 'radio',
    options: [],
    document_mode: 'download',
    document_constraints: {},
    dependencies: [],
    role_config: {
      admin: { visible: true, editable: true, required: false },
      klient: { visible: true, editable: true, required: false },
      anmelder: { visible: true, editable: true, required: false }
    },
    customer_specific: false,
    visible_for_customers: [],
    ...field
  });

  const [validationTab, setValidationTab] = useState('basic');
  const [newOption, setNewOption] = useState({ 
    label: { de: '', fr: '', it: '' }, 
    value: '' 
  });
  const [newDependency, setNewDependency] = useState({
    field_id: '',
    operator: 'equals',
    condition_value: ''
  });

  const operators = [
    { value: 'equals', label: 'Gleich', label_fr: 'Égal', label_it: 'Uguale' },
    { value: 'not_equals', label: 'Nicht gleich', label_fr: 'Pas égal', label_it: 'Non uguale' },
    { value: 'in', label: 'In Liste', label_fr: 'Dans la liste', label_it: 'Nella lista' },
    { value: 'not_in', label: 'Nicht in Liste', label_fr: 'Pas dans la liste', label_it: 'Non nella lista' },
    { value: 'contains', label: 'Enthält', label_fr: 'Contient', label_it: 'Contiene' },
    { value: 'is_empty', label: 'Ist leer', label_fr: 'Est vide', label_it: 'È vuoto' },
    { value: 'is_not_empty', label: 'Ist nicht leer', label_fr: 'N\'est pas vide', label_it: 'Non è vuoto' }
  ];

  const roles = [
    { code: 'anmelder', name: 'Anmelder', name_fr: 'Déclarant', name_it: 'Dichiarante' },
    { code: 'klient', name: 'Klient', name_fr: 'Client', name_it: 'Cliente' },
    { code: 'admin', name: 'Administrator', name_fr: 'Administrateur', name_it: 'Amministratore' }
  ];

  const getLocalizedText = (item, suffix = '') => {
    const key = `label${suffix === 'fr' ? '_fr' : suffix === 'it' ? '_it' : ''}`;
    return item[key] || item.label || item.name;
  };

  const handleSave = async () => {
    try {
      if (field?.id) {
        await updateField(field.id, fieldData);
      } else {
        await createField(fieldData);
      }
      onSave?.(fieldData);
    } catch (error) {
      console.error('Error saving field:', error);
    }
  };

  const addOption = () => {
    if (newOption.label.de || newOption.label.fr || newOption.label.it) {
      const option = {
        id: Date.now().toString(),
        label: newOption.label,
        value: newOption.value || newOption.label.de
      };
      setFieldData({
        ...fieldData,
        options: [...(fieldData.options || []), option]
      });
      setNewOption({ label: { de: '', fr: '', it: '' }, value: '' });
    }
  };

  const removeOption = (index) => {
    const newOptions = fieldData.options.filter((_, i) => i !== index);
    setFieldData({ ...fieldData, options: newOptions });
  };

  const addDependency = () => {
    if (newDependency.field_id) {
      setFieldData({
        ...fieldData,
        dependencies: [...(fieldData.dependencies || []), { ...newDependency }]
      });
      setNewDependency({ field_id: '', operator: 'equals', condition_value: '' });
    }
  };

  const removeDependency = (index) => {
    const newDependencies = fieldData.dependencies.filter((_, i) => i !== index);
    setFieldData({ ...fieldData, dependencies: newDependencies });
  };

  const updateRoleConfig = (roleCode, property, value) => {
    const newRoleConfig = {
      ...fieldData.role_config,
      [roleCode]: {
        ...(fieldData.role_config[roleCode] || {}),
        [property]: value
      }
    };
    setFieldData({ ...fieldData, role_config: newRoleConfig });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content max-w-4xl">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-6">
            {field?.id ? 
              (language === 'de' ? 'Feld bearbeiten' : language === 'fr' ? 'Modifier le champ' : 'Modifica campo') :
              (language === 'de' ? 'Neues Feld erstellen' : language === 'fr' ? 'Créer un nouveau champ' : 'Crea nuovo campo')
            }
          </h3>

          {/* Tabs */}
          <div className="tab-list mb-6">
            <button
              className={`tab-button ${validationTab === 'basic' ? 'active' : ''}`}
              onClick={() => setValidationTab('basic')}
            >
              {language === 'de' ? 'Grundlagen' : language === 'fr' ? 'De base' : 'Base'}
            </button>
            <button
              className={`tab-button ${validationTab === 'validation' ? 'active' : ''}`}
              onClick={() => setValidationTab('validation')}
            >
              {language === 'de' ? 'Validierung' : language === 'fr' ? 'Validation' : 'Validazione'}
            </button>
            <button
              className={`tab-button ${validationTab === 'dependencies' ? 'active' : ''}`}
              onClick={() => setValidationTab('dependencies')}
            >
              {language === 'de' ? 'Abhängigkeiten' : language === 'fr' ? 'Dépendances' : 'Dipendenze'}
            </button>
            <button
              className={`tab-button ${validationTab === 'roles' ? 'active' : ''}`}
              onClick={() => setValidationTab('roles')}
            >
              {language === 'de' ? 'Rollen' : language === 'fr' ? 'Rôles' : 'Ruoli'}
            </button>
          </div>

          {/* Basic Tab */}
          {validationTab === 'basic' && (
            <div className="space-y-4">
              <MultiLanguageInput
                label={language === 'de' ? 'Feldname' : language === 'fr' ? 'Nom du champ' : 'Nome campo'}
                value={fieldData.name}
                onChange={(value) => setFieldData({...fieldData, name: value})}
                required
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="form-label">
                    {language === 'de' ? 'Feldtyp' : language === 'fr' ? 'Type de champ' : 'Tipo campo'}
                  </label>
                  <select
                    value={fieldData.type}
                    onChange={(e) => setFieldData({...fieldData, type: e.target.value})}
                    className="form-select"
                  >
                    <option value="text">Text</option>
                    <option value="select">Auswahl</option>
                    <option value="document">Dokument</option>
                  </select>
                {/* Role-based settings */}
                <div className="md:col-span-2">
                  <label className="form-label">
                    {language === 'de' ? 'Rollenbasierte Einstellungen' : language === 'fr' ? 'Paramètres par rôle' : 'Impostazioni per ruolo'}
                  </label>
                  <div className="overflow-auto border rounded">
                    <div className="grid grid-cols-4 items-center text-sm font-medium bg-gray-50 border-b">
                      <div className="p-2"></div>
                      <div className="p-2">{language === 'de' ? 'Sichtbar' : language === 'fr' ? 'Visible' : 'Visibile'}</div>
                      <div className="p-2">{language === 'de' ? 'Bearbeitbar' : language === 'fr' ? 'Modifiable' : 'Modificabile'}</div>
                      <div className="p-2">{language === 'de' ? 'Pflichtfeld' : language === 'fr' ? 'Obligatoire' : 'Obbligatorio'}</div>
                    </div>
                    {['klient','anmelder','admin'].map(role => (
                      <div key={role} className="grid grid-cols-4 items-center border-b last:border-b-0">
                        <div className="p-2 capitalize">{role}</div>
                        <div className="p-2">
                          <input type="checkbox" checked={!!fieldData.role_config?.[role]?.visible} onChange={(e)=> updateRoleConfig(role, 'visible', e.target.checked)} />
                        </div>
                        <div className="p-2">
                          <input type="checkbox" checked={!!fieldData.role_config?.[role]?.editable} onChange={(e)=> updateRoleConfig(role, 'editable', e.target.checked)} />
                        </div>
                        <div className="p-2">
                          <input type="checkbox" checked={!!fieldData.role_config?.[role]?.required} onChange={(e)=> updateRoleConfig(role, 'required', e.target.checked)} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                </div>
                
{/* Role-based settings */}
              </div>

              {/* Select Field Options */}
              {fieldData.type === 'select' && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium mb-3">
                    {language === 'de' ? 'Auswahloptionen' : language === 'fr' ? 'Options de sélection' : 'Opzioni di selezione'}
                  </h4>
                  
                  <div className="mb-4">
                    <label className="form-label">
                      {language === 'de' ? 'Auswahltyp' : language === 'fr' ? 'Type de sélection' : 'Tipo selezione'}
                    </label>
                    <select
                      value={fieldData.select_type}
                      onChange={(e) => setFieldData({...fieldData, select_type: e.target.value})}
                      className="form-select"
                    >
                      <option value="radio">Radio Button (Einfachauswahl)</option>
                      <option value="multiple">Checkbox (Mehrfachauswahl)</option>
                    </select>
                  </div>

                  {/* Current Options */}
                  <div className="space-y-2 mb-4">
                    {fieldData.options?.map((option, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border border-gray-200 rounded">
                        <div>
                          <span className="font-medium">{option.label?.de || option.label}</span>
                          <span className="text-sm text-gray-500 ml-2">({option.value})</span>
                        </div>
                        <button
                          onClick={() => removeOption(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add New Option */}
                  <div className="border-t pt-4">
                    <MultiLanguageInput
                      label={language === 'de' ? 'Neue Option' : language === 'fr' ? 'Nouvelle option' : 'Nuova opzione'}
                      value={newOption.label}
                      onChange={(value) => setNewOption({...newOption, label: value})}
                      className="mb-2"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Wert (optional)"
                        value={newOption.value}
                        onChange={(e) => setNewOption({...newOption, value: e.target.value})}
                        className="form-input flex-1"
                      />
                      <button onClick={addOption} className="btn-primary">
                        {language === 'de' ? 'Hinzufügen' : language === 'fr' ? 'Ajouter' : 'Aggiungi'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Document Field Options */}
              {fieldData.type === 'document' && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium mb-3">
                    {language === 'de' ? 'Dokument-Einstellungen' : language === 'fr' ? 'Paramètres du document' : 'Impostazioni documento'}
                  </h4>
                  
                  <div className="mb-4">
                    <label className="form-label">
                      {language === 'de' ? 'Dokument-Modus' : language === 'fr' ? 'Mode document' : 'Modalità documento'}
                    </label>
                    <select
                      value={fieldData.document_mode}
                      onChange={(e) => setFieldData({...fieldData, document_mode: e.target.value})}
                      className="form-select"
                    >
                      <option value="download">Nur Download</option>
                      <option value="download_upload">Download + Upload</option>
                      <option value="download_metadata_upload">Download mit Kopfdaten + Upload</option>
                      <option value="upload">Nur Upload</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">
                        {language === 'de' ? 'Max. Dateigröße (MB)' : language === 'fr' ? 'Taille max (MB)' : 'Dimensione max (MB)'}
                      </label>
                      <input
                        type="number"
                        value={fieldData.document_constraints?.max_size_mb || ''}
                        onChange={(e) => setFieldData({
                          ...fieldData, 
                          document_constraints: {
                            ...fieldData.document_constraints,
                            max_size_mb: parseFloat(e.target.value) || null
                          }
                        })}
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label className="form-label">
                        {language === 'de' ? 'Erlaubte Formate' : language === 'fr' ? 'Formats autorisés' : 'Formati consentiti'}
                      </label>
                      <input
                        type="text"
                        placeholder="pdf,doc,docx,jpg"
                        value={fieldData.document_constraints?.allowed_formats?.join(',') || ''}
                        onChange={(e) => setFieldData({
                          ...fieldData,
                          document_constraints: {
                            ...fieldData.document_constraints,
                            allowed_formats: e.target.value.split(',').map(f => f.trim()).filter(f => f)
                          }
                        })}
                        className="form-input"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Validation Tab */}
          {validationTab === 'validation' && (
            <div className="space-y-4">
              <h4 className="font-medium">
                {language === 'de' ? 'Validierungsregeln' : language === 'fr' ? 'Règles de validation' : 'Regole di validazione'}
              </h4>
              
              {fieldData.type === 'text' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">
                      {language === 'de' ? 'Min. Länge' : language === 'fr' ? 'Longueur min' : 'Lunghezza min'}
                    </label>
                    <input
                      type="number"
                      value={fieldData.validation?.string?.min_length || ''}
                      onChange={(e) => setFieldData({
                        ...fieldData,
                        validation: {
                          ...fieldData.validation,
                          string: {
                            ...fieldData.validation?.string,
                            min_length: parseInt(e.target.value) || null
                          }
                        }
                      })}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label">
                      {language === 'de' ? 'Max. Länge' : language === 'fr' ? 'Longueur max' : 'Lunghezza max'}
                    </label>
                    <input
                      type="number"
                      value={fieldData.validation?.string?.max_length || ''}
                      onChange={(e) => setFieldData({
                        ...fieldData,
                        validation: {
                          ...fieldData.validation,
                          string: {
                            ...fieldData.validation?.string,
                            max_length: parseInt(e.target.value) || null
                          }
                        }
                      })}
                      className="form-input"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="form-label">
                      {language === 'de' ? 'Format' : language === 'fr' ? 'Format' : 'Formato'}
                    </label>
                    <select
                      value={fieldData.validation?.string?.format || ''}
                      onChange={(e) => setFieldData({
                        ...fieldData,
                        validation: {
                          ...fieldData.validation,
                          string: {
                            ...fieldData.validation?.string,
                            format: e.target.value || null
                          }
                        }
                      })}
                      className="form-select"
                    >
                      <option value="">Kein spezielles Format</option>
                      <option value="email">E-Mail</option>
                      <option value="phone">Telefonnummer</option>
                      <option value="url">URL</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="form-label">
                      {language === 'de' ? 'Regex Pattern (erweitert)' : language === 'fr' ? 'Pattern Regex (avancé)' : 'Pattern Regex (avanzato)'}
                    </label>
                    <input
                      type="text"
                      placeholder="^[A-Za-z0-9]+$"
                      value={fieldData.validation?.string?.pattern || ''}
                      onChange={(e) => setFieldData({
                        ...fieldData,
                        validation: {
                          ...fieldData.validation,
                          string: {
                            ...fieldData.validation?.string,
                            pattern: e.target.value || null
                          }
                        }
                      })}
                      className="form-input"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Dependencies Tab */}
          {validationTab === 'dependencies' && (
            <div className="space-y-4">
              <h4 className="font-medium">
                {language === 'de' ? 'Bedingte Abhängigkeiten' : language === 'fr' ? 'Dépendances conditionnelles' : 'Dipendenze condizionali'}
              </h4>
              
              {/* Current Dependencies */}
              <div className="space-y-2">
                {fieldData.dependencies?.map((dep, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded">
                    <div className="text-sm">
                      <strong>Wenn Feld:</strong> {dep.field_id} <strong>{dep.operator}</strong> "{dep.condition_value}"
                    </div>
                    <button
                      onClick={() => removeDependency(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              {/* Add New Dependency */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h5 className="font-medium mb-3">
                  {language === 'de' ? 'Neue Abhängigkeit hinzufügen' : language === 'fr' ? 'Ajouter une nouvelle dépendance' : 'Aggiungi nuova dipendenza'}
                </h5>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="form-label">
                      {language === 'de' ? 'Abhängiges Feld' : language === 'fr' ? 'Champ dépendant' : 'Campo dipendente'}
                    </label>
                    <select
                      value={newDependency.field_id}
                      onChange={(e) => setNewDependency({...newDependency, field_id: e.target.value})}
                      className="form-select"
                    >
                      <option value="">Feld auswählen...</option>
                      {availableFields.map(field => (
                        <option key={field.id} value={field.id}>
                          {field.name?.de || field.name || field.id}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="form-label">
                      {language === 'de' ? 'Bedingung' : language === 'fr' ? 'Condition' : 'Condizione'}
                    </label>
                    <select
                      value={newDependency.operator}
                      onChange={(e) => setNewDependency({...newDependency, operator: e.target.value})}
                      className="form-select"
                    >
                      {operators.map(op => (
                        <option key={op.value} value={op.value}>
                          {getLocalizedText(op, language === 'fr' ? 'fr' : language === 'it' ? 'it' : '')}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="form-label">
                      {language === 'de' ? 'Wert' : language === 'fr' ? 'Valeur' : 'Valore'}
                    </label>
                    <input
                      type="text"
                      value={newDependency.condition_value}
                      onChange={(e) => setNewDependency({...newDependency, condition_value: e.target.value})}
                      className="form-input"
                      placeholder="Wert eingeben..."
                    />
                  </div>
                </div>
                
                <div className="mt-3">
                  <button onClick={addDependency} className="btn-primary btn-sm">
                    {language === 'de' ? 'Abhängigkeit hinzufügen' : language === 'fr' ? 'Ajouter dépendance' : 'Aggiungi dipendenza'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Roles Tab */}
          {validationTab === 'roles' && (
            <div className="space-y-4">
              <h4 className="font-medium">
                {language === 'de' ? 'Rollenbasierte Konfiguration' : language === 'fr' ? 'Configuration basée sur les rôles' : 'Configurazione basata sui ruoli'}
              </h4>
              
              {roles.map(role => (
                <div key={role.code} className="border border-gray-200 rounded-lg p-4">
                  <h5 className="font-medium mb-3">
                    {getLocalizedText(role, language === 'fr' ? '_fr' : language === 'it' ? '_it' : '')}
                  </h5>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={fieldData.role_config?.[role.code]?.visible !== false}
                          onChange={(e) => updateRoleConfig(role.code, 'visible', e.target.checked)}
                          className="mr-2"
                        />
                        {language === 'de' ? 'Sichtbar' : language === 'fr' ? 'Visible' : 'Visibile'}
                      </label>
                    </div>
                    
                    <div>
                      <label className="form-label">
                        {language === 'de' ? 'Sichtbarkeit überschreiben' : language === 'fr' ? 'Remplacer visibilité' : 'Sovrascrivi visibilità'}
                      </label>
                      <select
                        value={fieldData.role_config?.[role.code]?.visibility || ''}
                        onChange={(e) => updateRoleConfig(role.code, 'visibility', e.target.value)}
                        className="form-select"
                      >
                        <option value="">Standard verwenden</option>
                        <option value="visible">Nur sichtbar</option>
                        <option value="editable">Bearbeitbar</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="form-label">
                        {language === 'de' ? 'Erforderlichkeit überschreiben' : language === 'fr' ? 'Remplacer exigence' : 'Sovrascrivi requisito'}
                      </label>
                      <select
                        value={fieldData.role_config?.[role.code]?.requirement || ''}
                        onChange={(e) => updateRoleConfig(role.code, 'requirement', e.target.value)}
                        className="form-select"
                      >
                        <option value="">Standard verwenden</option>
                        <option value="optional">Optional</option>
                        <option value="required">Pflicht</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}

              {/* Customer-specific settings */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h5 className="font-medium mb-3">
                  {language === 'de' ? 'Kundenspezifische Einstellungen' : language === 'fr' ? 'Paramètres spécifiques au client' : 'Impostazioni specifiche del cliente'}
                </h5>
                
                <div className="mb-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={fieldData.customer_specific}
                      onChange={(e) => setFieldData({...fieldData, customer_specific: e.target.checked})}
                      className="mr-2"
                    />
                    {language === 'de' ? 'Kundenspezifisches Feld' : language === 'fr' ? 'Champ spécifique au client' : 'Campo specifico del cliente'}
                  </label>
                </div>
                
                {fieldData.customer_specific && (
                  <div>
                    <label className="form-label">
                      {language === 'de' ? 'Sichtbar für Kunden (IDs, kommagetrennt)' : 
                       language === 'fr' ? 'Visible pour les clients (IDs, séparés par des virgules)' : 
                       'Visibile per clienti (ID, separati da virgole)'}
                    </label>
                    <input
                      type="text"
                      value={fieldData.visible_for_customers?.join(',') || ''}
                      onChange={(e) => setFieldData({
                        ...fieldData,
                        visible_for_customers: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                      })}
                      className="form-input"
                      placeholder="customer_1,customer_2,customer_3"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary"
            >
              {language === 'de' ? 'Abbrechen' : language === 'fr' ? 'Annuler' : 'Annulla'}
            </button>
            <button 
              onClick={handleSave} 
              className="btn-primary"
            >
              {language === 'de' ? 'Speichern' : language === 'fr' ? 'Enregistrer' : 'Salva'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedFieldEditor;