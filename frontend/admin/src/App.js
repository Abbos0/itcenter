import { useEffect, useMemo, useState } from 'react';
import './App.css';

const ADMIN_SESSIONS_KEY = 'itcenter-admin-sessions';
const ADMIN_CONTROL_KEY = 'itcenter-admin-control';

const readSessions = () => {
  const rawValue = localStorage.getItem(ADMIN_SESSIONS_KEY);

  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

const statusLabels = {
  face: 'Yuz tasdiqlash',
  phone: 'Telefon kiritmoqda',
  instructions: "Ko'rsatma oynasida",
  in_progress: 'Testda qatnashmoqda',
  completed: 'Yakunlangan',
  terminated: "To'xtatilgan",
  force_ended: 'Admin tugatgan',
};

function App() {
  const [sessions, setSessions] = useState(() => readSessions());

  useEffect(() => {
    const syncSessions = () => {
      setSessions(readSessions());
    };

    const intervalId = window.setInterval(syncSessions, 1500);
    window.addEventListener('storage', syncSessions);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('storage', syncSessions);
    };
  }, []);

  const stats = useMemo(() => {
    const active = sessions.filter((item) => item.status === 'in_progress').length;
    const completed = sessions.filter((item) => item.status === 'completed').length;
    const interrupted = sessions.filter((item) => item.status === 'terminated' || item.status === 'force_ended').length;
    const withScore = sessions.filter((item) => typeof item.score === 'number');
    const averageScore = withScore.length
      ? (withScore.reduce((sum, item) => sum + item.score, 0) / withScore.length).toFixed(1)
      : '0.0';

    return [
      { label: 'Jami talabgorlar', value: sessions.length },
      { label: 'Hozir testda', value: active },
      { label: 'Yakunlanganlar', value: completed },
      { label: "O'rtacha natija", value: averageScore },
      { label: "To'xtatilganlar", value: interrupted },
    ];
  }, [sessions]);

  const handleTerminate = (identity) => {
    localStorage.setItem(
      ADMIN_CONTROL_KEY,
      JSON.stringify({
        action: 'terminate',
        identity,
        issuedAt: new Date().toISOString(),
      })
    );

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
  };

  const scoredSessions = sessions.filter((item) => typeof item.score === 'number');

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div>
          <p className="admin-sidebar__eyebrow">IT Center</p>
          <h1>Admin Panel</h1>
          <p className="admin-sidebar__copy">Imtihon nazorati, statistikalar va tezkor yakunlash boshqaruvi.</p>
        </div>
        <nav className="admin-nav">
          <a href="#dashboard">Dashboard</a>
          <a href="#live">Jonli nazorat</a>
          <a href="#results">Natijalar</a>
        </nav>
      </aside>

      <main className="admin-main">
        <section className="hero-card" id="dashboard">
          <p className="hero-card__eyebrow">Boshqaruv markazi</p>
          <h2>Barcha qatnashuvchilar bir ekranda</h2>
          <p className="hero-card__copy">
            Admin panel login bosqichi, telefon tekshiruvi, aktiv test, yakunlangan natija va admin to'xtatgan
            sessiyalarni ko'rsatadi.
          </p>
        </section>

        <section className="stats-grid">
          {stats.map((item) => (
            <article className="stat-card" key={item.label}>
              <p>{item.label}</p>
              <strong>{item.value}</strong>
            </article>
          ))}
        </section>

        <section className="panel-card" id="live">
          <div className="panel-card__head">
            <div>
              <h3>Jonli qatnashuvchilar</h3>
              <p>{sessions.length} ta yozuv kuzatilyapti</p>
            </div>
          </div>

          {sessions.length ? (
            <div className="table-wrap">
              <table className="session-table">
                <thead>
                  <tr>
                    <th>Ism familiya</th>
                    <th>Telefon</th>
                    <th>Holat</th>
                    <th>Natija</th>
                    <th>Yangilandi</th>
                    <th>Amal</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((item) => (
                    <tr key={item.identity}>
                      <td>
                        <strong>{item.name} {item.surname}</strong>
                      </td>
                      <td>{item.phone || 'Kiritilmagan'}</td>
                      <td>
                        <span className={`status-badge status-badge--${item.status}`}>
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
                        {item.status === 'in_progress' ? (
                          <button className="danger-btn" type="button" onClick={() => handleTerminate(item.identity)}>
                            Testni yakunlash
                          </button>
                        ) : (
                          <span className="muted-text">Amal yo&apos;q</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <h3>Hozircha ma&apos;lumot yo&apos;q</h3>
              <p>Talabgorlar `itcenter` app orqali kirishni boshlaganda sessiyalar shu yerda ko&apos;rinadi.</p>
            </div>
          )}
        </section>

        <section className="panel-grid" id="results">
          <article className="panel-card">
            <div className="panel-card__head">
              <div>
                <h3>Yakunlangan testlar</h3>
                <p>Natija chiqqan qatnashuvchilar</p>
              </div>
            </div>
            <div className="list">
              {scoredSessions.length ? (
                scoredSessions.map((item) => (
                  <div className="list-row" key={`${item.identity}-result`}>
                    <div>
                      <strong>{item.name} {item.surname}</strong>
                      <p>{item.reason || 'Natija yozildi'}</p>
                    </div>
                    <span>{item.score}/{item.totalQuestions}</span>
                  </div>
                ))
              ) : (
                <p className="muted-text">Hali yakunlangan natija yo&apos;q.</p>
              )}
            </div>
          </article>

          <article className="panel-card">
            <div className="panel-card__head">
              <div>
                <h3>Tizim eslatmasi</h3>
              </div>
            </div>
            <ul className="status-list">
              <li>Bu panel `localStorage` orqali ishlaydi.</li>
              <li>Admin va imtihon oynasi bir xil brauzer/origin ichida bo&apos;lishi kerak.</li>
              <li>`Testni yakunlash` faqat aktiv imtihon uchun chiqadi.</li>
            </ul>
          </article>
        </section>
      </main>
    </div>
  );
}

export default App;
