// import React, { useState } from 'react';
// import { BrowserRouter as Router} from 'react-router-dom';
// import Login from './Login';
// import Face from './Face';
// import Phone from './Phone';
// import Instructions from './Instructions';
// import Exam from './Exam';
// import './App.css';


// function App() {
//   const [user, setUser] = useState(null);
//   const [step, setStep] = useState('login');

//   const handleLogin = (userData) => {
//     setUser(userData);
//     setStep('face');
//   };

//   const handleFaceNext = () => {
//     setStep('phone');
//   };

//   const handlePhoneNext = () => {
//     setStep('instructions');
//   };

//   const handleInstructionsNext = () => {
//     setStep('exam');
//   };

//   const handleBack = () => {
//     if (step === 'face') setStep('login');
//     else if (step === 'phone') setStep('face');
//     else if (step === 'instructions') setStep('phone');
//     else if (step === 'exam') setStep('instructions');
//   };


//   return (
//     <Router>
//       <div className="App">
//         {step === 'login' && <Login onLogin={handleLogin} />}
//         {step === 'face' && <Face user={user} onNext={handleFaceNext} onBack={handleBack} />}
//         {step === 'phone' && <Phone user={user} onNext={handlePhoneNext} onBack={handleBack} />}
//         {step === 'instructions' && <Instructions user={user} onNext={handleInstructionsNext} onBack={handleBack} />}
//         {step === 'exam' && <Exam user={user} onBack={handleBack} />}
//       </div>
//     </Router>
//   );
// }

// export default App;

import React, { useEffect, useState } from 'react';
import Login from './Login';
import Face from './Face';
import Phone from './Phone';
import Instructions from './Instructions';
import Exam from './Exam';
import './App.css';

const EXAM_SESSION_KEY = 'itcenter-exam-session';

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

  useEffect(() => {
    localStorage.setItem(EXAM_SESSION_KEY, JSON.stringify(examSession));
  }, [examSession]);

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
            reason: "Imtihon oynasi yopilgan. Test avtomatik yakunlandi.",
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
      return;
    }

    setUser(userData);
    setStep('face');
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

  if (step === 'blocked' || examSession.status === 'completed' || examSession.status === 'terminated') {
    return (
      <div className="App">
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
