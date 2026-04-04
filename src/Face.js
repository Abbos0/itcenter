import React from 'react';
import { FaCamera, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import './Face.css';

const Face = ({ user, onNext, onBack }) => {
  return (
    <div className="face-container">
      <header className="face-header">
        <button className="back-btn" onClick={onBack}>
          <FaArrowLeft /> Orqaga
        </button>
        <h1><FaCamera /> Yuzni Tekshirish</h1>
      </header>
      <main className="face-main">
        <p>Salom, {user.name} {user.surname}!</p>
        <p>Imtihon uchun yuzingizni tekshiring.</p>
        <div className="face-placeholder">
          <FaCamera size={100} />
          <p>Kamera ochiladi...</p>
        </div>
        <button className="next-btn" onClick={onNext}>
          <FaArrowRight /> Keyingi
        </button>
      </main>
    </div>
  );
};

export default Face;