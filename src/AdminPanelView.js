import { useEffect, useMemo, useRef, useState } from 'react';
import './AdminPanelView.css';
import { deleteExamSessionByIdentity, fetchExamSessions, upsertExamSession } from './supabaseApi';
import { io } from 'socket.io-client';
import { LIVE_BACKEND_URL } from './liveBackend';

const ADMIN_CREDENTIALS_KEY = 'itcenter-admin-credentials';
const ADMIN_AUTH_SESSION_KEY = 'itcenter-admin-auth-session';
const ADMIN_RESET_KEY = 'itcenter-admin-reset';

const defaultCredentials = {
  login: 'admin',
  password: 'Admin123!',
  phone: '+998901234567',
};

const readJson = (key, fallback) => {
  const rawValue = localStorage.getItem(key);

  if (!rawValue) {
    return fallback;
  }

  try {
    return JSON.parse(rawValue);
  } catch (error) {
    return fallback;
  }
};

const readCredentials = () => {
  const stored = readJson(ADMIN_CREDENTIALS_KEY, null);

  if (stored?.login && stored?.password && stored?.phone) {
    return stored;
  }

  localStorage.setItem(ADMIN_CREDENTIALS_KEY, JSON.stringify(defaultCredentials));
  return defaultCredentials;
};

const statusLabels = {
  face: 'Yuz tasdiqlash',
  phone: 'Telefon kiritmoqda',
  instructions: "Ko'rsatmada",
  in_progress: 'Testda',
  completed: 'Yakunlangan',
  blocked: 'Bloklangan',
  terminated: "To'xtatilgan",
  force_ended: 'Admin tugatgan',
};

const deletableStatuses = new Set(['completed', 'blocked', 'terminated', 'force_ended']);
const socketOptions = {
  transports: ['polling'],
  upgrade: false,
};

