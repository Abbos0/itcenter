import React, { useEffect, useState } from 'react';
import Login from './Login';
import Face from './Face';
import Phone from './Phone';
import Instructions from './Instructions';
import Exam from './Exam';
import './App.css';

const EXAM_SESSION_KEY = 'itcenter-exam-session';
const USED_IDENTITIES_KEY = 'itcenter-used-identities';

const normalizeIdentity = ({ name = '', surname = '' }) =>
  `${name.trim().toLocaleLowerCase()}::${surname.trim().toLocaleLowerCase()}`;


function App() {
  const [user, setUser] = useState(null);
  const [step, setStep] = useState('login');
  const [examSession, setExamSession] = useState(() => {
    const savedSession = localStorage.getItem(EXAM_SESSION_KEY);


    if (!savedSession) {
      return { status: 'idle' };
    }

    try {
      const parsed = JSON.parse(savedSession);
      if (parsed.status === 'in_progress') {
        return { status: 'terminated', reason: 'Imtihon oynasi yopilgan.' };
      }

      return parsed;
    } catch (error) {
      return { status: 'idle' };
    }
  });
  const [usedIdentities, setUsedIdentities] = useState(() => {
    const savedIdentities = localStorage.getItem(USED_IDENTITIES_KEY);

    if (savedIdentities) {
      try {
        const parsed = JSON.parse(savedIdentities);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (error) {
        // Ignore malformed storage and rebuild from session data below.
      }
    }

    const savedSession = localStorage.getItem(EXAM_SESSION_KEY);

    if (!savedSession) {
      return [];
    }

    try {
      const parsedSession = JSON.parse(savedSession);
      if (!parsedSession?.user?.name || !parsedSession?.user?.surname) {
        return [];
      }

      return [normalizeIdentity(parsedSession.user)];
    } catch (error) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(EXAM_SESSION_KEY, JSON.stringify(examSession));
  }, [examSession]);

  useEffect(() => {
    localStorage.setItem(USED_IDENTITIES_KEY, JSON.stringify(usedIdentities));
  }, [usedIdentities]);

  useEffect(() => {
    if (step === 'login') {
      return undefined;
    }

    window.history.pushState(null, '', window.location.href);

    const handlePopState = () => {
      if (step === 'exam' && examSession.status === 'in_progress') {
        setExamSession({
          status: 'terminated',
          reason: "Imtihondan chiqishga urinish aniqlandi. Test yakunlandi.",
        });
        setStep('blocked');
      }

      window.history.pushState(null, '', window.location.href);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [step, examSession.status]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      const savedSession = localStorage.getItem(EXAM_SESSION_KEY);

      if (!savedSession) {
        return;
      }

      try {
        const parsed = JSON.parse(savedSession);

        if (parsed.status === 'in_progress') {
          localStorage.setItem(
            EXAM_SESSION_KEY,
            JSON.stringify({
              ...parsed,
              status: 'terminated',
              reason: "Imtihon oynasi yopilgan. Test avtomatik yakunlandi.",
            })
          );
        }
      } catch (error) {
        localStorage.setItem(
          EXAM_SESSION_KEY,
          JSON.stringify({
            status: 'terminated',
            reason: "Imtihon oynasi yopilgan. Test avtomatik yakunlandi. ",
          })
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

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
    return { ok: true };
  };

  const handleFaceNext = () => setStep('phone');
  const handlePhoneNext = () => setStep('instructions');
  const handleInstructionsNext = () => {
    setExamSession({
      status: 'in_progress',
      user,
      startedAt: new Date().toISOString(),
    });
    setStep('exam');
  };

  const handleExamFinish = (details) => {
    setExamSession({
      status: 'completed',
      user,
      finishedAt: new Date().toISOString(),
      ...details,
    });
    setStep('blocked');
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
        <main className="lock-screen">
          <section className="lock-card">
            <p className="lock-card__eyebrow">Imtihon holati</p>
            <h1>Test yakunlangan .</h1>
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
      {step === 'login' && <Login onLogin={handleLogin} />}
      {step === 'face' && <Face user={user} onNext={handleFaceNext} />}
      {step === 'phone' && <Phone user={user} onNext={handlePhoneNext} />}
      {step === 'instructions' && <Instructions user={user} onNext={handleInstructionsNext} />}
      {step === 'exam' && <Exam user={user} onFinish={handleExamFinish} />}
    </div>
  );
}

export default App;
