import React from 'react';
import { FaExclamationTriangle, FaArrowLeft, FaArrowRight, FaUser, FaPhone } from 'react-icons/fa';
import './Instructions.css';

const Instructions = ({ user, onNext, onBack }) => {
  return (
    <div className="instructions-container">
      <header className="instructions-header">
        <button className="back-btn" onClick={onBack}>
          <FaArrowLeft /> Orqaga
        </button>
        <h1><FaExclamationTriangle /> Ko'rsatmalar</h1>
      </header>
      <main className="instructions-main">
        <p>Salom, {user.name} {user.surname}!</p>
        <div className="warning-section">
          <h2><FaExclamationTriangle /> Muhim ogohlantirishlar</h2>
          <ul>
            <li>
              <FaUser /> <strong>Ism va Familiya:</strong> Siz faqat bir marta foydalana olasiz. Qayta kirishga ruxsat yo'q.
            </li>
            <li>
              <FaPhone /> <strong>Telefon raqam:</strong> Bitta raqam bir marta foydalanilsin. Qayta foydalanish taqiqlanadi.
            </li>
            <li>
              <FaExclamationTriangle /> Imtihon davomida qoidalarga rioya qiling. Har qanday buzilish natijalarni bekor qilishi mumkin.
            </li>
          </ul>
        </div>
        <div className="rules-section">
          <h2>Qoidalar</h2>
          <ol>
            <li>Imtihonni boshlashdan oldin barcha ma'lumotlarni tekshiring.</li>
            <li>Vaqt cheklovi mavjud – uni hisobga oling.</li>
            <li>Javoblarni diqqat bilan belgilang.</li>
            <li>Imtihon tugagach, javoblarni tekshirib ko'ring.</li>
          </ol>
        </div>
        <button className="start-btn" onClick={onNext}>
          <FaArrowRight /> Imtihonni boshlash
        </button>
      </main>
    </div>
  );
};

export default Instructions;