function AdminPanelView() {
  const [sessions, setSessions] = useState([]);
  const [liveSessions, setLiveSessions] = useState([]);
  const socketRef = useRef(null);
  const [credentials, setCredentials] = useState(() => readCredentials());
  const [isAuthenticated, setIsAuthenticated] = useState(() => readJson(ADMIN_AUTH_SESSION_KEY, false) === true);
  const [loginForm, setLoginForm] = useState({ login: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [resetStep, setResetStep] = useState('idle');
  const [resetForm, setResetForm] = useState({
    login: '',
    phone: '',
    code: '',
    newPassword: '',
  });
  const [resetMessage, setResetMessage] = useState('');

  useEffect(() => {
    const syncSessions = async () => {
      try {
        const remoteSessions = await fetchExamSessions();
        console.log('[admin] supabase sessions fetched', remoteSessions);
        setSessions(
          remoteSessions.map((item) => ({
            identity: item.identity_key,
            name: item.name,
            surname: item.surname,
            phone: item.phone,
            status: item.status,
            score: item.score,
            totalQuestions: item.total_questions,
            reason: item.reason,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
            startedAt: item.started_at,
            finishedAt: item.finished_at,
          }))
        );
      } catch (error) {
        console.error('Failed to fetch sessions from Supabase:', error);
      }
    };

    syncSessions();
    const intervalId = window.setInterval(syncSessions, 1200);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      return undefined;
    }

    const socket = io(LIVE_BACKEND_URL, socketOptions);
    socketRef.current = socket;

    socket.on('live:sessions', (items) => {
      console.log('[admin] live sessions received', items);
      setLiveSessions(Array.isArray(items) ? items : []);
    });

    socket.on('connect', () => {
      console.log('[admin] socket connected', { backend: LIVE_BACKEND_URL });
    });

    return () => {
      console.log('[admin] socket disconnected');
      socketRef.current = null;
      socket.disconnect();
    };
  }, [isAuthenticated]);

  const mergedSessions = useMemo(() => {
    const merged = new Map();

    sessions.forEach((item) => {
      merged.set(item.identity, item);
    });

    liveSessions.forEach((item) => {
      const previous = merged.get(item.identity) || {};
      merged.set(item.identity, {
        ...previous,
        identity: item.identity,
        name: item.name || previous.name || '',
        surname: item.surname || previous.surname || '',
        phone: item.phone || previous.phone || '',
        status: item.status || previous.status || 'in_progress',
        snapshot: item.snapshot || previous.snapshot || '',
        updatedAt: item.updatedAt || previous.updatedAt || new Date().toISOString(),
      });
    });

    return Array.from(merged.values()).sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
  }, [liveSessions, sessions]);

  const activeLiveSessions = useMemo(
    () =>
      liveSessions
        .filter((item) => item.connected !== false)
        .map((item) => {
          const previous = sessions.find((session) => session.identity === item.identity) || {};
          return {
            ...previous,
            identity: item.identity,
            name: item.name || previous.name || '',
            surname: item.surname || previous.surname || '',
            phone: item.phone || previous.phone || '',
            status: item.status || previous.status || 'in_progress',
            snapshot: item.snapshot || previous.snapshot || '',
            updatedAt: item.updatedAt || previous.updatedAt || new Date().toISOString(),
          };
        })
        .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)),
    [liveSessions, sessions]
  );

  const stats = useMemo(() => {
    const active = activeLiveSessions.length;
    const completed = mergedSessions.filter((item) => item.status === 'completed').length;
    const interrupted = mergedSessions.filter((item) => item.status === 'terminated' || item.status === 'force_ended').length;
    const scored = mergedSessions.filter((item) => typeof item.score === 'number');
    const averageScore = scored.length
      ? (scored.reduce((sum, item) => sum + item.score, 0) / scored.length).toFixed(1)
      : '0.0';

    return {
      total: mergedSessions.length,
      active,
      completed,
      interrupted,
      averageScore,
    };
  }, [activeLiveSessions.length, mergedSessions]);

  const handleTerminate = (identity) => {
    const currentSession = mergedSessions.find((item) => item.identity === identity);

    if (!currentSession) {
      console.log('[admin] terminate skipped, session not found', { identity });
      return;
    }

    socketRef.current?.emit('admin:terminate', { identity });
    console.log('[admin] terminate emitted', { identity });

    setSessions((current) =>
      current.map((item) =>
        item.identity === identity
          ? {
              ...item,
              status: 'force_ended',
              reason: 'Admin tomonidan imtihon yakunlandi.',
              finishedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          : item
      )
    );

    
    upsertExamSession({
      identity_key: currentSession.identity,
      name: currentSession.name,
      surname: currentSession.surname,
      phone: currentSession.phone || null,
      status: 'force_ended',
      score: typeof currentSession.score === 'number' ? currentSession.score : null,
      total_questions: typeof currentSession.totalQuestions === 'number' ? currentSession.totalQuestions : null,
      reason: 'Admin tomonidan imtihon yakunlandi.',
      created_at: currentSession.createdAt,
      updated_at: new Date().toISOString(),
      started_at: currentSession.startedAt || null,
      finished_at: new Date().toISOString(),
    }).catch((error) => {
      console.error('Failed to update session in Supabase:', error);
    });
  };

  const handleDelete = async (identity) => {
    const currentSession = mergedSessions.find((item) => item.identity === identity);

    if (!currentSession) {
      console.log('[admin] delete skipped, session not found', { identity });
      return;
    }

    if (!deletableStatuses.has(currentSession.status)) {
      window.alert("Aktiv qatnashuvchini o'chirib bo'lmaydi. Avval testni yakunlang.");
      return;
    }

    const shouldDelete = window.confirm(
      `${currentSession.name} ${currentSession.surname} yozuvini bazadan o'chirmoqchimisiz?`
    );

    if (!shouldDelete) {
      return;
    }

    try {
      socketRef.current?.emit('admin:delete', { identity });
      console.log('[admin] delete emitted', { identity });
      await deleteExamSessionByIdentity(identity);
      setSessions((current) => current.filter((item) => item.identity !== identity));
      setLiveSessions((current) => current.filter((item) => item.identity !== identity));
    } catch (error) {
      console.error('Failed to delete session from Supabase:', error);
      window.alert("Yozuvni o'chirib bo'lmadi. Supabase delete policy tekshiring.");
    }
  };

  const handleLoginSubmit = (event) => {
    event.preventDefault();

    if (loginForm.login === credentials.login && loginForm.password === credentials.password) {
      setIsAuthenticated(true);
      localStorage.setItem(ADMIN_AUTH_SESSION_KEY, JSON.stringify(true));
      setLoginError('');
      return;
    }

    setLoginError("Login yoki parol noto'g'ri.");
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.setItem(ADMIN_AUTH_SESSION_KEY, JSON.stringify(false));
  };

  const handleResetRequest = (event) => {
    event.preventDefault();

    if (resetForm.login !== credentials.login || resetForm.phone !== credentials.phone) {
      setResetMessage("Login yoki telefon raqam mos kelmadi.");
      return;
    }

    const code = `${Math.floor(1000 + Math.random() * 9000)}`;
    localStorage.setItem(ADMIN_RESET_KEY, JSON.stringify({ code, issuedAt: new Date().toISOString() }));
    setResetStep('verify');
    setResetMessage(`Demo SMS kod yuborildi: ${code}`);
  };

  const handleResetConfirm = (event) => {
    event.preventDefault();

    const resetState = readJson(ADMIN_RESET_KEY, null);

    if (!resetState?.code || resetState.code !== resetForm.code) {
      setResetMessage("SMS kod noto'g'ri.");
      return;
    }

    if (resetForm.newPassword.trim().length < 6) {
      setResetMessage("Yangi parol kamida 6 ta belgidan iborat bo'lsin.");
      return;
    }

    const nextCredentials = {
      ...credentials,
      password: resetForm.newPassword.trim(),
    };

    localStorage.setItem(ADMIN_CREDENTIALS_KEY, JSON.stringify(nextCredentials));
    localStorage.removeItem(ADMIN_RESET_KEY);
    setCredentials(nextCredentials);
    setResetStep('idle');
    setResetMessage("Parol yangilandi. Endi yangi parol bilan kiring.");
    setResetForm({ login: '', phone: '', code: '', newPassword: '' });
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-auth">
        <a className="admin-view__back" href="/">
          Test oynasiga qaytish
        </a>

        <section className="admin-auth__card">
          <p className="admin-view__eyebrow">Admin kirish</p>
          <h1>Admin panel himoyalangan</h1>
          <p className="admin-auth__copy">
            Faqat admin login va parol bilan kiradi. Agar parol esdan chiqsa, telefon raqam orqali tiklanadi.
          </p>

          <form className="admin-auth__form" onSubmit={handleLoginSubmit}>
            <label>
              Login
              <input
                id="admin-login"
                name="admin_login"
                type="text"
                value={loginForm.login}
                onChange={(event) => setLoginForm((current) => ({ ...current, login: event.target.value }))}
                placeholder="admin"
                required
              />
            </label>
            <label>
              Parol
              <input
                id="admin-password"
                name="admin_password"
                type="password"
                value={loginForm.password}
                onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
                placeholder="Parol"
                required
              />
            </label>
            {loginError ? <p className="admin-auth__error">{loginError}</p> : null}
            <button className="admin-auth__submit" type="submit">
              Kirish
            </button>
          </form>

          <div className="admin-reset">
            <button className="admin-reset__toggle" type="button" onClick={() => setResetStep((current) => (current === 'idle' ? 'request' : 'idle'))}>
              Parolni unutdim
            </button>

            {resetStep === 'request' ? (
              <form className="admin-auth__form" onSubmit={handleResetRequest}>
                <label>
                  Admin login
                  <input
                    id="admin-reset-login"
                    name="admin_reset_login"
                    type="text"
                    value={resetForm.login}
                    onChange={(event) => setResetForm((current) => ({ ...current, login: event.target.value }))}
                    placeholder="admin"
                    required
                  />
                </label>
                <label>
                  Telefon raqam
                  <input
                    id="admin-reset-phone"
                    name="admin_reset_phone"
                    type="text"
                    value={resetForm.phone}
                    onChange={(event) => setResetForm((current) => ({ ...current, phone: event.target.value }))}
                    placeholder="+998901234567"
                    required
                  />
                </label>
                <button className="admin-auth__submit" type="submit">
                  SMS kod yuborish
                </button>
              </form>
            ) : null}

            {resetStep === 'verify' ? (
              <form className="admin-auth__form" onSubmit={handleResetConfirm}>
                <label>
                  SMS kod
                  <input
                    id="admin-reset-code"
                    name="admin_reset_code"
                    type="text"
                    value={resetForm.code}
                    onChange={(event) => setResetForm((current) => ({ ...current, code: event.target.value }))}
                    placeholder="1234"
                    required
                  />
                </label>
                <label>
                  Yangi parol
                  <input
                    id="admin-reset-password"
                    name="admin_reset_password"
                    type="password"
                    value={resetForm.newPassword}
                    onChange={(event) => setResetForm((current) => ({ ...current, newPassword: event.target.value }))}
                    placeholder="Yangi parol"
                    required
                  />
                </label>
                <button className="admin-auth__submit" type="submit">
                  Parolni yangilash
                </button>
              </form>
            ) : null}

            {resetMessage ? <p className="admin-auth__hint">{resetMessage}</p> : null}
          </div>

          <div className="admin-auth__defaults">
            <p>Standart login: <strong>{credentials.login}</strong></p>
            <p>Standart telefon: <strong>{credentials.phone}</strong></p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="admin-view">
      <a className="admin-view__back" href="/">
        Test oynasiga qaytish
      </a>
      <button className="admin-view__logout" type="button" onClick={handleLogout}>
        Chiqish
      </button>

      <section className="admin-view__hero">
        <p className="admin-view__eyebrow">Admin panel</p>
        <h1>Barcha qatnashuvchilar nazorati</h1>
        <p>
          Tepadagi jadvalda faqat hozir jonli qatnashayotganlar chiqadi. Pastdagi jadvalda esa bazadagi barcha
          yozuvlar saqlanadi.
        </p>
      </section>

      <section className="admin-view__stats">
        <article className="admin-stat">
          <p>Jami</p>
          <strong>{stats.total}</strong>
        </article>
        <article className="admin-stat">
          <p>Hozir testda</p>
          <strong>{stats.active}</strong>
        </article>
        <article className="admin-stat">
          <p>Yakunlangan</p>
          <strong>{stats.completed}</strong>
        </article>
        <article className="admin-stat">
          <p>To&apos;xtatilgan</p>
          <strong>{stats.interrupted}</strong>
        </article>
        <article className="admin-stat">
          <p>O&apos;rtacha natija</p>
          <strong>{stats.averageScore}</strong>
        </article>
      </section>

      <section className="admin-table-card">
        <div className="admin-table-card__head">
          <div>
            <h2>Jonli qatnashuvchilar</h2>
            <p>{activeLiveSessions.length} ta jonli qatnashuvchi</p>
          </div>
        </div>

        {activeLiveSessions.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Ism familiya</th>
                  <th>Kamera</th>
                  <th>Telefon</th>
                  <th>Holat</th>
                  <th>Natija</th>
                  <th>Yangilandi</th>
                  <th>Amal</th>
                </tr>
              </thead>
              <tbody>
                {activeLiveSessions.map((item) => (
                  <tr key={item.identity}>
                    <td>
                      <strong>{item.name} {item.surname}</strong>
                    </td>
                    <td>
                      {item.snapshot ? (
                        <img className="admin-camera-preview" src={item.snapshot} alt={`${item.name} ${item.surname}`} />
                      ) : (
                        <span className="admin-muted">Kamera oqimi yo&apos;q</span>
                      )}
                    </td>
                    <td>{item.phone || 'Kiritilmagan'}</td>
                    <td>
                      <span className={`admin-status admin-status--${item.status}`}>
                        {statusLabels[item.status] || item.status}
                      </span>
                    </td>
                    <td>
                      {typeof item.score === 'number' && typeof item.totalQuestions === 'number'
                        ? `${item.score}/${item.totalQuestions}`
                        : '-'}
                    </td>
                    <td>{item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '-'}</td>
                      <td>
                        <div className="admin-actions">
                          {item.status === 'in_progress' ? (
                            <button className="admin-danger" type="button" onClick={() => handleTerminate(item.identity)}>
                              Yakunlash
                            </button>
                          ) : (
                            <span className="admin-muted">Amal yo&apos;q</span>
                          )}
                          {deletableStatuses.has(item.status) ? (
                            <button className="admin-delete" type="button" onClick={() => handleDelete(item.identity)}>
                              Delete
                            </button>
                          ) : (
                            <span className="admin-muted">Delete yopiq</span>
                          )}
                        </div>
                      </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="admin-empty">
            <h3>Hozircha jonli qatnashuvchi yo&apos;q</h3>
            <p>Foydalanuvchi testni boshlab `Exam` bosqichiga kirsa, shu yerda darhol ko&apos;rinadi.</p>
          </div>
        )}
      </section>

      <section className="admin-table-card">
        <div className="admin-table-card__head">
          <div>
            <h2>Barcha yozuvlar</h2>
            <p>{mergedSessions.length} ta jami yozuv</p>
          </div>
        </div>

        {mergedSessions.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Ism familiya</th>
                  <th>Kamera</th>
                  <th>Telefon</th>
                  <th>Holat</th>
                  <th>Natija</th>
                  <th>Yangilandi</th>
                  <th>Amal</th>
                </tr>
              </thead>
              <tbody>
                {mergedSessions.map((item) => (
                  <tr key={`archive-${item.identity}`}>
                    <td>
                      <strong>{item.name} {item.surname}</strong>
                    </td>
                    <td>
                      {item.snapshot ? (
                        <img className="admin-camera-preview" src={item.snapshot} alt={`${item.name} ${item.surname}`} />
                      ) : (
                        <span className="admin-muted">Kamera oqimi yo&apos;q</span>
                      )}
                    </td>
                    <td>{item.phone || 'Kiritilmagan'}</td>
                    <td>
                      <span className={`admin-status admin-status--${item.status}`}>
                        {statusLabels[item.status] || item.status}
                      </span>
                    </td>
                    <td>
                      {typeof item.score === 'number' && typeof item.totalQuestions === 'number'
                        ? `${item.score}/${item.totalQuestions}`
                        : '-'}
                    </td>
                    <td>{item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '-'}</td>
                    <td>
                      <div className="admin-actions">
                        {item.status === 'in_progress' ? (
                          <button className="admin-danger" type="button" onClick={() => handleTerminate(item.identity)}>
                            Yakunlash
                          </button>
                        ) : (
                          <span className="admin-muted">Amal yo&apos;q</span>
                        )}
                        {deletableStatuses.has(item.status) ? (
                          <button className="admin-delete" type="button" onClick={() => handleDelete(item.identity)}>
                            Delete
                          </button>
                        ) : (
                          <span className="admin-muted">Delete yopiq</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="admin-empty">
            <h3>Hozircha yozuv yo&apos;q</h3>
            <p>Test sessiyalari paydo bo&apos;lishi bilan shu yerda saqlanadi.</p>
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminPanelView;
