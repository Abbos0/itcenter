import React, { useState } from 'react';
import Webcam from 'react-webcam';
import { FaCamera, FaArrowRight, FaCheckCircle, FaLaptop } from 'react-icons/fa';
import './Face.css';

const Face = ({ user, onNext }) => {
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [fallbackConfirmed, setFallbackConfirmed] = useState(false);

  const canContinue = isCameraReady || fallbackConfirmed;

  return (
    <div className="face-container">
      <header className="face-header">
        <h1><FaCamera /> Yuzni Tekshirish</h1>
      </header>
      <main className="face-main">
        <p>Salom, {user.name} {user.surname}!</p>
        <p>Imtihon uchun yuzingiz kameraga aniq tushsin.</p>
        <div className="face-placeholder">
          <Webcam
            audio={false}
            mirrored
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode: 'user' }}
            className="face-webcam"
            onUserMedia={() => {
              setIsCameraReady(true);
              setCameraError('');
              setFallbackConfirmed(false);
            }}
            onUserMediaError={() => {
              setIsCameraReady(false);
              setCameraError("Kameraga ruxsat berilmadi yoki kamera topilmadi.");
            }}
          />
          <div className={`camera-status${isCameraReady ? ' camera-status--ready' : ''}`}>
            {isCameraReady ? <FaCheckCircle /> : <FaCamera />}
            <p>
              {isCameraReady
                ? "Yuzingiz kameraga tushdi. Davom etishingiz mumkin."
                : "Kamera yuklanmoqda. Yuzingiz to'liq ko'rinsin."}
            </p>
          </div>
        </div>
        {cameraError ? <p className="camera-error">{cameraError}</p> : null}
        {!isCameraReady && cameraError ? (
          <label className="fallback-check">
            <input
              type="checkbox"
              checked={fallbackConfirmed}
              onChange={(event) => setFallbackConfirmed(event.target.checked)}
            />
            <span>
              <FaLaptop /> Bu qurilmada kamera yo&apos;q. Tekshiruv bosqichini qo&apos;lda tasdiqlayman.
            </span>
          </label>
        ) : null}
        <button className="next-btn" onClick={onNext} disabled={!canContinue}>
          <FaArrowRight /> Keyingi
        </button>
      </main>
    </div>
  );
};

export default Face;
