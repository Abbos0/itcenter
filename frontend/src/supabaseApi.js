import { LIVE_BACKEND_URL } from './liveBackend';

const EXAM_SESSIONS_ENDPOINT = `${LIVE_BACKEND_URL}/api/sessions`;
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://mjbhddbyapjkojgdqygb.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'sb_publishable_IWQZbXuWTNqZQl9q3tNqBA_Hk16RI7W';
const DIRECT_EXAM_SESSIONS_ENDPOINT = `${SUPABASE_URL}/rest/v1/exam_sessions`;

const requestJson = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    const error = new Error(errorText || 'Supabase request failed');
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

const directRequest = async (path = '', options = {}) =>
  requestJson(`${DIRECT_EXAM_SESSIONS_ENDPOINT}${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
      ...(options.headers || {}),
    },
  });

const backendRequest = async (path = '', options = {}) =>
  requestJson(`${EXAM_SESSIONS_ENDPOINT}${path}`, options);

const request = async (path = '', options = {}, directPath = path, directOptions = options) => {
  const preferDirect =
    typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

  const primaryRequest = preferDirect
    ? () => directRequest(directPath, directOptions)
    : () => backendRequest(path, options);
  const fallbackRequest = preferDirect
    ? () => backendRequest(path, options)
    : () => directRequest(directPath, directOptions);

  try {
    return await primaryRequest();
  } catch (primaryError) {
    try {
      return await fallbackRequest();
    } catch (_fallbackError) {
      throw primaryError;
    }
  }
};

export const upsertExamSession = async (payload) =>
  request(
    '',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    '?on_conflict=identity_key',
    {
      method: 'POST',
      headers: {
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify(payload),
    }
  );

export const fetchExamSessions = async () =>
  request(
    '',
    {
      method: 'GET',
    },
    '?select=*&order=updated_at.desc',
    {
      method: 'GET',
    }
  );

export const fetchExamSessionByIdentity = async (identityKey) => {
  const data = await request(
    `/${encodeURIComponent(identityKey)}`,
    {
      method: 'GET',
    },
    `?select=*&identity_key=eq.${encodeURIComponent(identityKey)}&limit=1`,
    {
      method: 'GET',
    }
  );

  return Array.isArray(data) ? data[0] || null : data;
};

export const deleteExamSessionByIdentity = async (identityKey) =>
  request(
    `/${encodeURIComponent(identityKey)}`,
    {
      method: 'DELETE',
    },
    `?identity_key=eq.${encodeURIComponent(identityKey)}`,
    {
      method: 'DELETE',
      headers: {
        Prefer: 'return=minimal',
      },
    }
  );
