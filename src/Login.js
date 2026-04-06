import React, { useState, useEffect } from 'react';
import { FaUser, FaUserTag, FaSignInAlt, FaMoon, FaSun } from 'react-icons/fa';
import './Login.css';

const Login = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.body.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name && surname) {
      const result = onLogin({ name, surname });

      if (result?.ok === false) {
        alert(result.message);
      }
    } else {
      alert('Iltimos, ism va familiyani kiriting.');
    }
  };

  return (
    <div className="login-container">
      <header className="login-header">
        <div className="login-header__content">
          <p className="login-warning">Testdan chiqib ketish taqiqlanadi</p>
        </div>
        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === 'light' ? <FaMoon /> : <FaSun />}
        </button>
      </header>
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>Kirish</h2>
        <div className="input-group">
          <label><FaUser /> Ism</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="input-group">
          <label><FaUserTag /> Familiya</label>
          <input
            type="text"
            value={surname}
            onChange={(e) => setSurname(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="submit-btn">
          <FaSignInAlt /> Kirish
        </button>
      </form>
    </div>
  );
};

export default Login;
