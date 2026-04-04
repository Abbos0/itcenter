import React, { useState } from 'react';
import { FaPhone, FaSms, FaArrowLeft, FaArrowRight, FaCheck } from 'react-icons/fa';
import './Phone.css';

const Phone = ({ user, onNext, onBack }) => {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('phone'); // 'phone' or 'code'
  const [error, setError] = useState('');

  const handlePhoneSubmit = (e) => {
    e.preventDefault();
    if (phone.length === 9 && phone.startsWith('9')) { // Uzbek phone format
      setStep('code');
      setError('');
      // Simulate sending SMS
      alert('SMS kod yuborildi: 1234');
    } else {
      setError('Telefon raqamini to\'g\'ri kiriting (9xxxxxxxx)');
    }
  };

  const handleCodeSubmit = (e) => {
    e.preventDefault();
    if (code === '1234') {
      onNext();
    } else {
      setError('Kod noto\'g\'ri');
    }
  };

  return (
    <div className="phone-container">
      <header className="phone-header">
        <button className="back-btn" onClick={onBack}>
          <FaArrowLeft /> Orqaga
        </button>
        <h1><FaPhone /> Telefon Tasdiqlash</h1>
      </header>
      <main className="phone-main">
        <p>Salom, {user.name} {user.surname}!</p>
        {step === 'phone' ? (
          <form className="phone-form" onSubmit={handlePhoneSubmit}>
            <div className="input-group">
              <label><FaPhone /> Telefon raqam</label>
              <div className="phone-input-wrapper">
                <span className="prefix">+998</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="9xxxxxxxx"
                  maxLength="9"
                  required
                />
              </div>
            </div>
            {error && <p className="error">{error}</p>}
            <button type="submit" className="submit-btn">
              <FaSms /> Kod yuborish
            </button>
          </form>
        ) : (
          <form className="code-form" onSubmit={handleCodeSubmit}>
            <div className="input-group">
              <label><FaSms /> SMS kod</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="1234"
                maxLength="4"
                required
              />
            </div>
            {error && <p className="error">{error}</p>}
            <button type="submit" className="submit-btn">
              <FaCheck /> Tasdiqlash
            </button>
          </form>
        )}
      </main>
    </div>
  );
};

export default Phone;