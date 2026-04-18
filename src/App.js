import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const SOUNDS = [
  { label: 'Rain', url: 'https://assets.mixkit.co/active_storage/sfx/212/212-preview.mp3' },
  { label: 'Forest', url: 'https://assets.mixkit.co/active_storage/sfx/2515/2515-preview.mp3' },
  { label: 'Waves', url: 'https://assets.mixkit.co/active_storage/sfx/2517/2517-preview.mp3' },
  { label: 'None', url: null },
];

const MOODS = ['😔', '😐', '🙂', '😊', '🤩'];

function getSessionsFromStorage() {
  try {
    return JSON.parse(localStorage.getItem('meditationSessions')) || [];
  } catch { return []; }
}

function saveSession(durationSeconds, mood, note) {
  const sessions = getSessionsFromStorage();
  sessions.push({
    date: new Date().toISOString(),
    duration: durationSeconds,
    mood,
    note,
  });
  localStorage.setItem('meditationSessions', JSON.stringify(sessions));
}

function getMonthlyData(sessions) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const data = Array(daysInMonth).fill(0);
  sessions.forEach(s => {
    const d = new Date(s.date);
    if (d.getFullYear() === year && d.getMonth() === month) {
      data[d.getDate() - 1] += Math.round(s.duration / 60);
    }
  });
  return data;
}

function getStreak(sessions) {
  if (!sessions.length) return 0;
  const days = new Set(sessions.map(s => new Date(s.date).toDateString()));
  let streak = 0;
  const today = new Date();
  while (days.has(new Date(today).toDateString())) {
    streak++;
    today.setDate(today.getDate() - 1);
  }
  return streak;
}

function getBestStreak(sessions) {
  if (!sessions.length) return 0;
  const days = [...new Set(sessions.map(s => new Date(s.date).toDateString()))]
    .map(d => new Date(d))
    .sort((a, b) => a - b);
  let best = 1, current = 1;
  for (let i = 1; i < days.length; i++) {
    const diff = (days[i] - days[i - 1]) / (1000 * 60 * 60 * 24);
    current = diff === 1 ? current + 1 : 1;
    if (current > best) best = current;
  }
  return best;
}

