import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import AdvancedFieldEditor from '../components/AdvancedFieldEditor';
import DependencySimulator from '../components/DependencySimulator';

const EnhancedTemplateBuilder = () => {
  const { 
    templates, 
    fields, 
    currentTemplate, 
    language,
    loadTemplates, 
    loadFields,
    createTemplate, 
    updateTemplate,
    setCurrentTemplate,
    loading,
    error 
  } = useApp();

  const [showNewTemplateForm, setShowNewTemplateForm] = useState(false);
  const [showAdvancedFieldEditor, setShowAdvancedFieldEditor] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [editingField, setEditingField] = useState(null);
  const [activeTab, setActiveTab] = useState('builder');
  
  // New template form state
  const [newTemplate, setNewTemplate] = useState({
    name: { de: '', fr: '', it: '' },
    description: { de: '', fr: '', it: '' }
  });

  // Simulation state
  const [simulationFieldValues, setSimulationFieldValues] = useState({});

  useEffect(() => {
    loadTemplates();
    loadFields();
  }, []);

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    try {
      const created = await createTemplate(newTemplate);
      setNewTemplate({ name: { de: '', fr: '', it: '' }, description: { de: '', fr: '', it: '' } });
      setShowNewTemplateForm(false);
      setSelectedTemplateId(created.id);
      setCurrentTemplate(created);
    } catch (error) {
      console.error('Error creating template:', error);
    }
  };

  const handleFieldSave = (fieldData) => {
    setShowAdvancedFieldEditor(false);
    setEditingField(null);
    loadFields(); // Refresh fields list
  };

  const handleFieldCancel = () => {
    setShowAdvancedFieldEditor(false);
    setEditingField(null);
  };

  const handleAddFieldToTemplate = async (fieldId) => {
    if (!currentTemplate) return;
    
    const updatedFields = [...(currentTemplate.fields || []), fieldId];
    try {
      await updateTemplate(currentTemplate.id, { fields: updatedFields });
      // Reload template to reflect changes
      const updatedTemplate = { ...currentTemplate, fields: updatedFields };
      setCurrentTemplate(updatedTemplate);
    } catch (error) {
      console.error('Error adding field to template:', error);
    }
  };

  const handleRemoveFieldFromTemplate = async (fieldId) => {
    if (!currentTemplate) return;
    
    const updatedFields = currentTemplate.fields.filter(id => id !== fieldId);
    try {
      await updateTemplate(currentTemplate.id, { fields: updatedFields });
      const updatedTemplate = { ...currentTemplate, fields: updatedFields };
      setCurrentTemplate(updatedTemplate);
    } catch (error) {
      console.error('Error removing field from template:', error);
    }
  };

  const handleEditField = (field) => {
    setEditingField(field);
    setShowAdvancedFieldEditor(true);
  };

  const getLocalizedText = (multiLangText) => {
    if (!multiLangText) return '';
    return multiLangText[language] || multiLangText.de || '';
  };

  const getFieldById = (fieldId) => {
    return fields.find(f => f.id === fieldId);
  };

  const getTemplateFields = () => {
    if (!currentTemplate?.fields) return [];
    return currentTemplate.fields.map(fieldId => getFieldById(fieldId)).filter(Boolean);
  };

  const availableFields = fields.filter(field => 
    !currentTemplate?.fields?.includes(field.id)
  );

  const templateFields = getTemplateFields();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          {language === 'de' && 'Erweiterter Schablonen-Builder'}
          {language === 'fr' && 'Générateur de modèles avancé'}
          {language === 'it' && 'Generatore di modelli avanzato'}
        </h1>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowNewTemplateForm(true)}
            className="btn-primary"
          >
            + {language === 'de' ? 'Neue Schablone' : language === 'fr' ? 'Nouveau modèle' : 'Nuovo modello'}
          </button>
          <button
            onClick={() => {
              setEditingField(null);
              setShowAdvancedFieldEditor(true);
            }}
            className="btn-secondary"
          >
            + {language === 'de' ? 'Neues Feld' : language === 'fr' ? 'Nouveau champ' : 'Nuovo campo'}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="tab-list">
        <button
          className={`tab-button ${activeTab === 'builder' ? 'active' : ''}`}
          onClick={() => setActiveTab('builder')}
        >
          🛠️ {language === 'de' ? 'Builder' : language === 'fr' ? 'Constructeur' : 'Costruttore'}
        </button>
        <button
          className={`tab-button ${activeTab === 'simulator' ? 'active' : ''}`}
          onClick={() => setActiveTab('simulator')}
          disabled={!currentTemplate}
        >
          🧪 {language === 'de' ? 'Simulator' : language === 'fr' ? 'Simulateur' : 'Simulatore'}
        </button>
        <button
          className={`tab-button ${activeTab === 'dependencies' ? 'active' : ''}`}
          onClick={() => setActiveTab('dependencies')}
          disabled={!currentTemplate}
        >
          📎 {language === 'de' ? 'Abhängigkeiten' : language === 'fr' ? 'Dépendances' : 'Dipendenze'}
        </button>
      </div>

      {/* Builder Tab */}
      {activeTab === 'builder' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Template Selection */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                {language === 'de' ? 'Schablonen' : language === 'fr' ? 'Modèles' : 'Modelli'}
              </h3>
            </div>
            <div className="card-body">
              <div className="space-y-2">
                {templates.map(template => (
                  <div
                    key={template.id}
                    onClick={() => {
                      setSelectedTemplateId(template.id);
                      setCurrentTemplate(template);
                    }}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedTemplateId === template.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-gray-900">
                      {getLocalizedText(template.name)}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center justify-between">
                      <span>{template.fields?.length || 0} {language === 'de' ? 'Felder' : language === 'fr' ? 'champs' : 'campi'}</span>
                      {template.fields && template.fields.some(fieldId => {
                        const field = getFieldById(fieldId);
                        return field && field.dependencies && field.dependencies.length > 0;
                      }) && (
                        <span className="text-blue-600 text-xs">📎</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Template Fields */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                {language === 'de' ? 'Schablonen-Felder' : language === 'fr' ? 'Champs du modèle' : 'Campi del modello'}
              </h3>
            </div>
            <div className="card-body">
              {currentTemplate ? (
                <div className="space-y-3">
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium">{getLocalizedText(currentTemplate.name)}</div>
                    <div className="text-sm text-gray-600">{getLocalizedText(currentTemplate.description)}</div>
                  </div>
                  
                  {templateFields.map(field => (
                    <div key={field.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <div className="font-medium">{getLocalizedText(field.name)}</div>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <span className={`badge ${
                              field.type === 'text' ? 'badge-blue' :
                              field.type === 'select' ? 'badge-green' : 'badge-yellow'
                            }`}>
                              {field.type}
                            </span>
                            <span className={`badge ${field.requirement === 'required' ? 'badge-red' : 'badge-gray'}`}>
                              {field.requirement}
                            </span>
                            {field.dependencies && field.dependencies.length > 0 && (
                              <span className="badge badge-blue">
                                📎 {field.dependencies.length}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleEditField(field)}
                            className="text-blue-500 hover:text-blue-700 px-2"
                            title={language === 'de' ? 'Bearbeiten' : language === 'fr' ? 'Modifier' : 'Modifica'}
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleRemoveFieldFromTemplate(field.id)}
                            className="text-red-500 hover:text-red-700 px-2"
                            title={language === 'de' ? 'Entfernen' : language === 'fr' ? 'Supprimer' : 'Rimuovi'}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                      
                      {/* Field Dependencies Info */}
                      {field.dependencies && field.dependencies.length > 0 && (
                        <div className="text-xs text-blue-600 bg-blue-50 rounded p-2">
                          <strong>
                            {language === 'de' ? 'Abhängigkeiten:' : language === 'fr' ? 'Dépendances:' : 'Dipendenze:'}
                          </strong>
                          <div className="mt-1 space-y-1">
                            {field.dependencies.map((dep, i) => (
                              <div key={i}>
                                • {dep.field_id} {dep.operator} "{dep.condition_value}"
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Role Configuration Info */}
                      {field.role_config && Object.keys(field.role_config).length > 0 && (
                        <div className="text-xs text-green-600 bg-green-50 rounded p-2 mt-2">
                          <strong>
                            {language === 'de' ? 'Rollenkonfiguration:' : language === 'fr' ? 'Configuration des rôles:' : 'Configurazione ruoli:'}
                          </strong> {Object.keys(field.role_config).join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {templateFields.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      {language === 'de' ? 'Keine Felder hinzugefügt' : 
                       language === 'fr' ? 'Aucun champ ajouté' : 
                       'Nessun campo aggiunto'}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {language === 'de' ? 'Wählen Sie eine Schablone aus' : 
                   language === 'fr' ? 'Sélectionnez un modèle' : 
                   'Seleziona un modello'}
                </div>
              )}
            </div>
          </div>

          {/* Available Fields */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                {language === 'de' ? 'Verfügbare Felder' : language === 'fr' ? 'Champs disponibles' : 'Campi disponibili'}
              </h3>
            </div>
            <div className="card-body">
              <div className="space-y-2">
                {availableFields.map(field => (
                  <div
                    key={field.id}
                    className="border border-gray-200 rounded-lg p-3 hover:border-gray-300"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1">
                        <div className="font-medium">{getLocalizedText(field.name)}</div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <span className={`badge ${
                            field.type === 'text' ? 'badge-blue' :
                            field.type === 'select' ? 'badge-green' : 'badge-yellow'
                          }`}>
                            {field.type}
                          </span>
                          <span className={`badge ${field.requirement === 'required' ? 'badge-red' : 'badge-gray'}`}>
                            {field.requirement}
                          </span>
                          {field.dependencies && field.dependencies.length > 0 && (
                            <span className="badge badge-blue">📎</span>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleEditField(field)}
                          className="text-blue-500 hover:text-blue-700 px-2"
                          title={language === 'de' ? 'Bearbeiten' : language === 'fr' ? 'Modifier' : 'Modifica'}
                        >
                          ✏️
                        </button>
                        {currentTemplate && (
                          <button
                            onClick={() => handleAddFieldToTemplate(field.id)}
                            className="btn-primary btn-sm"
                          >
                            +
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {availableFields.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    {language === 'de' ? 'Alle Felder wurden hinzugefügt' : 
                     language === 'fr' ? 'Tous les champs ont été ajoutés' : 
                     'Tutti i campi sono stati aggiunti'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Simulator Tab */}
      {activeTab === 'simulator' && currentTemplate && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              🧪 {language === 'de' ? 'Abhängigkeiten-Simulator' : 
                   language === 'fr' ? 'Simulateur de dépendances' : 
                   'Simulatore dipendenze'}
            </h3>
          </div>
          <div className="card-body">
            <DependencySimulator
              template={currentTemplate}
              fields={templateFields}
              onFieldChange={(fieldId, value, allValues) => {
                setSimulationFieldValues(allValues);
              }}
            />
          </div>
        </div>
      )}

      {/* Dependencies Tab */}
      {activeTab === 'dependencies' && currentTemplate && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              📎 {language === 'de' ? 'Abhängigkeiten-Übersicht' : 
                   language === 'fr' ? 'Aperçu des dépendances' : 
                   'Panoramica dipendenze'}
            </h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {templateFields.filter(field => field.dependencies && field.dependencies.length > 0).map(field => (
                <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="font-medium mb-2">{getLocalizedText(field.name)}</div>
                  <div className="text-sm text-gray-600 mb-3">
                    {language === 'de' ? 'Dieses Feld wird nur angezeigt, wenn:' : 
                     language === 'fr' ? 'Ce champ n\'est affiché que si:' : 
                     'Questo campo viene visualizzato solo se:'}
                  </div>
                  <div className="space-y-2">
                    {field.dependencies.map((dep, i) => (
                      <div key={i} className="flex items-center space-x-2 text-sm bg-blue-50 rounded p-2">
                        <span className="font-medium text-blue-700">
                          {getFieldById(dep.field_id)?.name?.de || dep.field_id}
                        </span>
                        <span className="text-blue-600">{dep.operator}</span>
                        <span className="font-mono text-blue-800">"{dep.condition_value}"</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              {templateFields.filter(field => field.dependencies && field.dependencies.length > 0).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {language === 'de' ? 'Keine Abhängigkeiten in dieser Schablone' : 
                   language === 'fr' ? 'Aucune dépendance dans ce modèle' : 
                   'Nessuna dipendenza in questo modello'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Advanced Field Editor Modal */}
      {showAdvancedFieldEditor && (
        <AdvancedFieldEditor
          field={editingField}
          onSave={handleFieldSave}
          onCancel={handleFieldCancel}
          availableFields={fields}
        />
      )}

      {/* New Template Modal (unchanged from before) */}
      {showNewTemplateForm && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                {language === 'de' ? 'Neue Schablone erstellen' : 
                 language === 'fr' ? 'Créer un nouveau modèle' : 
                 'Crea nuovo modello'}
              </h3>
              <form onSubmit={handleCreateTemplate}>
                <div className="space-y-4">
                  <div>
                    <label className="form-label">
                      {language === 'de' ? 'Name (DE)' : 'Name (DE)'}
                    </label>
                    <input
                      type="text"
                      value={newTemplate.name.de}
                      onChange={(e) => setNewTemplate({
                        ...newTemplate,
                        name: { ...newTemplate.name, de: e.target.value }
                      })}
                      className="form-input"
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">
                      {language === 'de' ? 'Name (FR)' : 'Name (FR)'}
                    </label>
                    <input
                      type="text"
                      value={newTemplate.name.fr}
                      onChange={(e) => setNewTemplate({
                        ...newTemplate,
                        name: { ...newTemplate.name, fr: e.target.value }
                      })}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label">
                      {language === 'de' ? 'Name (IT)' : 'Name (IT)'}
                    </label>
                    <input
                      type="text"
                      value={newTemplate.name.it}
                      onChange={(e) => setNewTemplate({
                        ...newTemplate,
                        name: { ...newTemplate.name, it: e.target.value }
                      })}
                      className="form-input"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowNewTemplateForm(false)}
                    className="btn-secondary"
                  >
                    {language === 'de' ? 'Abbrechen' : language === 'fr' ? 'Annuler' : 'Annulla'}
                  </button>
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? (
                      <div className="spinner spinner-sm mr-2" />
                    ) : null}
                    {language === 'de' ? 'Erstellen' : language === 'fr' ? 'Créer' : 'Crea'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedTemplateBuilder;