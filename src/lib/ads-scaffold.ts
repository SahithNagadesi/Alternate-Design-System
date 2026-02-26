/**
 * ADS Scaffold Generator
 *
 * Generates a complete React + Vite starter project for Alternate Design System
 * applications that connect to Pega via DX APIs.
 */

export interface ScaffoldMetadata {
  appName: string;
  pegaAppName?: string;
  caseTypes?: string;
  dxApiVersion?: string;
  authMethod?: string;
  framework?: string;
}

interface ScaffoldFile {
  path: string;
  content: string;
}

export function generateADSScaffold(
  metadata: ScaffoldMetadata,
  pegaServerUrl?: string
): ScaffoldFile[] {
  const {
    appName,
    pegaAppName = "MyApp",
    caseTypes = "",
    dxApiVersion = "24.1",
    authMethod = "Basic",
  } = metadata;

  const safeName = appName.replace(/[^a-zA-Z0-9-_]/g, "-").toLowerCase();
  const serverUrl = pegaServerUrl || "http://localhost:8080";

  const files: ScaffoldFile[] = [];

  // ── package.json ──────────────────────────────────────────────────────
  files.push({
    path: "package.json",
    content: JSON.stringify(
      {
        name: safeName,
        private: true,
        version: "0.1.0",
        type: "module",
        scripts: {
          dev: "vite",
          build: "tsc && vite build",
          preview: "vite preview",
        },
        dependencies: {
          react: "^18.3.1",
          "react-dom": "^18.3.1",
          "react-router-dom": "^6.28.0",
          axios: "^1.7.9",
        },
        devDependencies: {
          "@types/react": "^18.3.12",
          "@types/react-dom": "^18.3.1",
          "@vitejs/plugin-react": "^4.3.4",
          typescript: "^5.6.3",
          vite: "^6.0.1",
        },
      },
      null,
      2
    ),
  });

  // ── tsconfig.json ─────────────────────────────────────────────────────
  files.push({
    path: "tsconfig.json",
    content: JSON.stringify(
      {
        compilerOptions: {
          target: "ES2020",
          useDefineForClassFields: true,
          lib: ["ES2020", "DOM", "DOM.Iterable"],
          module: "ESNext",
          skipLibCheck: true,
          moduleResolution: "bundler",
          allowImportingTsExtensions: true,
          isolatedModules: true,
          moduleDetection: "force",
          noEmit: true,
          jsx: "react-jsx",
          strict: true,
          noUnusedLocals: true,
          noUnusedParameters: true,
          noFallthroughCasesInSwitch: true,
          baseUrl: ".",
          paths: { "@/*": ["src/*"] },
        },
        include: ["src"],
      },
      null,
      2
    ),
  });

  // ── vite.config.ts ────────────────────────────────────────────────────
  files.push({
    path: "vite.config.ts",
    content: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    proxy: {
      '/prweb': {
        target: process.env.VITE_PEGA_SERVER_URL || '${serverUrl}',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
`,
  });

  // ── index.html ────────────────────────────────────────────────────────
  files.push({
    path: "index.html",
    content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${appName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
  });

  // ── src/main.tsx ──────────────────────────────────────────────────────
  files.push({
    path: "src/main.tsx",
    content: `import React from 'react';
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
`,
  });

  // ── src/App.tsx ────────────────────────────────────────────────────────
  files.push({
    path: "src/App.tsx",
    content: `import { Outlet, Link, useLocation } from 'react-router-dom';

export default function App() {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/cases', label: 'Cases' },
    { path: '/cases/new', label: 'Create Case' },
  ];

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">${appName}</h1>
        <nav className="app-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={\`nav-link \${location.pathname === item.path ? 'active' : ''}\`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
`,
  });

  // ── src/services/auth.ts ──────────────────────────────────────────────
  const authContent =
    authMethod === "OAuth 2.0"
      ? `import axios from 'axios';

const PEGA_SERVER = import.meta.env.VITE_PEGA_SERVER_URL || '${serverUrl}';
const TOKEN_URL = \`\${PEGA_SERVER}/prweb/PRRestService/oauth2/v1/token\`;

let cachedToken: string | null = null;
let tokenExpiry = 0;

export async function getAuthHeaders(): Promise<Record<string, string>> {
  if (cachedToken && Date.now() < tokenExpiry) {
    return { Authorization: \`Bearer \${cachedToken}\` };
  }

  const clientId = import.meta.env.VITE_PEGA_CLIENT_ID || '';
  const clientSecret = import.meta.env.VITE_PEGA_CLIENT_SECRET || '';

  const res = await axios.post(
    TOKEN_URL,
    new URLSearchParams({ grant_type: 'client_credentials' }),
    {
      auth: { username: clientId, password: clientSecret },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }
  );

  cachedToken = res.data.access_token;
  tokenExpiry = Date.now() + (res.data.expires_in - 60) * 1000;
  return { Authorization: \`Bearer \${cachedToken}\` };
}
`
      : `const PEGA_USERNAME = import.meta.env.VITE_PEGA_USERNAME || '';
const PEGA_PASSWORD = import.meta.env.VITE_PEGA_PASSWORD || '';

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const encoded = btoa(\`\${PEGA_USERNAME}:\${PEGA_PASSWORD}\`);
  return { Authorization: \`Basic \${encoded}\` };
}
`;

  files.push({ path: "src/services/auth.ts", content: authContent });

  // ── src/services/pega-api.ts ──────────────────────────────────────────
  files.push({
    path: "src/services/pega-api.ts",
    content: `import axios, { AxiosInstance } from 'axios';
import { getAuthHeaders } from './auth';

const PEGA_SERVER = import.meta.env.VITE_PEGA_SERVER_URL || '${serverUrl}';
const API_VERSION = '${dxApiVersion}';
const BASE_URL = \`\${PEGA_SERVER}/prweb/api/application/v\${API_VERSION}\`;

async function createClient(): Promise<AxiosInstance> {
  const headers = await getAuthHeaders();
  return axios.create({
    baseURL: BASE_URL,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}

// ── Case Types ──────────────────────────────────────────────────────
export async function getCaseTypes() {
  const client = await createClient();
  const res = await client.get('/casetypes');
  return res.data.caseTypes || [];
}

// ── Cases ───────────────────────────────────────────────────────────
export async function getCases() {
  const client = await createClient();
  const res = await client.get('/cases');
  return res.data.cases || [];
}

export async function getCaseById(caseId: string) {
  const client = await createClient();
  const res = await client.get(\`/cases/\${caseId}\`);
  return res.data;
}

export async function createCase(caseTypeId: string, content?: Record<string, unknown>) {
  const client = await createClient();
  const res = await client.post('/cases', {
    caseTypeID: caseTypeId,
    content: content || {},
  });
  return res.data;
}

// ── Assignments ─────────────────────────────────────────────────────
export async function getAssignment(assignmentId: string) {
  const client = await createClient();
  const res = await client.get(\`/assignments/\${assignmentId}\`);
  return res.data;
}

export async function submitAssignment(
  assignmentId: string,
  actionId: string,
  content: Record<string, unknown>
) {
  const client = await createClient();
  const res = await client.patch(
    \`/assignments/\${assignmentId}/actions/\${actionId}\`,
    { content }
  );
  return res.data;
}

// ── Data Views ──────────────────────────────────────────────────────
export async function getDataView(dataViewId: string, params?: Record<string, string>) {
  const client = await createClient();
  const res = await client.get(\`/data_views/\${dataViewId}\`, { params });
  return res.data;
}
`,
  });

  // ── src/pages/Dashboard.tsx ───────────────────────────────────────────
  files.push({
    path: "src/pages/Dashboard.tsx",
    content: `import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCaseTypes } from '../services/pega-api';

interface CaseType {
  ID: string;
  name: string;
}

export function Dashboard() {
  const [caseTypes, setCaseTypes] = useState<CaseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getCaseTypes()
      .then(setCaseTypes)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2>Dashboard</h2>
      <p className="subtitle">Pega Application: <strong>${pegaAppName}</strong></p>

      {loading && <p>Loading case types...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && (
        <div className="card-grid">
          {caseTypes.map((ct) => (
            <div key={ct.ID} className="card">
              <h3>{ct.name}</h3>
              <p className="card-id">{ct.ID}</p>
              <Link to="/cases/new" className="btn btn-primary">
                Create Case
              </Link>
            </div>
          ))}
          {caseTypes.length === 0 && (
            <p className="empty">No case types found. Check your Pega server connection.</p>
          )}
        </div>
      )}
    </div>
  );
}
`,
  });

  // ── src/pages/CaseList.tsx ────────────────────────────────────────────
  files.push({
    path: "src/pages/CaseList.tsx",
    content: `import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCases } from '../services/pega-api';

interface Case {
  ID: string;
  name: string;
  status: string;
  urgency: string;
}

export function CaseList() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getCases()
      .then(setCases)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header">
        <h2>Cases</h2>
        <Link to="/cases/new" className="btn btn-primary">New Case</Link>
      </div>

      {loading && <p>Loading cases...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && (
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Status</th>
              <th>Urgency</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((c) => (
              <tr key={c.ID}>
                <td>
                  <Link to={\`/cases/\${encodeURIComponent(c.ID)}\`}>{c.ID}</Link>
                </td>
                <td>{c.name}</td>
                <td><span className="badge">{c.status}</span></td>
                <td>{c.urgency}</td>
              </tr>
            ))}
            {cases.length === 0 && (
              <tr>
                <td colSpan={4} className="empty">No cases found</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
`,
  });

  // ── src/pages/CaseDetail.tsx ──────────────────────────────────────────
  files.push({
    path: "src/pages/CaseDetail.tsx",
    content: `import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCaseById } from '../services/pega-api';

export function CaseDetail() {
  const { caseId } = useParams<{ caseId: string }>();
  const [caseData, setCaseData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!caseId) return;
    getCaseById(decodeURIComponent(caseId))
      .then(setCaseData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [caseId]);

  return (
    <div>
      <Link to="/cases" className="back-link">&larr; Back to Cases</Link>

      {loading && <p>Loading case...</p>}
      {error && <p className="error">{error}</p>}

      {caseData && (
        <div className="case-detail">
          <h2>{(caseData as { name?: string }).name || caseId}</h2>

          <div className="detail-grid">
            {Object.entries(caseData).map(([key, value]) => (
              <div key={key} className="detail-row">
                <span className="detail-label">{key}</span>
                <span className="detail-value">
                  {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
`,
  });

  // ── src/pages/CreateCase.tsx ───────────────────────────────────────────
  const caseTypeList = caseTypes
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);

  files.push({
    path: "src/pages/CreateCase.tsx",
    content: `import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCaseTypes, createCase } from '../services/pega-api';

interface CaseType {
  ID: string;
  name: string;
}

export function CreateCase() {
  const navigate = useNavigate();
  const [caseTypes, setCaseTypes] = useState<CaseType[]>([]);
  const [selectedType, setSelectedType] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getCaseTypes()
      .then((types) => {
        setCaseTypes(types);
        ${caseTypeList.length > 0 ? `// Pre-configured case types: ${caseTypeList.join(", ")}` : ""}
        if (types.length > 0) setSelectedType(types[0].ID);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoadingTypes(false));
  }, []);

  async function handleCreate() {
    if (!selectedType) return;
    setLoading(true);
    setError('');
    try {
      const result = await createCase(selectedType);
      const newCaseId = result.ID || result.data?.caseInfo?.ID;
      if (newCaseId) {
        navigate(\`/cases/\${encodeURIComponent(newCaseId)}\`);
      } else {
        navigate('/cases');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create case');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2>Create New Case</h2>

      {loadingTypes && <p>Loading case types...</p>}
      {error && <p className="error">{error}</p>}

      {!loadingTypes && (
        <div className="form">
          <label htmlFor="caseType">Case Type</label>
          <select
            id="caseType"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            {caseTypes.map((ct) => (
              <option key={ct.ID} value={ct.ID}>
                {ct.name}
              </option>
            ))}
          </select>

          <button
            className="btn btn-primary"
            onClick={handleCreate}
            disabled={loading || !selectedType}
          >
            {loading ? 'Creating...' : 'Create Case'}
          </button>
        </div>
      )}
    </div>
  );
}
`,
  });

  // ── src/styles/index.css ──────────────────────────────────────────────
  files.push({
    path: "src/styles/index.css",
    content: `/* ADS Application Base Styles */
:root {
  --primary: #1b73e8;
  --primary-hover: #1557b0;
  --bg: #f8f9fa;
  --surface: #ffffff;
  --text: #1f2937;
  --text-secondary: #6b7280;
  --border: #e5e7eb;
  --error: #dc2626;
  --success: #16a34a;
  --radius: 8px;
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
}

.app { min-height: 100vh; }

.app-header {
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  gap: 2rem;
}

.app-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--primary);
}

.app-nav { display: flex; gap: 0.5rem; }

.nav-link {
  padding: 0.5rem 1rem;
  border-radius: var(--radius);
  text-decoration: none;
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
  transition: background 0.15s, color 0.15s;
}
.nav-link:hover { background: var(--bg); color: var(--text); }
.nav-link.active { background: var(--primary); color: #fff; }

.app-main { max-width: 1200px; margin: 0 auto; padding: 2rem; }

h2 { font-size: 1.5rem; margin-bottom: 1rem; }

.subtitle { color: var(--text-secondary); margin-bottom: 1.5rem; }

.card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }

.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.5rem;
}
.card h3 { margin-bottom: 0.5rem; }
.card-id { font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 1rem; font-family: monospace; }

.btn {
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: var(--radius);
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  cursor: pointer;
  transition: background 0.15s;
}
.btn:hover { background: var(--bg); }
.btn-primary { background: var(--primary); color: #fff; border-color: var(--primary); }
.btn-primary:hover { background: var(--primary-hover); }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }

.data-table { width: 100%; border-collapse: collapse; background: var(--surface); border-radius: var(--radius); overflow: hidden; border: 1px solid var(--border); }
.data-table th, .data-table td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid var(--border); }
.data-table th { font-size: 0.75rem; text-transform: uppercase; color: var(--text-secondary); background: var(--bg); }
.data-table td a { color: var(--primary); text-decoration: none; }

.badge { font-size: 0.75rem; padding: 0.2rem 0.6rem; background: var(--bg); border-radius: 999px; }

.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }

.error { color: var(--error); padding: 0.75rem; background: #fef2f2; border-radius: var(--radius); margin-bottom: 1rem; }
.empty { color: var(--text-secondary); text-align: center; padding: 2rem; }
.back-link { color: var(--primary); text-decoration: none; display: inline-block; margin-bottom: 1rem; }

.case-detail { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.5rem; }
.detail-grid { display: grid; gap: 0.5rem; margin-top: 1rem; }
.detail-row { display: grid; grid-template-columns: 200px 1fr; gap: 1rem; padding: 0.5rem 0; border-bottom: 1px solid var(--border); }
.detail-label { font-weight: 600; font-size: 0.875rem; color: var(--text-secondary); }
.detail-value { font-size: 0.875rem; word-break: break-all; }

.form { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.5rem; max-width: 500px; display: flex; flex-direction: column; gap: 1rem; }
.form label { font-weight: 600; font-size: 0.875rem; }
.form select, .form input {
  padding: 0.5rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 0.875rem;
}
`,
  });

  // ── .env.example ──────────────────────────────────────────────────────
  const envLines = [`VITE_PEGA_SERVER_URL=${serverUrl}`];
  if (authMethod === "OAuth 2.0") {
    envLines.push(
      "VITE_PEGA_AUTH_METHOD=oauth",
      "VITE_PEGA_CLIENT_ID=",
      "VITE_PEGA_CLIENT_SECRET="
    );
  } else {
    envLines.push(
      "VITE_PEGA_AUTH_METHOD=basic",
      "VITE_PEGA_USERNAME=",
      "VITE_PEGA_PASSWORD="
    );
  }
  files.push({ path: ".env.example", content: envLines.join("\n") + "\n" });

  // ── README.md ─────────────────────────────────────────────────────────
  files.push({
    path: "README.md",
    content: `# ${appName}

Alternate Design System application connecting to **${pegaAppName}** via Pega DX API v${dxApiVersion}.

## Getting Started

\`\`\`bash
npm install
cp .env.example .env   # fill in your Pega credentials
npm run dev
\`\`\`

## Pega DX API Endpoints Used

| Endpoint | Description |
|----------|-------------|
| GET /casetypes | List available case types |
| GET /cases | List cases |
| POST /cases | Create a new case |
| GET /cases/{id} | Get case details |
| GET /assignments/{id} | Get assignment |
| PATCH /assignments/{id}/actions/{actionId} | Submit assignment |
| GET /data_views/{id} | Query data view |

## Project Structure

\`\`\`
src/
  services/
    auth.ts         — ${authMethod} authentication
    pega-api.ts     — Pega DX API client
  pages/
    Dashboard.tsx   — Case type overview
    CaseList.tsx    — List all cases
    CaseDetail.tsx  — Single case view
    CreateCase.tsx  — Create new case
  styles/
    index.css       — Base styles
  App.tsx           — Root layout with navigation
  main.tsx          — Entry point with routing
\`\`\`
`,
  });

  // ── src/vite-env.d.ts ─────────────────────────────────────────────────
  files.push({
    path: "src/vite-env.d.ts",
    content: `/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PEGA_SERVER_URL: string;
  readonly VITE_PEGA_AUTH_METHOD: string;
  readonly VITE_PEGA_USERNAME: string;
  readonly VITE_PEGA_PASSWORD: string;
  readonly VITE_PEGA_CLIENT_ID: string;
  readonly VITE_PEGA_CLIENT_SECRET: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
`,
  });

  return files;
}
