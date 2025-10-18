export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function getModels(params: Record<string, string | number> = {}) {
  const qs = new URLSearchParams(params as Record<string, string>).toString();
  const url = `${API_BASE}/api/v1/models${qs ? `?${qs}` : ''}`;
  const res = await fetch(url);
  return json<{ items: any[]; total: number }>(res);
}

export async function getModel(id: string) {
  const res = await fetch(`${API_BASE}/api/v1/models/${id}`);
  return json<any>(res);
}

export async function runModel(id: string, body: any) {
  const res = await fetch(`${API_BASE}/api/v1/models/${id}/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return json<any>(res);
}

export async function getJob(jobId: string) {
  const res = await fetch(`${API_BASE}/api/v1/jobs/${jobId}`);
  return json<any>(res);
}

export async function getUser() {
  const res = await fetch(`${API_BASE}/api/v1/auth/me`, { credentials: 'include' as any });
  return json<any>(res);
}