function Particles({ active }) {
  const particles = Array.from({ length: 20 }, (_, i) => i);
  if (!active) return null;
  return (
    <div className="particles">
      {particles.map(i => (
        <div
          key={i}
          className="particle"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${3 + Math.random() * 4}s`,
            width: `${2 + Math.random() * 4}px`,
            height: `${2 + Math.random() * 4}px`,
            opacity: 0.3 + Math.random() * 0.5,
          }}
        />
      ))}
    </div>
  );
}

function StatsPanel({ sessions }) {
  const monthlyData = getMonthlyData(sessions);
  const maxVal = Math.max(...monthlyData, 1) * 1.2;  
  const totalMinutes = sessions.reduce((acc, s) => acc + Math.round(s.duration / 60), 0);
  const streak = getStreak(sessions);
  const bestStreak = getBestStreak(sessions);
  const longest = sessions.length ? Math.max(...sessions.map(s => s.duration)) : 0;
  const avg = sessions.length ? Math.round(totalMinutes / sessions.length) : 0;
  const today = new Date().getDate();

  return (
    <div className="stats-panel">
      <h2 className="stats-title">Your Progress</h2>

      <div className="stats-summary">
        <div className="stat-box">
          <span className="stat-number">{totalMinutes}</span>
          <span className="stat-label">Total Mins</span>
        </div>
        <div className="stat-box">
          <span className="stat-number">{streak}🔥</span>
          <span className="stat-label">Streak</span>
        </div>
        <div className="stat-box">
          <span className="stat-number">{sessions.length}</span>
          <span className="stat-label">Sessions</span>
        </div>
      </div>

      <div className="stats-summary">
        <div className="stat-box">
          <span className="stat-number">{bestStreak}</span>
          <span className="stat-label">Best Streak</span>
        </div>
        <div className="stat-box">
          <span className="stat-number">{Math.round(longest / 60)}m</span>
          <span className="stat-label">Longest</span>
        </div>
        <div className="stat-box">
          <span className="stat-number">{avg}m</span>
          <span className="stat-label">Average</span>
        </div>
      </div>

      <div className="bar-graph">
        {monthlyData.map((mins, i) => (
          <div key={i} className="bar-column">
            <div
              className={`bar ${i + 1 === today ? 'bar-today' : ''}`}
              style={{ height: `${(mins / maxVal) * 100}%` }}
            />
            {(i + 1) % 5 === 0 && (
              <span className="bar-label">{i + 1}</span>
            )}
          </div>
        ))}
      </div>

      {sessions.length > 0 && (
        <div className="recent-sessions">
          <p className="stats-subtitle">Recent Sessions</p>
          {sessions.slice(-3).reverse().map((s, i) => (
            <div key={i} className="session-row">
              <span className="session-mood">{s.mood ? MOODS[s.mood - 1] : '🙂'}</span>
              <span className="session-duration">{Math.round(s.duration / 60)}m</span>
              <span className="session-date">{new Date(s.date).toLocaleDateString()}</span>
              {s.note && <span className="session-note">"{s.note}"</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MoodScreen({ duration, onDone }) {
  const [mood, setMood] = useState(null);
  const [note, setNote] = useState('');

  const handleSubmit = () => {
    if (!mood) return;
    onDone(mood, note);
  };

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60);
    return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
  };

  return (
    <div className="app mood-screen">
      <h2 className="mood-title">Session done.</h2>
      <p className="mood-subtitle">{formatDuration(duration)} completed. How do you feel?</p>
      <div className="mood-picker">
        {MOODS.map((emoji, i) => (
          <button
            key={i}
            className={`mood-btn ${mood === i + 1 ? 'mood-selected' : ''}`}
            onClick={() => setMood(i + 1)}
          >
            {emoji}
          </button>
        ))}
      </div>
      <textarea
        className="mood-note"
        placeholder="Any thoughts? (optional)"
        value={note}
        onChange={e => setNote(e.target.value)}
        rows={3}
      />
      <button onClick={handleSubmit} disabled={!mood} className="mood-submit">
        Continue
      </button>
    </div>
  );
}

export default function App() {
  const [duration, setDuration] = useState(5);
  const [timeLeft, setTimeLeft] = useState(5);
  const [isRunning, setIsRunning] = useState(false);
  const [breathPhase, setBreathPhase] = useState('inhale');
  const [selectedSound, setSelectedSound] = useState(null);
  const [volume, setVolume] = useState(0.5);
  const [customHours, setCustomHours] = useState('');
  const [customMinutes, setCustomMinutes] = useState('');
  const [customSeconds, setCustomSeconds] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [screen, setScreen] = useState('timer');
  const [sessions, setSessions] = useState(getSessionsFromStorage());
  const [quote, setQuote] = useState(null);
  const [pendingDuration, setPendingDuration] = useState(null);
  const intervalRef = useRef(null);
  const breathRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    fetch('https://zenquotes.io/api/random')
      .then(r => r.json())
      .then(data => setQuote({ text: data[0].q, author: data[0].a }))
      .catch(() => setQuote({ text: 'Breathe. You are exactly where you need to be.', author: 'Unknown' }));
  }, []);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      setPendingDuration(duration);
      setScreen('mood');
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, timeLeft]);

  useEffect(() => {
    if (isRunning) {
      const cycle = () => {
        setBreathPhase('inhale');
        breathRef.current = setTimeout(() => {
          setBreathPhase('hold');
          breathRef.current = setTimeout(() => {
            setBreathPhase('exhale');
            breathRef.current = setTimeout(cycle, 8000);
          }, 4000);
        }, 4000);
      };
      cycle();
    } else {
      clearTimeout(breathRef.current);
      setBreathPhase('inhale');
    }
    return () => clearTimeout(breathRef.current);
  }, [isRunning]);

  useEffect(() => {
    if (isRunning && selectedSound) {
      audioRef.current = new Audio(selectedSound);
      audioRef.current.loop = true;
      audioRef.current.volume = volume;
      audioRef.current.play();
    } else {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    }
    return () => { if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; } };
  }, [isRunning, selectedSound]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const handleStartPause = () => setIsRunning(prev => !prev);

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(duration);
    setBreathPhase('inhale');
    setScreen('timer');
  };

  const handleDurationChange = (mins) => {
    const secs = mins * 60;
    setDuration(secs);
    setTimeLeft(secs);
    setIsRunning(false);
    setBreathPhase('inhale');
    setShowCustomInput(false);
  };

  const handleCustomSubmit = () => {
    const total = (parseInt(customHours) || 0) * 3600 + (parseInt(customMinutes) || 0) * 60 + (parseInt(customSeconds) || 0);
    if (total <= 0) return;
    handleDurationChange(total / 60);
    setCustomHours(''); setCustomMinutes(''); setCustomSeconds('');
    setShowCustomInput(false);
  };

  const handleMoodDone = (mood, note) => {
    saveSession(pendingDuration, mood, note);
    setSessions(getSessionsFromStorage());
    setScreen('complete');
  };

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60);
    return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
  };

  const breathLabel = { inhale: 'Breathe In', hold: 'Hold', exhale: 'Breathe Out' };

  if (screen === 'mood') return <MoodScreen duration={pendingDuration} onDone={handleMoodDone} />;

  if (screen === 'complete') {
    return (
      <div className="app complete-screen">
        <Particles active={true} />
        <div className="confetti-text">🎉</div>
        <h2 className="complete-title">You did it.</h2>
        <p className="complete-subtitle">{formatDuration(pendingDuration)} of pure focus. That's not nothing.</p>
        <div className="complete-badge">
          <span className="badge-time">{formatDuration(pendingDuration)}</span>
          <span className="badge-label">Session Complete</span>
        </div>
        <button className="complete-btn" onClick={handleReset}>Meditate Again</button>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <div className="app">
        <Particles active={isRunning} />
        <h1>Meditation Timer</h1>

        {quote && (
          <div className="quote-box">
            <p className="quote-text">"{quote.text}"</p>
            <p className="quote-author">— {quote.author}</p>
          </div>
        )}

        <div className="circle-container">
          <svg className="progress-ring" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
            <circle
              cx="100" cy="100" r="90"
              fill="none"
              stroke="rgba(100,140,255,0.8)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 90}
              strokeDashoffset={2 * Math.PI * 90 * (1 - timeLeft / duration)}
              transform="rotate(-90 100 100)"
            />
          </svg>
          <div className={`breath-circle ${breathPhase}`}>
            <span>{isRunning ? breathLabel[breathPhase] : 'Ready'}</span>
          </div>
        </div>

        <div className="timer">{formatTime(timeLeft)}</div>

        <div className="duration-picker">
          {[5, 10, 15, 20].map(min => (
            <button key={min} className={duration === min * 60 && !showCustomInput ? 'active' : ''} onClick={() => handleDurationChange(min)}>{min}m</button>
          ))}
          <button className={showCustomInput ? 'active' : ''} onClick={() => setShowCustomInput(prev => !prev)}>Custom</button>
        </div>

        {showCustomInput && (
          <div className="custom-input">
            <input type="number" placeholder="hrs" value={customHours} onChange={e => setCustomHours(e.target.value)} min="0" />
            <input type="number" placeholder="min" value={customMinutes} onChange={e => setCustomMinutes(e.target.value)} min="0" max="59" />
            <input type="number" placeholder="sec" value={customSeconds} onChange={e => setCustomSeconds(e.target.value)} min="0" max="59" />
            <button onClick={handleCustomSubmit}>Set</button>
          </div>
        )}

        <div className="sound-picker">
          {SOUNDS.map(sound => (
            <button key={sound.label} className={selectedSound === sound.url ? 'active' : ''} onClick={() => setSelectedSound(sound.url)}>{sound.label}</button>
          ))}
        </div>

        <div className="volume-control">
          <span>Vol</span>
          <input type="range" min="0" max="1" step="0.01" value={volume} onChange={e => setVolume(parseFloat(e.target.value))} />
        </div>

        <div className="controls">
          <button onClick={handleStartPause}>{isRunning ? 'Pause' : 'Start'}</button>
          <button onClick={handleReset}>Reset</button>
        </div>
      </div>

      <StatsPanel sessions={sessions} />
    </div>
  );
}