// import React, { useState, useEffect, useRef } from 'react';
// import Webcam from 'react-webcam';
// import { FaClock, FaArrowRight, FaCheck } from 'react-icons/fa';
// import './Exam.css';

// const questions = [
//   {
//     question: "1. React nima?",
//     options: ["JavaScript kutubxonasi", "CSS ramkasi", "HTML elementi", "Server"],
//     correct: 0
//   },
//   {
//     question: "2. JavaScript qaysi yil yaratilgan?",
//     options: ["1995", "2000", "1985", "2010"],
//     correct: 0
//   },
//   {
//     question: "3. HTML ning to'liq nomi nima?",
//     options: ["HyperText Markup Language", "High Tech Modern Language", "Home Tool Markup Language", "Hyperlink and Text Markup Language"],
//     correct: 0
//   },
//   {
//     question: "4. CSS nima uchun ishlatiladi?",
//     options: ["Sahifalarni bezash", "Ma'lumotlarni saqlash", "Server bilan bog'lanish", "Fayllarni yuklash"],
//     correct: 0
//   },
//   {
//     question: "5. Node.js nima?",
//     options: ["JavaScript runtime", "CSS kutubxonasi", "HTML editor", "Database"],
//     correct: 0
//   }
// ];


// const Exam = ({ user, onBack }) => {
//   const [currentQuestion, setCurrentQuestion] = useState(0);
//   const [answers, setAnswers] = useState({});
//   const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
//   const [selectedAnswer, setSelectedAnswer] = useState(null);
//   const [isAnswered, setIsAnswered] = useState(false);
//   const [showNext, setShowNext] = useState(false);
//   const webcamRef = useRef(null);

//   useEffect(() => {
//     const timer = setInterval(() => {
//       setTimeLeft(prev => {
//         if (prev <= 1) {
//           // Time's up
//           handleFinish();
//           return 0;
//         }
//         return prev - 1;
//       });
//     }, 1000);
//     return () => clearInterval(timer);
//   }, []);

//   const handleAnswerSelect = (index) => {
//     if (isAnswered) return;
//     setSelectedAnswer(index);
//     setIsAnswered(true);
//     setAnswers(prev => ({ ...prev, [currentQuestion]: index }));
//     setTimeout(() => {
//       setShowNext(true);
//     }, 5000); // 5 seconds
//   };

//   const handleNext = () => {
//     if (currentQuestion < questions.length - 1) {
//       setCurrentQuestion(prev => prev + 1);
//       setSelectedAnswer(null);
//       setIsAnswered(false);
//       setShowNext(false);
//     } else {
//       handleFinish();
//     }
//   };

//   const handleFinish = () => {
//     // Calculate score
//     const score = Object.keys(answers).reduce((acc, q) => {
//       return acc + (answers[q] === questions[q].correct ? 1 : 0);
//     }, 0);
//     alert(`Imtihon tugadi! Sizning natijangiz: ${score}/${questions.length}`);
//     onBack();
//   };

//   const formatTime = (seconds) => {
//     const mins = Math.floor(seconds / 60);
//     const secs = seconds % 60;
//     return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
//   };

//   return (
//     <div className="exam-container">
//       <header className="exam-header">
//         <div className="user-info">
//           <span>{user.name} {user.surname}</span>
//         </div>
        
//         <div className="timer">
//           <FaClock /> {formatTime(timeLeft)}
//         </div>
//         <button className="back-btn" onClick={onBack}>
//           Chiqish
//         </button>
//       </header>
//       <div className="exam-content">
//         <div className="webcam-section">
//           <Webcam
//             ref={webcamRef}
//             audio={false}
//             screenshotFormat="image/jpeg"
//             videoConstraints={{ width: 320, height: 240 }}
//             className="webcam"
//           />
//           <p>Kamera: Siz ko'rinib turishingiz kerak</p>
//         </div>
//         <div className="question-section">
//           <h2>{questions[currentQuestion].question}</h2>
//           <div className="options">
//             {questions[currentQuestion].options.map((option, index) => (
//               <button
//                 key={index}
//                 className={`option ${selectedAnswer === index ? 'selected' : ''} ${isAnswered ? 'disabled' : ''}`}
//                 onClick={() => handleAnswerSelect(index)}
//                 disabled={isAnswered}
//               >
//                 {option}
//                 {selectedAnswer === index && <FaCheck />}
//               </button>
//             ))}
//           </div>
//           {showNext && (
//             <button className="next-btn" onClick={handleNext}>
//               <FaArrowRight /> Keyingi
//             </button>
//           )}
//           {isAnswered && !showNext && (
//             <p className="wait-message">5 soniya kutib turing...</p>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Exam;

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { FaClock, FaArrowRight, FaCheck } from 'react-icons/fa';
import './Exam.css';
import { io } from 'socket.io-client';
import { LIVE_BACKEND_URL } from './liveBackend';

