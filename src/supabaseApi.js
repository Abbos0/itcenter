import { LIVE_BACKEND_URL } from './liveBackend';

const EXAM_SESSIONS_ENDPOINT = `${LIVE_BACKEND_URL}/api/sessions`;

const request = async (path = '', options = {}) => {
  const response = await fetch(`${EXAM_SESSIONS_ENDPOINT}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Supabase request failed');
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

export const upsertExamSession = async (payload) =>
  request('', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const fetchExamSessions = async () =>
  request('', {
    method: 'GET',
  });

export const fetchExamSessionByIdentity = async (identityKey) => {
  const data = await request(`/${encodeURIComponent(identityKey)}`, {
    method: 'GET',
  });

  return data;
};

export const deleteExamSessionByIdentity = async (identityKey) =>
  request(`/${encodeURIComponent(identityKey)}`, {
    method: 'DELETE',
  });
