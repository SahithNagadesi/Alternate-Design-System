import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import { Dashboard } from './pages/Dashboard';
import { CaseList } from './pages/CaseList';
import { CaseDetail } from './pages/CaseDetail';
import { CreateCase } from './pages/CreateCase';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<Dashboard />} />
          <Route path="cases" element={<CaseList />} />
          <Route path="cases/:caseId" element={<CaseDetail />} />
          <Route path="cases/new" element={<CreateCase />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
