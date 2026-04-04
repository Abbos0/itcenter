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

import React, { useState } from 'react';
import Login from './Login';
import Face from './Face';
import Phone from './Phone';
import Instructions from './Instructions';
import Exam from './Exam';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [step, setStep] = useState('login');

  const handleLogin = (userData) => {
    setUser(userData);
    setStep('face');
  };

  const handleFaceNext = () => setStep('phone');
  const handlePhoneNext = () => setStep('instructions');
  const handleInstructionsNext = () => setStep('exam');

  const handleBack = () => {
    if (step === 'face') setStep('login');
    else if (step === 'phone') setStep('face');
    else if (step === 'instructions') setStep('phone');
    else if (step === 'exam') setStep('instructions');
  };

  return (
    <div className="App">
      {step === 'login' && <Login onLogin={handleLogin} />}
      {step === 'face' && <Face user={user} onNext={handleFaceNext} onBack={handleBack} />}
      {step === 'phone' && <Phone user={user} onNext={handlePhoneNext} onBack={handleBack} />}
      {step === 'instructions' && <Instructions user={user} onNext={handleInstructionsNext} onBack={handleBack} />}
      {step === 'exam' && <Exam user={user} onBack={handleBack} />}
    </div>
  );
}

export default App;
