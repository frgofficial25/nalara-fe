import React, { useEffect } from 'react';
import Card from './Card';

interface QuizTimerProps {
  secondsLeft: number;
  formattedTime: string;
  onTick: () => void;
  isRunning: boolean;
}

export default function QuizTimer({
  secondsLeft,
  formattedTime,
  onTick,
  isRunning,
}: QuizTimerProps) {
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      onTick();
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, onTick]);

  const isLowTime = secondsLeft < 60;
  const timerColorClass = isLowTime ? 'badge-danger' : 'badge-primary';

  return (
    <Card style={styles.timerCard}>
      <span style={styles.timerLabel}>Sisa Waktu:</span>
      <span
        id="quiz-timer"
        className={`badge ${timerColorClass}`}
        style={{
          ...styles.timerValue,
          ...(isLowTime ? styles.timerValueLow : {}),
        }}
      >
        {formattedTime}
      </span>
    </Card>
  );
}

const styles: Record<string, React.CSSProperties> = {
  timerCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '0.75rem 1.25rem',
    borderRadius: '12px',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-color)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
  },
  timerLabel: {
    fontSize: '0.9rem',
    fontWeight: 500,
    color: 'var(--text-secondary)',
  },
  timerValue: {
    fontSize: '1.1rem',
    fontWeight: 'bold',
    fontFamily: 'monospace',
    padding: '0.4rem 0.8rem',
    minWidth: '70px',
    textAlign: 'center',
  },
  timerValueLow: {
    animation: 'pulseBorder 1s infinite',
  },
};
