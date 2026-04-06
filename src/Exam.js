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

const ANSWER_DELAY_MS = 1000;
const WAIT_MESSAGE = 'Yuklanmoqda...';

const questions = [
  { question: "1. React nima?", options: ["JavaScript kutubxonasi", "CSS ramkasi", "HTML elementi", "Server"], correct: 0 },
  { question: "2. JavaScript qaysi yil yaratilgan?", options: ["1995", "2000", "1985", "2010"], correct: 0 },
  { question: "3. HTML ning to'liq nomi nima?", options: ["HyperText Markup Language", "High Tech Modern Language", "Home Tool Markup Language", "Hyperlink and Text Markup Language"], correct: 0 },
  { question: "4. CSS nima uchun ishlatiladi?", options: ["Sahifalarni bezash", "Ma'lumotlarni saqlash", "Server bilan bog'lanish", "Fayllarni yuklash"], correct: 0 },
  { question: "5. Node.js nima?", options: ["JavaScript runtime", "CSS kutubxonasi", "HTML editor", "Database"], correct: 0 }
];

const Exam = ({ user, onFinish }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const webcamRef = useRef(null);

  const handleFinish = useCallback(() => {
    const score = Object.keys(answers).reduce((acc, q) => acc + (answers[q] === questions[q].correct ? 1 : 0), 0);
    alert(`Imtihon tugadi! Siz ${score} ta to'g'ri topdingiz.`);
    onFinish({
      reason: 'Imtihon muvaffaqiyatli yakunlandi.',
      score,
      totalQuestions: questions.length,
    });
  }, [answers, onFinish]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [handleFinish]);

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
            <span className="webcam-status">Live</span>
          </div>
          <Webcam ref={webcamRef} audio={false} screenshotFormat="image/jpeg" videoConstraints={{ width: 320, height: 240 }} className="webcam" />
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
