import React, { createContext, useContext, useReducer } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Initial state
const initialState = {
  templates: [],
  fields: [],
  currentTemplate: null,
  currentField: null,
  language: 'de',
  userRole: 'admin',
  loading: false,
  error: null,
  changelog: []
};

// Action types
const actionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_LANGUAGE: 'SET_LANGUAGE',
  SET_USER_ROLE: 'SET_USER_ROLE',
  SET_TEMPLATES: 'SET_TEMPLATES',
  ADD_TEMPLATE: 'ADD_TEMPLATE',
  UPDATE_TEMPLATE: 'UPDATE_TEMPLATE',
  DELETE_TEMPLATE: 'DELETE_TEMPLATE',
  SET_CURRENT_TEMPLATE: 'SET_CURRENT_TEMPLATE',
  SET_FIELDS: 'SET_FIELDS',
  ADD_FIELD: 'ADD_FIELD',
  UPDATE_FIELD: 'UPDATE_FIELD',
  DELETE_FIELD: 'DELETE_FIELD',
  SET_CURRENT_FIELD: 'SET_CURRENT_FIELD',
  SET_CHANGELOG: 'SET_CHANGELOG'
};

// Reducer
const appReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_LOADING:
      return { ...state, loading: action.payload };
    case actionTypes.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    case actionTypes.SET_LANGUAGE:
      return { ...state, language: action.payload };
    case actionTypes.SET_USER_ROLE:
      return { ...state, userRole: action.payload };
    case actionTypes.SET_TEMPLATES:
      return { ...state, templates: action.payload };
    case actionTypes.ADD_TEMPLATE:
      return { ...state, templates: [...state.templates, action.payload] };
    case actionTypes.UPDATE_TEMPLATE:
      return {
        ...state,
        templates: state.templates.map(t => 
          t.id === action.payload.id ? action.payload : t
        )
      };
    case actionTypes.DELETE_TEMPLATE:
      return {
        ...state,
        templates: state.templates.filter(t => t.id !== action.payload)
      };
    case actionTypes.SET_CURRENT_TEMPLATE:
      return { ...state, currentTemplate: action.payload };
    case actionTypes.SET_FIELDS:
      return { ...state, fields: action.payload };
    case actionTypes.ADD_FIELD:
      return { ...state, fields: [...state.fields, action.payload] };
    case actionTypes.UPDATE_FIELD:
      return {
        ...state,
        fields: state.fields.map(f => 
          f.id === action.payload.id ? action.payload : f
        )
      };
    case actionTypes.DELETE_FIELD:
      return {
        ...state,
        fields: state.fields.filter(f => f.id !== action.payload)
      };
    case actionTypes.SET_CURRENT_FIELD:
      return { ...state, currentField: action.payload };
    case actionTypes.SET_CHANGELOG:
      return { ...state, changelog: action.payload };
    default:
      return state;
  }
};

// Create context
const AppContext = createContext();

// API functions
const api = {
  // Templates
  getTemplates: async () => {
    const response = await axios.get(`${API}/templates`);
    return response.data;
  },
  
  createTemplate: async (templateData) => {
    const response = await axios.post(`${API}/templates`, templateData);
    return response.data;
  },
  
  updateTemplate: async (id, templateData) => {
    const response = await axios.put(`${API}/templates/${id}`, templateData);
    return response.data;
  },
  
  deleteTemplate: async (id) => {
    await axios.delete(`${API}/templates/${id}`);
  },
  
  // Fields
  getFields: async () => {
    const response = await axios.get(`${API}/fields`);
    return response.data;
  },
  
  createField: async (fieldData) => {
    const response = await axios.post(`${API}/fields`, fieldData);
    return response.data;
  },
  
  updateField: async (id, fieldData) => {
    const response = await axios.put(`${API}/fields/${id}`, fieldData);
    return response.data;
  },
  
  deleteField: async (id) => {
    await axios.delete(`${API}/fields/${id}`);
  },
  
  // Template rendering
  renderTemplates: async (renderRequest) => {
    const response = await axios.post(`${API}/templates/render`, renderRequest);
    return response.data;
  },
  
  // Changelog
  getChangelog: async (limit = 100, entityType = null) => {
    const params = new URLSearchParams();
    params.append('limit', limit);
    if (entityType) params.append('entity_type', entityType);
    
    const response = await axios.get(`${API}/changelog?${params}`);
    return response.data;
  }
  ,
  // Template export
  exportTemplate: async (id) => {
    const response = await axios.get(`${API}/templates/${id}/export`);
    return response.data;
  },
  exportTemplatesBulk: async (ids) => {
    const params = new URLSearchParams();
    params.append('ids', ids.join(','));
    const response = await axios.get(`${API}/templates/export?${params}`);
    return response.data;
  }

};

