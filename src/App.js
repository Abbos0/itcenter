import React, { useEffect, useMemo, useState } from 'react';
import Login from './Login';
import Face from './Face';
import Phone from './Phone';
import Instructions from './Instructions';
import Exam from './Exam';
import './App.css';

const EXAM_SESSION_KEY = 'itcenter-exam-session';
const USED_IDENTITIES_KEY = 'itcenter-used-identities';
const ADMIN_SESSIONS_KEY = 'itcenter-admin-sessions';
const ADMIN_CONTROL_KEY = 'itcenter-admin-control';

const normalizeIdentity = ({ name = '', surname = '' }) =>
  `${name.trim().toLocaleLowerCase()}::${surname.trim().toLocaleLowerCase()}`;

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

function App() {
  const [user, setUser] = useState(null);
  const [step, setStep] = useState('login');
  const [examSession, setExamSession] = useState(() => {
    const savedSession = readJson(EXAM_SESSION_KEY, { status: 'idle' });

    if (savedSession.status === 'in_progress') {
      return { ...savedSession, status: 'terminated', reason: 'Imtihon oynasi yopilgan.' };
    }

    return savedSession;
  });
  const [usedIdentities, setUsedIdentities] = useState(() => {
    const savedIdentities = readJson(USED_IDENTITIES_KEY, null);

    if (Array.isArray(savedIdentities)) {
      return savedIdentities;
    }

    const savedSession = readJson(EXAM_SESSION_KEY, null);

    if (savedSession?.user?.name && savedSession?.user?.surname) {
      return [normalizeIdentity(savedSession.user)];
    }

    return [];
  });

  const currentIdentity = useMemo(() => {
    if (!user?.name || !user?.surname) {
      return '';
    }

    return normalizeIdentity(user);
  }, [user]);

  const upsertAdminSession = (identity, payload) => {
    if (!identity) {
      return;
    }

    const currentSessions = readJson(ADMIN_SESSIONS_KEY, []);
    const nextSessions = Array.isArray(currentSessions) ? [...currentSessions] : [];
    const existingIndex = nextSessions.findIndex((item) => item.identity === identity);
    const previousEntry = existingIndex >= 0 ? nextSessions[existingIndex] : null;

    const nextEntry = {
      identity,
      name: payload.name ?? previousEntry?.name ?? '',
      surname: payload.surname ?? previousEntry?.surname ?? '',
      phone: payload.phone ?? previousEntry?.phone ?? '',
      status: payload.status ?? previousEntry?.status ?? 'login',
      score: payload.score ?? previousEntry?.score ?? null,
      totalQuestions: payload.totalQuestions ?? previousEntry?.totalQuestions ?? null,
      reason: payload.reason ?? previousEntry?.reason ?? '',
      createdAt: previousEntry?.createdAt ?? payload.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      startedAt: payload.startedAt ?? previousEntry?.startedAt ?? null,
      finishedAt: payload.finishedAt ?? previousEntry?.finishedAt ?? null,
    };

    if (existingIndex >= 0) {
      nextSessions[existingIndex] = nextEntry;
    } else {
      nextSessions.unshift(nextEntry);
    }

    localStorage.setItem(ADMIN_SESSIONS_KEY, JSON.stringify(nextSessions));
  };

  useEffect(() => {
    localStorage.setItem(EXAM_SESSION_KEY, JSON.stringify(examSession));
  }, [examSession]);

  useEffect(() => {
    localStorage.setItem(USED_IDENTITIES_KEY, JSON.stringify(usedIdentities));
  }, [usedIdentities]);

  useEffect(() => {
    if (!currentIdentity || !user) {
      return;
    }

    upsertAdminSession(currentIdentity, {
      name: user.name,
      surname: user.surname,
      phone: user.phone || '',
      status: step === 'exam' ? examSession.status : step,
      reason: examSession.reason || '',
      score: examSession.score ?? null,
      totalQuestions: examSession.totalQuestions ?? null,
      startedAt: examSession.startedAt ?? null,
      finishedAt: examSession.finishedAt ?? null,
    });
  }, [currentIdentity, examSession, step, user]);

  useEffect(() => {
    if (step === 'login') {
      return undefined;
    }

    window.history.pushState(null, '', window.location.href);

    const handlePopState = () => {
      if (step === 'exam' && examSession.status === 'in_progress') {
        const nextState = {
          ...examSession,
          status: 'terminated',
          reason: "Imtihondan chiqishga urinish aniqlandi. Test yakunlandi.",
        };

        setExamSession(nextState);
        upsertAdminSession(currentIdentity, {
          ...user,
          status: 'terminated',
          reason: nextState.reason,
          score: nextState.score ?? null,
          totalQuestions: nextState.totalQuestions ?? null,
          startedAt: nextState.startedAt ?? null,
          finishedAt: new Date().toISOString(),
        });
        setStep('blocked');
      }

      window.history.pushState(null, '', window.location.href);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [currentIdentity, examSession, step, user]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      const savedSession = readJson(EXAM_SESSION_KEY, null);

      if (savedSession?.status === 'in_progress') {
        const nextState = {
          ...savedSession,
          status: 'terminated',
          reason: "Imtihon oynasi yopilgan. Test avtomatik yakunlandi.",
          finishedAt: new Date().toISOString(),
        };

        localStorage.setItem(EXAM_SESSION_KEY, JSON.stringify(nextState));

        if (currentIdentity && user) {
          upsertAdminSession(currentIdentity, {
            ...user,
            status: 'terminated',
            reason: nextState.reason,
            score: nextState.score ?? null,
            totalQuestions: nextState.totalQuestions ?? null,
            startedAt: nextState.startedAt ?? null,
            finishedAt: nextState.finishedAt,
          });
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentIdentity, user]);

  useEffect(() => {
    const handleAdminControl = (event) => {
      if (event.key !== ADMIN_CONTROL_KEY || !event.newValue || !currentIdentity || !user) {
        return;
      }

      const control = readJson(ADMIN_CONTROL_KEY, null);

      if (control?.action === 'terminate' && control.identity === currentIdentity) {
        const nextState = {
          ...examSession,
          status: 'terminated',
          reason: "Admin tomonidan imtihon yakunlandi.",
          finishedAt: new Date().toISOString(),
        };

        setExamSession(nextState);
        upsertAdminSession(currentIdentity, {
          ...user,
          status: 'force_ended',
          reason: nextState.reason,
          score: nextState.score ?? null,
          totalQuestions: nextState.totalQuestions ?? null,
          startedAt: nextState.startedAt ?? null,
          finishedAt: nextState.finishedAt,
        });
        setStep('blocked');
      }
    };

    window.addEventListener('storage', handleAdminControl);

    return () => {
      window.removeEventListener('storage', handleAdminControl);
    };
  }, [currentIdentity, examSession, user]);

  const handleLogin = (userData) => {
    if (examSession.status !== 'idle') {
      setStep('blocked');
      return {
        ok: false,
        message: "Bu qurilmada imtihon allaqachon yakunlangan.",
      };
    }

    const normalizedIdentity = normalizeIdentity(userData);

    if (usedIdentities.includes(normalizedIdentity)) {
      return {
        ok: false,
        message: "Bu ism va familiya bilan faqat bir marta kirish mumkin.",
      };
    }

    setUsedIdentities((current) => [...current, normalizedIdentity]);
    setUser(userData);
    setStep('face');
    upsertAdminSession(normalizedIdentity, {
      ...userData,
      status: 'face',
      createdAt: new Date().toISOString(),
    });

    return { ok: true };
  };

  const handleFaceNext = () => {
    setStep('phone');
    upsertAdminSession(currentIdentity, { ...user, status: 'phone' });
  };

  const handlePhoneNext = (phone) => {
    const nextUser = { ...user, phone };

    setUser(nextUser);
    setStep('instructions');
    upsertAdminSession(currentIdentity || normalizeIdentity(nextUser), {
      ...nextUser,
      status: 'instructions',
      phone,
    });
  };

  const handleInstructionsNext = () => {
    const nextSession = {
      status: 'in_progress',
      user,
      startedAt: new Date().toISOString(),
    };

    setExamSession(nextSession);
    setStep('exam');
    upsertAdminSession(currentIdentity, {
      ...user,
      status: 'in_progress',
      startedAt: nextSession.startedAt,
      reason: '',
      score: null,
      totalQuestions: null,
    });
  };

  const handleExamFinish = (details) => {
    const nextSession = {
      status: 'completed',
      user,
      finishedAt: new Date().toISOString(),
      ...details,
    };

    setExamSession(nextSession);
    setStep('blocked');
    upsertAdminSession(currentIdentity, {
      ...user,
      status: 'completed',
      reason: nextSession.reason,
      score: nextSession.score ?? null,
      totalQuestions: nextSession.totalQuestions ?? null,
      startedAt: examSession.startedAt ?? null,
      finishedAt: nextSession.finishedAt,
    });
  };

  const handleResetSession = () => {
    localStorage.removeItem(EXAM_SESSION_KEY);
    setExamSession({ status: 'idle' });
    setUser(null);
    setStep('login');
  };

  if (step === 'blocked' || examSession.status === 'completed' || examSession.status === 'terminated') {
    return (
      <div className="App">
        <a className="admin-entry" href="https://itcenter-admin.vercel.app" target="_blank" rel="noreferrer">
          Admin
        </a>
        <main className="lock-screen">
          <section className="lock-card">
            <p className="lock-card__eyebrow">Imtihon holati</p>
            <h1>Test yakunlangan</h1>
            <p className="lock-card__copy">
              {examSession.reason || "Siz bu testni qayta topshira olmaysiz."}
            </p>
            {typeof examSession.score === 'number' ? (
              <p className="lock-card__result">
                Siz {examSession.score} ta to&apos;g&apos;ri topdingiz
              </p>
            ) : null}
            <p className="lock-card__hint">
              Imtihon tugaganidan keyin tizimga qayta kirish bloklanadi.
            </p>
            <button className="lock-card__reset" onClick={handleResetSession} type="button">
              Qayta boshlash
            </button>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="App">
      <a className="admin-entry" href="https://itcenter-admin.vercel.app" target="_blank" rel="noreferrer">
        Admin
      </a>
      {step === 'login' && <Login onLogin={handleLogin} />}
      {step === 'face' && <Face user={user} onNext={handleFaceNext} />}
      {step === 'phone' && <Phone user={user} onNext={handlePhoneNext} />}
      {step === 'instructions' && <Instructions user={user} onNext={handleInstructionsNext} />}
      {step === 'exam' && <Exam user={user} onFinish={handleExamFinish} />}
    </div>
  );
}

export default App;