const ANSWER_DELAY_MS = 1000;
const WAIT_MESSAGE = 'Yuklanmoqda...';

const questions = [
  { question: "1. React nima?", options: ["JavaScript kutubxonasi", "CSS ramkasi", "HTML elementi", "Server"], correct: 0 },
  { question: "2. JavaScript qaysi yil yaratilgan?", options: ["1995", "2000", "1985", "2010"], correct: 0 },
  { question: "3. HTML ning to'liq nomi nima?", options: ["HyperText Markup Language", "High Tech Modern Language", "Home Tool Markup Language", "Hyperlink and Text Markup Language"], correct: 0 },
  { question: "4. CSS nima uchun ishlatiladi?", options: ["Sahifalarni bezash", "Ma'lumotlarni saqlash", "Server bilan bog'lanish", "Fayllarni yuklash"], correct: 0 },
  { question: "5. Node.js nima?", options: ["JavaScript runtime", "CSS kutubxonasi", "HTML editor", "Database"], correct: 0 }
];

const socketOptions = {
  transports: ['polling'],
  upgrade: false,
};

const normalizeIdentity = ({ name = '', surname = '' }) =>
  `${name.trim().toLocaleLowerCase()}::${surname.trim().toLocaleLowerCase()}`;

const captureFrame = (webcamRef) => {
  try {
    // Try to get the video element
    const video = webcamRef.current?.video || document.querySelector('.webcam video') || document.querySelector('video');

    if (!video || video.readyState < 2 || !video.videoWidth || !video.videoHeight) {
      console.log('[exam] video not ready', {
        hasVideo: Boolean(video),
        readyState: video?.readyState ?? null,
        width: video?.videoWidth ?? 0,
        height: video?.videoHeight ?? 0,
      });
      return '';
    }

    // Create canvas and capture frame
    const canvas = document.createElement('canvas');
    canvas.width = Math.min(video.videoWidth / 2, 160); // Smaller size for better performance
    canvas.height = Math.min(video.videoHeight / 2, 120);

    const context = canvas.getContext('2d');
    if (!context) {
      console.error('[exam] cannot get canvas context');
      return '';
    }

    // Draw the video frame to canvas (scaled down)
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to data URL with lower quality
    const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
    console.log('[exam] captured frame', {
      size: dataUrl.length,
      dimensions: `${canvas.width}x${canvas.height}`,
      urlStart: dataUrl.substring(0, 50)
    });

    return dataUrl;
  } catch (error) {
    console.error('[exam] error capturing frame:', error);
    return '';
  }
};