// Provider component
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Actions
  const actions = {
    setLoading: (loading) => dispatch({ type: actionTypes.SET_LOADING, payload: loading }),
    setError: (error) => dispatch({ type: actionTypes.SET_ERROR, payload: error }),
    setLanguage: (language) => dispatch({ type: actionTypes.SET_LANGUAGE, payload: language }),
    setUserRole: (role) => dispatch({ type: actionTypes.SET_USER_ROLE, payload: role }),
    
    // Template actions
    loadTemplates: async () => {
      try {
        dispatch({ type: actionTypes.SET_LOADING, payload: true });
        const templates = await api.getTemplates();
        dispatch({ type: actionTypes.SET_TEMPLATES, payload: templates });
      } catch (error) {
        dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      } finally {
        dispatch({ type: actionTypes.SET_LOADING, payload: false });
      }
    },
    
    createTemplate: async (templateData) => {
      try {
        dispatch({ type: actionTypes.SET_LOADING, payload: true });
        const newTemplate = await api.createTemplate(templateData);
        dispatch({ type: actionTypes.ADD_TEMPLATE, payload: newTemplate });
        return newTemplate;
      } catch (error) {
        dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
        throw error;
      } finally {
        dispatch({ type: actionTypes.SET_LOADING, payload: false });
      }
    },
    
    updateTemplate: async (id, templateData) => {
      try {
        dispatch({ type: actionTypes.SET_LOADING, payload: true });
        const updatedTemplate = await api.updateTemplate(id, templateData);
        dispatch({ type: actionTypes.UPDATE_TEMPLATE, payload: updatedTemplate });
        return updatedTemplate;
      } catch (error) {
        dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
        throw error;
      } finally {
        dispatch({ type: actionTypes.SET_LOADING, payload: false });
      }
    },
    
    deleteTemplate: async (id) => {
      try {
        dispatch({ type: actionTypes.SET_LOADING, payload: true });
        await api.deleteTemplate(id);
        dispatch({ type: actionTypes.DELETE_TEMPLATE, payload: id });
      } catch (error) {
        dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
        throw error;
      } finally {
        dispatch({ type: actionTypes.SET_LOADING, payload: false });
      }
    },
    
    setCurrentTemplate: (template) => dispatch({ type: actionTypes.SET_CURRENT_TEMPLATE, payload: template }),
    
    // Field actions
    loadFields: async () => {
      try {
        dispatch({ type: actionTypes.SET_LOADING, payload: true });
        const fields = await api.getFields();
        dispatch({ type: actionTypes.SET_FIELDS, payload: fields });
      } catch (error) {
        dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      } finally {
        dispatch({ type: actionTypes.SET_LOADING, payload: false });
      }
    },
    
    createField: async (fieldData) => {
      try {
        dispatch({ type: actionTypes.SET_LOADING, payload: true });
        const newField = await api.createField(fieldData);
        dispatch({ type: actionTypes.ADD_FIELD, payload: newField });
        return newField;
      } catch (error) {
        dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
        throw error;
      } finally {
        dispatch({ type: actionTypes.SET_LOADING, payload: false });
      }
    },
    
    updateField: async (id, fieldData) => {
      try {
        dispatch({ type: actionTypes.SET_LOADING, payload: true });
        const updatedField = await api.updateField(id, fieldData);
        dispatch({ type: actionTypes.UPDATE_FIELD, payload: updatedField });
        return updatedField;
      } catch (error) {
        dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
        throw error;
      } finally {
        dispatch({ type: actionTypes.SET_LOADING, payload: false });
      }
    },
    
    deleteField: async (id) => {
      try {
        dispatch({ type: actionTypes.SET_LOADING, payload: true });
        await api.deleteField(id);
        dispatch({ type: actionTypes.DELETE_FIELD, payload: id });
      } catch (error) {
        dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
        throw error;
      } finally {
        dispatch({ type: actionTypes.SET_LOADING, payload: false });
      }
    },
    
    setCurrentField: (field) => dispatch({ type: actionTypes.SET_CURRENT_FIELD, payload: field }),
    
    // Changelog actions
    loadChangelog: async (limit, entityType) => {
      try {
        dispatch({ type: actionTypes.SET_LOADING, payload: true });
        const changelog = await api.getChangelog(limit, entityType);
        dispatch({ type: actionTypes.SET_CHANGELOG, payload: Array.isArray(changelog) ? changelog : [] });
      } catch (error) {
        dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
        dispatch({ type: actionTypes.SET_CHANGELOG, payload: [] });
      } finally {
        dispatch({ type: actionTypes.SET_LOADING, payload: false });
      }
    },
    
    // Template rendering
    renderTemplates: async (renderRequest) => {
      try {
        dispatch({ type: actionTypes.SET_LOADING, payload: true });
        return await api.renderTemplates(renderRequest);
      } catch (error) {
        dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
        throw error;
      } finally {
        dispatch({ type: actionTypes.SET_LOADING, payload: false });
      }
    }
  };

  return (
    <AppContext.Provider value={{ ...state, ...actions }}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the context
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export default AppContext;