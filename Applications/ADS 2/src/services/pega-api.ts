import axios, { AxiosInstance } from 'axios';
import { getAuthHeaders } from './auth';

const PEGA_SERVER = import.meta.env.VITE_PEGA_SERVER_URL || 'https://areteans-i25-plf.pegatsdemo.com/';
const API_VERSION = '24.1';
const BASE_URL = `${PEGA_SERVER}/prweb/api/application/v${API_VERSION}`;

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
  const res = await client.get(`/cases/${caseId}`);
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
  const res = await client.get(`/assignments/${assignmentId}`);
  return res.data;
}

export async function submitAssignment(
  assignmentId: string,
  actionId: string,
  content: Record<string, unknown>
) {
  const client = await createClient();
  const res = await client.patch(
    `/assignments/${assignmentId}/actions/${actionId}`,
    { content }
  );
  return res.data;
}

// ── Data Views ──────────────────────────────────────────────────────
export async function getDataView(dataViewId: string, params?: Record<string, string>) {
  const client = await createClient();
  const res = await client.get(`/data_views/${dataViewId}`, { params });
  return res.data;
}