const Exam = ({ user, onFinish }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const webcamRef = useRef(null);
  const socketRef = useRef(null);
  const finishedRef = useRef(false);
  const identity = normalizeIdentity(user);

  const handleFinish = useCallback(() => {
    if (finishedRef.current) {
      return;
    }

    finishedRef.current = true;
    const score = Object.keys(answers).reduce((acc, q) => acc + (answers[q] === questions[q].correct ? 1 : 0), 0);
    socketRef.current?.emit('participant:leave', { identity });
    alert(`Imtihon tugadi! Siz ${score} ta to'g'ri topdingiz.`);
    onFinish({
      reason: 'Imtihon muvaffaqiyatli yakunlandi.',
      score,
      totalQuestions: questions.length,
    });
  }, [answers, identity, onFinish]);

  const sendSnapshot = useCallback((socket, payload) => {
    if (!socket?.connected) {
      return;
    }

    const screenshot = captureFrame(webcamRef);
    if (!screenshot) {
      console.log('[exam] no screenshot available yet');
      return;
    }

    socket.emit('participant:snapshot', {
      ...payload,
      snapshot: screenshot,
      status: 'in_progress',
    });
    console.log('[exam] snapshot emitted', { identity, screenshotSize: screenshot.length });
  }, [identity]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (timeLeft === 0) {
      handleFinish();
    }
  }, [handleFinish, timeLeft]);

  useEffect(() => {
    const socket = io(LIVE_BACKEND_URL, socketOptions);

    socketRef.current = socket;

    const basePayload = {
      identity,
      name: user.name,
      surname: user.surname,
      phone: user.phone || '',
      status: 'in_progress',
    };

    socket.on('connect', () => {
      console.log('[exam] socket connected', { identity, backend: LIVE_BACKEND_URL });
      socket.emit('participant:join', basePayload);
      console.log('[exam] participant joined', basePayload);
      sendSnapshot(socket, basePayload);
      window.setTimeout(() => sendSnapshot(socket, basePayload), 1200);
    });

    socket.on('control:terminate', ({ identity: targetIdentity }) => {
      if (targetIdentity !== identity) {
        return;
      }

      if (finishedRef.current) {
        return;
      }

      finishedRef.current = true;
      socket.emit('participant:leave', { identity });
      alert("Admin tomonidan imtihon yakunlandi.");
      onFinish({
        reason: 'Admin tomonidan imtihon yakunlandi.',
        score: null,
        totalQuestions: questions.length,
      });
    });

    socket.on('control:delete', ({ identity: targetIdentity }) => {
      if (targetIdentity !== identity) {
        return;
      }

      finishedRef.current = true;
      socket.emit('participant:leave', { identity });
    });

    const snapshotInterval = window.setInterval(() => {
      if (!webcamRef.current || !socket.connected) {
        return;
      }

      sendSnapshot(socket, basePayload);
    }, 4000);

    return () => {
      window.clearInterval(snapshotInterval);
      socket.emit('participant:leave', { identity });
      console.log('[exam] participant left', { identity });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [identity, onFinish, sendSnapshot, user.name, user.phone, user.surname]);

  useEffect(() => {
    if (!socketRef.current?.connected || !isCameraReady) {
      return;
    }

    const payload = {
      identity,
      name: user.name,
      surname: user.surname,
      phone: user.phone || '',
      status: 'in_progress',
    };

    sendSnapshot(socketRef.current, payload);
  }, [identity, isCameraReady, sendSnapshot, user.name, user.phone, user.surname]);

  const handleAnswerSelect = (index) => {
    if (isAnswered) return;
    setSelectedAnswer(index);
    setIsAnswered(true);
    setAnswers(prev => ({ ...prev, [currentQuestion]: index }));
    setTimeout(() => setShowNext(true), ANSWER_DELAY_MS);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setShowNext(false);
    } else {
      handleFinish();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="exam-container">
      <header className="exam-header">
        <div className="user-info"><span>{user.name} {user.surname}</span></div>
        <div className="timer"><FaClock /> {formatTime(timeLeft)}</div>
        <div className="exam-header__spacer" aria-hidden="true" />
      </header>

      <div className="exam-content">
        <div className="webcam-section">
          <div className="webcam-section__header">
            <h3>Kamera nazorati</h3>
            <span className="webcam-status">{isCameraReady ? 'Live' : 'Kutmoqda'}</span>
          </div>
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            videoConstraints={{ width: 320, height: 240 }}
            className="webcam"
            onUserMedia={() => setIsCameraReady(true)}
            onUserMediaError={() => setIsCameraReady(false)}
          />
          <p>Kamera: Siz ko'rinib turishingiz kerak</p>
        </div>

        <div className="question-section">
          <h2>{questions[currentQuestion].question}</h2>
          <div className="options">
            {questions[currentQuestion].options.map((option, index) => (
              <button
                key={index}
                className={`option ${selectedAnswer === index ? 'selected' : ''} ${isAnswered ? 'disabled' : ''}`}
                onClick={() => handleAnswerSelect(index)}
                disabled={isAnswered}
              >
                {option}
                {selectedAnswer === index && <FaCheck />}
              </button>
            ))}
          </div>

          {showNext && <button className="next-btn" onClick={handleNext}><FaArrowRight /> Keyingi</button>}
          {isAnswered && !showNext && <p className="wait-message">{WAIT_MESSAGE}</p>}
        </div>
      </div>
    </div>
  );
};

export default Exam;
