import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';

const RoleSimulator = () => {
  const { 
    templates, 
    fields, 
    language,
    loadTemplates, 
    loadFields,
    renderTemplates,
    loading,
    error 
  } = useApp();

  const [selectedTemplates, setSelectedTemplates] = useState([]);
  const [selectedRole, setSelectedRole] = useState('anmelder');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [simulationResult, setSimulationResult] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const roles = [
    { code: 'anmelder', name: 'Anmelder', name_fr: 'Déclarant', name_it: 'Dichiarante' },
    { code: 'klient', name: 'Klient', name_fr: 'Client', name_it: 'Cliente' },
    { code: 'admin', name: 'Administrator', name_fr: 'Administrateur', name_it: 'Amministratore' }
  ];

  const customers = [
    { id: 'customer_1', name: 'Kunde A' },
    { id: 'customer_2', name: 'Kunde B' },
    { id: 'customer_3', name: 'Kunde C' }
  ];

  useEffect(() => {
    loadTemplates();
    loadFields();
  }, []);

  const getLocalizedText = (multiLangText) => {
    if (!multiLangText) return '';
    return multiLangText[language] || multiLangText.de || '';
  };

  const getLocalizedRoleName = (role) => {
    const roleObj = roles.find(r => r.code === role.code);
    if (!roleObj) return role.name;
    
    const key = language === 'fr' ? 'name_fr' : language === 'it' ? 'name_it' : 'name';
    return roleObj[key] || roleObj.name;
  };

  const handleTemplateToggle = (templateId) => {
    setSelectedTemplates(prev => 
      prev.includes(templateId) 
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId]
    );
  };

  const handleSimulate = async () => {
    if (selectedTemplates.length === 0) {
      alert(
        language === 'de' ? 'Bitte wählen Sie mindestens eine Schablone aus.' :
        language === 'fr' ? 'Veuillez sélectionner au moins un modèle.' :
        'Seleziona almeno un modello.'
      );
      return;
    }

    setIsSimulating(true);
    try {
      const result = await renderTemplates({
        template_ids: selectedTemplates,
        role: selectedRole,
        customer_id: selectedCustomer || null,
        language: language
      });
      setSimulationResult(result);
    } catch (error) {
      console.error('Error simulating templates:', error);
    } finally {
      setIsSimulating(false);
    }
  };

  const getFieldById = (fieldId) => {
    return fields.find(f => f.id === fieldId);
  };

  const renderFieldPreview = (field) => {
    const fieldName = getLocalizedText(field.name);
    
    switch (field.type) {
      case 'text':
        return (
          <div className="field-preview text">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {fieldName}
              {field.requirement === 'required' && <span className="text-red-500 ml-1">*</span>}
            </label>
            {field.visibility === 'editable' ? (
              <input
                type="text"
                className="form-input"
                placeholder={`${fieldName} eingeben...`}
                disabled={field.visibility === 'visible'}
              />
            ) : (
              <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-600">
                {language === 'de' ? 'Nur sichtbar' : language === 'fr' ? 'Visible seulement' : 'Solo visibile'}
              </div>
            )}
          </div>
        );
        
      case 'select':
        return (
          <div className="field-preview select">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {fieldName}
              {field.requirement === 'required' && <span className="text-red-500 ml-1">*</span>}
            </label>
            {field.visibility === 'editable' ? (
              field.select_type === 'multiple' ? (
                <div className="space-y-2">
                  {field.options?.slice(0, 3).map((option, index) => (
                    <label key={index} className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span className="text-sm">{getLocalizedText(option.label)} (Demo)</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {field.options?.slice(0, 3).map((option, index) => (
                    <label key={index} className="flex items-center">
                      <input type="radio" name={field.id} className="mr-2" />
                      <span className="text-sm">{getLocalizedText(option.label)} (Demo)</span>
                    </label>
                  ))}
                </div>
              )
            ) : (
              <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-600">
                {language === 'de' ? 'Nur sichtbar' : language === 'fr' ? 'Visible seulement' : 'Solo visibile'}
              </div>
            )}
          </div>
        );
        
      case 'document':
        return (
          <div className="field-preview document">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {fieldName}
              {field.requirement === 'required' && <span className="text-red-500 ml-1">*</span>}
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
                  <button className="btn-secondary btn-sm">
                    {language === 'de' ? 'Datei wählen' : language === 'fr' ? 'Choisir un fichier' : 'Scegli file'}
                  </button>
                </div>
              )}
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {language === 'de' && 'Rollen-Simulator'}
          {language === 'fr' && 'Simulateur de rôles'}
          {language === 'it' && 'Simulatore di ruoli'}
        </h1>
        <p className="text-gray-600 mt-2">
          {language === 'de' && 'Testen Sie, wie Schablonen für verschiedene Rollen und Kunden angezeigt werden.'}
          {language === 'fr' && 'Testez comment les modèles sont affichés pour différents rôles et clients.'}
          {language === 'it' && 'Testa come i modelli vengono visualizzati per diversi ruoli e clienti.'}
        </p>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              {language === 'de' ? 'Simulation konfigurieren' : 
               language === 'fr' ? 'Configurer la simulation' : 
               'Configura simulazione'}
            </h3>
          </div>
          <div className="card-body space-y-4">
            {/* Role Selection */}
            <div>
              <label className="form-label">
                {language === 'de' ? 'Rolle' : language === 'fr' ? 'Rôle' : 'Ruolo'}
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="form-select"
              >
                {roles.map(role => (
                  <option key={role.code} value={role.code}>
                    {getLocalizedRoleName(role)}
                  </option>
                ))}
              </select>
            </div>

            {/* Customer Selection */}
            <div>
              <label className="form-label">
                {language === 'de' ? 'Kunde (optional)' : 
                 language === 'fr' ? 'Client (optionnel)' : 
                 'Cliente (opzionale)'}
              </label>
              <select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className="form-select"
              >
                <option value="">
                  {language === 'de' ? 'Alle Kunden' : language === 'fr' ? 'Tous les clients' : 'Tutti i clienti'}
                </option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Template Selection */}
            <div>
              <label className="form-label">
                {language === 'de' ? 'Schablonen auswählen' : 
                 language === 'fr' ? 'Sélectionner les modèles' : 
                 'Seleziona modelli'}
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {templates.map(template => (
                  <label key={template.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedTemplates.includes(template.id)}
                      onChange={() => handleTemplateToggle(template.id)}
                      className="mr-2"
                    />
                    <span className="text-sm">{getLocalizedText(template.name)}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={handleSimulate}
              disabled={isSimulating || selectedTemplates.length === 0}
              className="btn-primary w-full"
            >
              {isSimulating ? (
                <>
                  <div className="spinner spinner-sm mr-2" />
                  {language === 'de' ? 'Simuliere...' : language === 'fr' ? 'Simulation...' : 'Simulazione...'}
                </>
              ) : (
                language === 'de' ? 'Simulation starten' : 
                language === 'fr' ? 'Démarrer la simulation' : 
                'Avvia simulazione'
              )}
            </button>
          </div>
        </div>

        {/* Simulation Results */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                {language === 'de' ? 'Simulationsergebnis' : 
                 language === 'fr' ? 'Résultat de simulation' : 
                 'Risultato simulazione'}
              </h3>
              {simulationResult && (
                <div className="text-sm text-gray-600">
                  {language === 'de' ? 'Rolle:' : language === 'fr' ? 'Rôle:' : 'Ruolo:'} {' '}
                  <span className="font-medium">{getLocalizedRoleName({ code: selectedRole })}</span>
                  {selectedCustomer && (
                    <>
                      {' | '}
                      {language === 'de' ? 'Kunde:' : language === 'fr' ? 'Client:' : 'Cliente:'} {' '}
                      <span className="font-medium">
                        {customers.find(c => c.id === selectedCustomer)?.name}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="card-body">
              {!simulationResult ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-4">🎮</div>
                  <p>
                    {language === 'de' ? 'Wählen Sie Schablonen aus und starten Sie die Simulation' : 
                     language === 'fr' ? 'Sélectionnez des modèles et démarrez la simulation' : 
                     'Seleziona i modelli e avvia la simulazione'}
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {simulationResult.templates.map(template => {
                    const templateFields = template.fields || [];
                    
                    return (
                      <div key={template.id} className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-semibold text-lg mb-2">
                          {getLocalizedText(template.name)}
                        </h4>
                        {template.description && (
                          <p className="text-gray-600 text-sm mb-4">
                            {getLocalizedText(template.description)}
                          </p>
                        )}
                        
                        <div className="space-y-4">
                          {templateFields.map(fieldId => {
                            const field = getFieldById(fieldId);
                            if (!field) return null;
                            
                            return (
                              <div key={fieldId}>
                                {renderFieldPreview(field)}
                              </div>
                            );
                          })}
                          
                          {templateFields.length === 0 && (
                            <div className="text-center py-4 text-gray-500 bg-gray-50 rounded">
                              {language === 'de' ? 'Keine Felder in dieser Schablone' : 
                               language === 'fr' ? 'Aucun champ dans ce modèle' : 
                               'Nessun campo in questo modello'}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  {simulationResult.templates.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      {language === 'de' ? 'Keine Schablonen für diese Konfiguration verfügbar' : 
                       language === 'fr' ? 'Aucun modèle disponible pour cette configuration' : 
                       'Nessun modello disponibile per questa configurazione'}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info Panel */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            ℹ️ {language === 'de' ? 'Simulation-Hinweise' : 
                 language === 'fr' ? 'Conseils de simulation' : 
                 'Suggerimenti per la simulazione'}
          </h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">
                {language === 'de' ? 'Rollen-Unterschiede:' : 
                 language === 'fr' ? 'Différences de rôles:' : 
                 'Differenze di ruolo:'}
              </h4>
              <ul className="space-y-1 text-gray-600">
                <li>• <strong>Admin:</strong> {language === 'de' ? 'Sieht alle Felder und kann alles bearbeiten' : 
                                                language === 'fr' ? 'Voit tous les champs et peut tout modifier' : 
                                                'Vede tutti i campi e può modificare tutto'}</li>
                <li>• <strong>Anmelder:</strong> {language === 'de' ? 'Eingeschränkte Sicht basierend auf Konfiguration' : 
                                                  language === 'fr' ? 'Vue limitée basée sur la configuration' : 
                                                  'Vista limitata basata sulla configurazione'}</li>
                <li>• <strong>Klient:</strong> {language === 'de' ? 'Meist nur Ansicht, wenig Bearbeitung' : 
                                               language === 'fr' ? 'Surtout en lecture, peu de modification' : 
                                               'Principalmente visualizzazione, poca modifica'}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">
                {language === 'de' ? 'Feld-Typen:' : 
                 language === 'fr' ? 'Types de champs:' : 
                 'Tipi di campo:'}
              </h4>
              <ul className="space-y-1 text-gray-600">
                <li>• <span className="badge badge-blue badge-sm">Text</span> {language === 'de' ? 'Eingabefelder' : 
                                                                                language === 'fr' ? 'Champs de saisie' : 
                                                                                'Campi di input'}</li>
                <li>• <span className="badge badge-green badge-sm">Select</span> {language === 'de' ? 'Auswahloptionen' : 
                                                                                  language === 'fr' ? 'Options de sélection' : 
                                                                                  'Opzioni di selezione'}</li>
                <li>• <span className="badge badge-yellow badge-sm">Document</span> {language === 'de' ? 'Datei-Upload/Download' : 
                                                                                     language === 'fr' ? 'Téléchargement/chargement de fichiers' : 
                                                                                     'Upload/download di file'}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleSimulator;