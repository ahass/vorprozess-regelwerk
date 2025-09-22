import React, { useEffect, useState } from 'react';
import { useApp } from '../contexts/AppContext';

const ChangeLog = () => {
  const { 
    changelog,
    language,
    loadChangelog,
    loading,
    error 
  } = useApp();

  const [filter, setFilter] = useState('all');
  const [limit, setLimit] = useState(50);

  useEffect(() => {
    loadChangelog(limit, filter === 'all' ? null : filter);
  }, [filter, limit]);

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString(
      language === 'de' ? 'de-DE' : 
      language === 'fr' ? 'fr-FR' : 'it-IT'
    );
  };

  const getActionText = (action) => {
    switch (action) {
      case 'created':
        return language === 'de' ? 'Erstellt' : 
               language === 'fr' ? 'Créé' : 'Creato';
      case 'updated':
        return language === 'de' ? 'Aktualisiert' : 
               language === 'fr' ? 'Mis à jour' : 'Aggiornato';
      case 'deleted':
        return language === 'de' ? 'Gelöscht' : 
               language === 'fr' ? 'Supprimé' : 'Eliminato';
      default:
        return action;
    }
  };

  const getEntityTypeText = (entityType) => {
    switch (entityType) {
      case 'template':
        return language === 'de' ? 'Schablone' : 
               language === 'fr' ? 'Modèle' : 'Modello';
      case 'field':
        return language === 'de' ? 'Feld' : 
               language === 'fr' ? 'Champ' : 'Campo';
      default:
        return entityType;
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'created': return '➕';
      case 'updated': return '✏️';
      case 'deleted': return '🗑️';
      default: return '📝';
    }
  };

  const getActionBadgeClass = (action) => {
    switch (action) {
      case 'created': return 'badge-green';
      case 'updated': return 'badge-blue';
      case 'deleted': return 'badge-red';
      default: return 'badge-gray';
    }
  };

  const renderChanges = (changes) => {
    if (!changes || Object.keys(changes).length === 0) {
      return <span className="text-gray-500 text-sm">
        {language === 'de' ? 'Keine Details' : 
         language === 'fr' ? 'Aucun détail' : 'Nessun dettaglio'}
      </span>;
    }

    return (
      <div className="text-sm space-y-1">
        {Object.entries(changes).map(([key, value]) => (
          <div key={key} className="flex">
            <span className="font-medium text-gray-600 min-w-20">{key}:</span>
            <span className="text-gray-800 ml-2 break-all">
              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {language === 'de' && 'Änderungsprotokoll'}
            {language === 'fr' && 'Journal des modifications'}
            {language === 'it' && 'Registro delle modifiche'}
          </h1>
          <p className="text-gray-600 mt-1">
            {language === 'de' && 'Vollständige Übersicht aller Änderungen an Schablonen und Feldern'}
            {language === 'fr' && 'Aperçu complet de toutes les modifications des modèles et champs'}
            {language === 'it' && 'Panoramica completa di tutte le modifiche a modelli e campi'}
          </p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div>
          <label className="form-label">
            {language === 'de' ? 'Typ filtern' : 
             language === 'fr' ? 'Filtrer par type' : 
             'Filtra per tipo'}
          </label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="form-select"
          >
            <option value="all">
              {language === 'de' ? 'Alle Änderungen' : 
               language === 'fr' ? 'Toutes les modifications' : 
               'Tutte le modifiche'}
            </option>
            <option value="template">
              {language === 'de' ? 'Nur Schablonen' : 
               language === 'fr' ? 'Modèles seulement' : 
               'Solo modelli'}
            </option>
            <option value="field">
              {language === 'de' ? 'Nur Felder' : 
               language === 'fr' ? 'Champs seulement' : 
               'Solo campi'}
            </option>
          </select>
        </div>
        
        <div>
          <label className="form-label">
            {language === 'de' ? 'Anzahl Einträge' : 
             language === 'fr' ? 'Nombre d\'entrées' : 
             'Numero di voci'}
          </label>
          <select
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value))}
            className="form-select"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
          </select>
        </div>
      </div>

      {/* Change Log */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            {language === 'de' ? 'Änderungsverlauf' : 
             language === 'fr' ? 'Historique des modifications' : 
             'Cronologia delle modifiche'} ({changelog.length})
          </h3>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="spinner" />
            </div>
          ) : changelog.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-4">📜</div>
              <p>
                {language === 'de' ? 'Keine Änderungen gefunden' : 
                 language === 'fr' ? 'Aucune modification trouvée' : 
                 'Nessuna modifica trovata'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {changelog.map((entry, index) => (
                <div key={entry.id || index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getActionIcon(entry.action)}</span>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`badge ${getActionBadgeClass(entry.action)}`}>
                            {getActionText(entry.action)}
                          </span>
                          <span className="badge badge-gray">
                            {getEntityTypeText(entry.entity_type)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">{entry.user_name}</span>
                          {' • '}
                          <span>{formatTimestamp(entry.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 font-mono">
                      ID: {entry.entity_id.slice(0, 8)}...
                    </div>
                  </div>
                  
                  {/* Change Details */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">
                      {language === 'de' ? 'Änderungsdetails:' : 
                       language === 'fr' ? 'Détails des modifications:' : 
                       'Dettagli delle modifiche:'}
                    </h5>
                    {renderChanges(entry.changes)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-green-600">
              {changelog.filter(e => e.action === 'created').length}
            </div>
            <div className="text-sm text-gray-600">
              {language === 'de' ? 'Erstellt' : language === 'fr' ? 'Créé' : 'Creato'}
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-blue-600">
              {changelog.filter(e => e.action === 'updated').length}
            </div>
            <div className="text-sm text-gray-600">
              {language === 'de' ? 'Aktualisiert' : language === 'fr' ? 'Mis à jour' : 'Aggiornato'}
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-red-600">
              {changelog.filter(e => e.action === 'deleted').length}
            </div>
            <div className="text-sm text-gray-600">
              {language === 'de' ? 'Gelöscht' : language === 'fr' ? 'Supprimé' : 'Eliminato'}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Summary */}
      {changelog.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              📊 {language === 'de' ? 'Aktivitäts-Zusammenfassung' : 
                   language === 'fr' ? 'Résumé d\'activité' : 
                   'Riassunto attività'}
            </h3>
          </div>
          <div className="card-body">
            <div className="text-sm text-gray-600">
              <p className="mb-2">
                {language === 'de' ? 'Letzte Aktivität:' : 
                 language === 'fr' ? 'Dernière activité:' : 
                 'Ultima attività:'} {' '}
                <span className="font-medium">
                  {formatTimestamp(changelog[0]?.timestamp)}
                </span>
              </p>
              <p>
                {language === 'de' ? 'Aktivste Benutzer:' : 
                 language === 'fr' ? 'Utilisateurs les plus actifs:' : 
                 'Utenti più attivi:'} {' '}
                <span className="font-medium">
                  {changelog[0]?.user_name || 'System User'}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChangeLog;