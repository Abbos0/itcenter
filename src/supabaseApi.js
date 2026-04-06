const SUPABASE_URL = 'https://mjbhddbyapjkojgdqygb.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_IWQZbXuWTNqZQl9q3tNqBA_Hk16RI7W';
const EXAM_SESSIONS_ENDPOINT = `${SUPABASE_URL}/rest/v1/exam_sessions`;

const request = async (path = '', options = {}) => {
  const response = await fetch(`${EXAM_SESSIONS_ENDPOINT}${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
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
  request('?on_conflict=identity_key', {
    method: 'POST',
    headers: {
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify(payload),
  });

export const fetchExamSessions = async () =>
  request('?select=*&order=updated_at.desc', {
    method: 'GET',
  });

export const fetchExamSessionByIdentity = async (identityKey) => {
  const data = await request(`?select=*&identity_key=eq.${encodeURIComponent(identityKey)}&limit=1`, {
    method: 'GET',
  });

  return Array.isArray(data) && data.length ? data[0] : null;
};

export const deleteExamSessionByIdentity = async (identityKey) =>
  request(`?identity_key=eq.${encodeURIComponent(identityKey)}`, {
    method: 'DELETE',
    headers: {
      Prefer: 'return=minimal',
    },
  });
