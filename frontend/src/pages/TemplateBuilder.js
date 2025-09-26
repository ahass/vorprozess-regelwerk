import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import MultiLanguageInput from '../components/MultiLanguageInput';

const TemplateBuilder = () => {
  const { 
    templates, 
    fields, 
    currentTemplate, 
    language,
    loadTemplates, 
    loadFields,
    createTemplate, 
    updateTemplate,
    createField,
    setCurrentTemplate,
    exportTemplate,
    loading,
    error 
  } = useApp();

  const [showNewTemplateForm, setShowNewTemplateForm] = useState(false);
  const [showNewFieldForm, setShowNewFieldForm] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  
  // New template form state
  const [newTemplate, setNewTemplate] = useState({
    name: { de: '', fr: '', it: '' },
    description: { de: '', fr: '', it: '' }
  });

  // New field form state
  const [newField, setNewField] = useState({
    name: { de: '', fr: '', it: '' },
    type: 'text',
    visibility: 'editable',
    requirement: 'optional',
    validation: {},
    select_type: 'radio',
    options: [],
    role_config: {
      admin: { visible: true, editable: true, required: false },
      klient: { visible: true, editable: true, required: false },
      anmelder: { visible: true, editable: true, required: false }
    },
    document_mode: 'download',
    document_constraints: {}
  });

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

  const handleCreateField = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...newField };
      // map options to DTO shape if type select
      if (payload.type === 'select') {
        payload.options = (payload.options || []).filter(o => (o.value||'').trim() !== '').map(o => ({ id: undefined, label: { de: o.value, fr: o.value, it: o.value }, value: o.value }));
      } else {
        delete payload.options;
      }
      const created = await createField(payload);
      setNewField({
        name: { de: '', fr: '', it: '' },
        type: 'text',
        visibility: 'editable',
        requirement: 'optional',
        validation: {},
        select_type: 'radio',
        options: [],
        role_config: {
          admin: { visible: true, editable: true, required: false },
          klient: { visible: true, editable: true, required: false },
          anmelder: { visible: true, editable: true, required: false }
        },
        document_mode: 'download',
        document_constraints: {}
      });
      setShowNewFieldForm(false);
    } catch (error) {
      console.error('Error creating field:', error);
    }
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

  const getLocalizedText = (multiLangText) => {
    if (!multiLangText) return '';
    return multiLangText[language] || multiLangText.de || '';
  };

  const getFieldById = (fieldId) => {
    return fields.find(f => f.id === fieldId);
  };

  const [editingTemplateName, setEditingTemplateName] = useState(false);
  const [editTemplateNameValue, setEditTemplateNameValue] = useState({ de: '', fr: '', it: '' });

  const availableFields = fields.filter(field => 
    !currentTemplate?.fields?.includes(field.id)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          {language === 'de' && 'Schablonen-Builder'}
          {language === 'fr' && 'Générateur de modèles'}
          {language === 'it' && 'Generatore di modelli'}
        </h1>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowNewTemplateForm(true)}
            className="btn-primary"
          >
            + {language === 'de' ? 'Neue Schablone' : language === 'fr' ? 'Nouveau modèle' : 'Nuovo modello'}
          </button>
          <button
            onClick={() => setShowNewFieldForm(true)}
            className="btn-secondary"
          >
            + {language === 'de' ? 'Neues Feld' : language === 'fr' ? 'Nouveau champ' : 'Nuovo campo'}
          </button>
        </div>
          <button
            onClick={async () => {
              try {
                if (!currentTemplate?.id) return;
                const exportData = await exportTemplate(currentTemplate.id);
                const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `template-${currentTemplate.id}.json`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
              } catch (e) {
                console.error('Export failed', e);
              }
            }}
            className="btn-outline"
          >
            ⬇️ {language === 'de' ? 'Export JSON' : language === 'fr' ? 'Exporter JSON' : 'Esporta JSON'}
          </button>

      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium">
                        {editingTemplateName ? (
                          <MultiLanguageInput
                            label={language === 'de' ? 'Schablonenname' : language === 'fr' ? 'Nom du modèle' : 'Nome del modello'}
                            value={editTemplateNameValue}
                            onChange={setEditTemplateNameValue}
                          />
                        ) : (
                          getLocalizedText(currentTemplate.name)
                        )}
                      </div>
                      <div className="text-sm text-gray-600">{getLocalizedText(currentTemplate.description)}</div>
                    </div>
                    <div className="ml-4">
                      {editingTemplateName ? (
                        <button
                          className="btn-primary btn-sm"
                          onClick={async ()=>{
                            await updateTemplate(currentTemplate.id, { name: editTemplateNameValue });
                            setCurrentTemplate({ ...currentTemplate, name: editTemplateNameValue });
                            setEditingTemplateName(false);
                          }}
                        >
                          {language === 'de' ? 'Speichern' : language === 'fr' ? 'Enregistrer' : 'Salva'}
                        </button>
                      ) : (
                        <button
                          className="btn-outline btn-sm"
                          onClick={()=>{
                            setEditTemplateNameValue(currentTemplate.name || { de:'', fr:'', it:'' });
                            setEditingTemplateName(true);
                          }}
                        >
                          {language === 'de' ? 'Bearbeiten' : language === 'fr' ? 'Modifier' : 'Modifica'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

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
                  <div className="text-sm text-gray-500">
                    {template.fields?.length || 0} {language === 'de' ? 'Felder' : language === 'fr' ? 'champs' : 'campi'}
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
                
                {currentTemplate.fields?.map(fieldId => {
                  const field = getFieldById(fieldId);
                  if (!field) return null;
                  
                  return (
                    <div key={fieldId} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
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
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveFieldFromTemplate(fieldId)}
                        className="text-red-500 hover:text-red-700 ml-2"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
                
                {(!currentTemplate.fields || currentTemplate.fields.length === 0) && (
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
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-gray-300"
                >
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
                    </div>
                  </div>
                  {currentTemplate && (
                    <button
                      onClick={() => handleAddFieldToTemplate(field.id)}
                      className="btn-primary btn-sm"
                    >
                      +
                    </button>
                  )}
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

      {/* New Template Modal */}
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
                <MultiLanguageInput
                  label={language === 'de' ? 'Name' : language === 'fr' ? 'Nom' : 'Nome'}
                  value={newTemplate.name}
                  onChange={(value) => setNewTemplate({...newTemplate, name: value})}
                  required
                  className="mb-4"
                />
                <MultiLanguageInput
                  label={language === 'de' ? 'Beschreibung' : language === 'fr' ? 'Description' : 'Descrizione'}
                  value={newTemplate.description}
                  onChange={(value) => setNewTemplate({...newTemplate, description: value})}
                  type="textarea"
                  className="mb-6"
                />
                <div className="flex justify-end space-x-3">
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

      {/* New Field Modal */}
      {showNewFieldForm && (
        <div className="modal-backdrop">
          <div className="modal-content max-w-2xl">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                {language === 'de' ? 'Neues Feld erstellen' : 
                 language === 'fr' ? 'Créer un nouveau champ' : 
                 'Crea nuovo campo'}
              </h3>
              <form onSubmit={handleCreateField}>
                <div className="space-y-4">
                  <MultiLanguageInput
                    label={language === 'de' ? 'Feldname' : language === 'fr' ? 'Nom du champ' : 'Nome campo'}
                    value={newField.name}
                    onChange={(value) => setNewField({...newField, name: value})}
                    required
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="form-label">
                        {language === 'de' ? 'Feldtyp' : language === 'fr' ? 'Type de champ' : 'Tipo campo'}
                      </label>
                      <select
                        value={newField.type}
                        onChange={(e) => setNewField({...newField, type: e.target.value})}
                        className="form-select"
                      >
                        <option value="text">Text</option>
                        <option value="select">Auswahl</option>
                        <option value="document">Dokument</option>
                      </select>
                    </div>

                    {/* Role-based settings */}
                    <div className="md:col-span-2">
                      <label className="form-label">
                        {language === 'de' ? 'Rollenbasierte Einstellungen' : language === 'fr' ? 'Paramètres par rôle' : 'Impostazioni per ruolo'}
                      </label>
                      <div className="grid grid-cols-3 gap-4">
                        {['admin','klient','anmelder'].map(role => (
                          <div key={role} className="border rounded p-3">
                            <div className="font-medium capitalize mb-2">{role}</div>
                            <div className="space-y-2">
                              <label className="inline-flex items-center space-x-2">
                                <input type="checkbox" checked={newField.role_config[role].visible} onChange={(e)=> setNewField({...newField, role_config: {...newField.role_config, [role]: {...newField.role_config[role], visible: e.target.checked}}})} />
                                <span>{language === 'de' ? 'Sichtbar' : language === 'fr' ? 'Visible' : 'Visibile'}</span>
                              </label>
                              <label className="inline-flex items-center space-x-2">
                                <input type="checkbox" checked={newField.role_config[role].editable} onChange={(e)=> setNewField({...newField, role_config: {...newField.role_config, [role]: {...newField.role_config[role], editable: e.target.checked}}})} />
                                <span>{language === 'de' ? 'Bearbeitbar' : language === 'fr' ? 'Modifiable' : 'Modificabile'}</span>
                              </label>
                              <label className="inline-flex items-center space-x-2">
                                <input type="checkbox" checked={newField.role_config[role].required} onChange={(e)=> setNewField({...newField, role_config: {...newField.role_config, [role]: {...newField.role_config[role], required: e.target.checked}}})} />
                                <span>{language === 'de' ? 'Pflichtfeld' : language === 'fr' ? 'Obligatoire' : 'Obbligatorio'}</span>
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                  {/* Options for select type */}
                  {newField.type === 'select' && (
                    <div className="mt-4">
                      <label className="form-label">{language === 'de' ? 'Auswahl-Optionen' : language === 'fr' ? 'Options de sélection' : 'Opzioni di selezione'}</label>
                      <div className="space-y-2">
                        {newField.options.map((opt, idx) => (
                          <div key={idx} className="flex items-center space-x-2">
                            <input
                              type="text"
                              className="form-input flex-1"
                              placeholder={language === 'de' ? 'Wert' : language === 'fr' ? 'Valeur' : 'Valore'}
                              value={opt.value || ''}
                              onChange={(e)=>{
                                const updated = [...newField.options];
                                updated[idx] = { ...(updated[idx]||{}), value: e.target.value };
                                setNewField({ ...newField, options: updated });
                              }}
                            />
                            <button type="button" className="btn-secondary" onClick={()=>{
                              const updated = newField.options.filter((_,i)=>i!==idx);
                              setNewField({ ...newField, options: updated });
                            }}>−</button>
                          </div>
                        ))}
                        <button type="button" className="btn-outline" onClick={()=> setNewField({ ...newField, options: [...newField.options, { value: '' }] })}>+ {language === 'de' ? 'Option hinzufügen' : language === 'fr' ? 'Ajouter une option' : 'Aggiungi opzione'}</button>
                      </div>
                    </div>
                  )}

                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowNewFieldForm(false)}
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

export default TemplateBuilder;