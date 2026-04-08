const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 4000;

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  maxHttpBufferSize: 2e6,
});

const participantSockets = new Map();
const liveSessions = new Map();
const SUPABASE_URL = 'https://mjbhddbyapjkojgdqygb.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_IWQZbXuWTNqZQl9q3tNqBA_Hk16RI7W';
const EXAM_SESSIONS_ENDPOINT = `${SUPABASE_URL}/rest/v1/exam_sessions`;

const serializeSessions = () =>
  Array.from(liveSessions.values()).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

const broadcastSessions = () => {
  io.emit('live:sessions', serializeSessions());
};

const supabaseRequest = async (path = '', options = {}) => {
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
    throw new Error(errorText || 'Supabase proxy request failed');
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

const upsertSession = (payload = {}, socketId) => {
  const identity = payload.identity;

  if (!identity) {
    return;
  }

  const previous = liveSessions.get(identity) || {};
  const next = {
    identity,
    name: payload.name ?? previous.name ?? '',
    surname: payload.surname ?? previous.surname ?? '',
    phone: payload.phone ?? previous.phone ?? '',
    status: payload.status ?? previous.status ?? 'in_progress',
    snapshot: payload.snapshot ?? previous.snapshot ?? '',
    connected: payload.connected ?? true,
    createdAt: previous.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    socketId,
  };

  liveSessions.set(identity, next);
  participantSockets.set(identity, socketId);
  broadcastSessions();
};

const removeSession = (identity) => {
  if (!identity) {
    return;
  }

  participantSockets.delete(identity);
  liveSessions.delete(identity);
  broadcastSessions();
};

app.get('/health', (_req, res) => {
  res.json({ ok: true, sessions: serializeSessions().length });
});

app.get('/api/sessions', async (_req, res) => {
  try {
    const data = await supabaseRequest('?select=*&order=updated_at.desc', { method: 'GET' });
    res.json(data);
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

app.get('/api/sessions/:identity', async (req, res) => {
  try {
    const data = await supabaseRequest(`?select=*&identity_key=eq.${encodeURIComponent(req.params.identity)}&limit=1`, {
      method: 'GET',
    });
    res.json(Array.isArray(data) && data.length ? data[0] : null);
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

app.post('/api/sessions', async (req, res) => {
  try {
    const data = await supabaseRequest('?on_conflict=identity_key', {
      method: 'POST',
      headers: {
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify(req.body),
    });
    res.json(data);
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

app.delete('/api/sessions/:identity', async (req, res) => {
  try {
    await supabaseRequest(`?identity_key=eq.${encodeURIComponent(req.params.identity)}`, {
      method: 'DELETE',
      headers: {
        Prefer: 'return=minimal',
      },
    });
    res.status(204).end();
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

io.on('connection', (socket) => {
  socket.on('participant:join', (payload) => {
    upsertSession({ ...payload, connected: true }, socket.id);
  });

  socket.on('participant:update', (payload) => {
    upsertSession(payload, socket.id);
  });

  socket.on('participant:snapshot', (payload) => {
    upsertSession(payload, socket.id);
  });

  socket.on('participant:leave', ({ identity }) => {
    const current = liveSessions.get(identity);
    if (!current) {
      return;
    }

    liveSessions.set(identity, {
      ...current,
      connected: false,
      updatedAt: new Date().toISOString(),
    });
    broadcastSessions();
  });

  socket.on('admin:terminate', ({ identity }) => {
    const socketId = participantSockets.get(identity);
    if (socketId) {
      io.to(socketId).emit('control:terminate', { identity });
    }

    const current = liveSessions.get(identity);
    if (current) {
      liveSessions.set(identity, {
        ...current,
        status: 'force_ended',
        updatedAt: new Date().toISOString(),
      });
      broadcastSessions();
    }
  });

  socket.on('admin:delete', ({ identity }) => {
    const socketId = participantSockets.get(identity);
    if (socketId) {
      io.to(socketId).emit('control:delete', { identity });
    }

    removeSession(identity);
  });

  socket.on('disconnect', () => {
    const disconnectedIdentity = Array.from(participantSockets.entries()).find(([, socketId]) => socketId === socket.id)?.[0];

    if (!disconnectedIdentity) {
      return;
    }

    const current = liveSessions.get(disconnectedIdentity);
    if (current) {
      liveSessions.set(disconnectedIdentity, {
        ...current,
        connected: false,
        updatedAt: new Date().toISOString(),
      });
      broadcastSessions();
    }
  });

  socket.emit('live:sessions', serializeSessions());
});

server.listen(PORT, () => {
  console.log(`Live backend listening on http://localhost:${PORT}`);
});
