import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from './contexts/AppContext';
import Layout from './components/Layout';
import TemplateBuilder from './pages/TemplateBuilder';
import EnhancedTemplateBuilder from './pages/EnhancedTemplateBuilder';
import TemplateOverview from './pages/TemplateOverview';
import RoleSimulator from './pages/RoleSimulator';
import ChangeLog from './pages/ChangeLog';

function App() {
  return (
    <AppProvider>
      <div className="App">
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Navigate to="/builder" replace />} />
              <Route path="/builder" element={<TemplateBuilder />} />
              <Route path="/enhanced-builder" element={<EnhancedTemplateBuilder />} />
              <Route path="/overview" element={<TemplateOverview />} />
              <Route path="/simulator" element={<RoleSimulator />} />
              <Route path="/changelog" element={<ChangeLog />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </div>
    </AppProvider>
  );
}

export default App;