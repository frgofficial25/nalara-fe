import React from 'react';
import { QuizQuestion, QuizOption } from '../../types/quiz.types';
import Card from './Card';

interface QuestionCardProps {
  question: QuizQuestion;
  index: number;
  totalQuestions: number;
  selectedOptionId?: string;
  selectedOptionIds?: string[];
  numericAnswer?: number;
  textAnswer?: string;
  onMCQSelect: (optionId: string) => void;
  onMultiSelect: (optionId: string) => void;
  onNumericChange: (value: number) => void;
  onTextChange: (value: string) => void;
}

export default function QuestionCard({
  question,
  index,
  totalQuestions,
  selectedOptionId,
  selectedOptionIds = [],
  numericAnswer,
  textAnswer = '',
  onMCQSelect,
  onMultiSelect,
  onNumericChange,
  onTextChange,
}: QuestionCardProps) {
  const renderOptions = () => {
    const options = question.options || [];

    if (question.question_type === 'mcq' || question.question_type === 'true_false') {
      return (
        <div style={styles.optionsGrid}>
          {options.map((option) => {
            const isSelected = selectedOptionId === option.id;
            return (
              <button
                key={option.id}
                id={`opt-${option.id}`}
                onClick={() => onMCQSelect(option.id)}
                style={{
                  ...styles.optionBtn,
                  ...(isSelected ? styles.optionBtnActive : {}),
                }}
              >
                <span style={{
                  ...styles.optionLabel,
                  ...(isSelected ? styles.optionLabelActive : {}),
                }}>
                  {option.option_label}
                </span>
                <span style={styles.optionText}>{option.option_text}</span>
              </button>
            );
          })}
        </div>
      );
    }

    if (question.question_type === 'multi_select') {
      return (
        <div style={styles.optionsGrid}>
          {options.map((option) => {
            const isSelected = selectedOptionIds.includes(option.id);
            return (
              <button
                key={option.id}
                id={`opt-multi-${option.id}`}
                onClick={() => onMultiSelect(option.id)}
                style={{
                  ...styles.optionBtn,
                  ...(isSelected ? styles.optionBtnActive : {}),
                }}
              >
                <div style={{
                  ...styles.checkbox,
                  ...(isSelected ? styles.checkboxActive : {}),
                }}>
                  {isSelected && '✓'}
                </div>
                <span style={styles.optionText}>{option.option_text}</span>
              </button>
            );
          })}
        </div>
      );
    }

    if (question.question_type === 'numeric') {
      return (
        <div style={styles.inputContainer}>
          <label htmlFor={`num-input-${question.id}`} style={styles.inputLabel}>
            Masukkan Jawaban Angka:
          </label>
          <input
            id={`num-input-${question.id}`}
            type="number"
            value={numericAnswer !== undefined ? numericAnswer : ''}
            onChange={(e) => onNumericChange(parseFloat(e.target.value))}
            placeholder="Contoh: 1600000"
            style={styles.textInput}
          />
        </div>
      );
    }

    if (question.question_type === 'short_answer') {
      return (
        <div style={styles.inputContainer}>
          <label htmlFor={`text-input-${question.id}`} style={styles.inputLabel}>
            Masukkan Jawaban Anda:
          </label>
          <input
            id={`text-input-${question.id}`}
            type="text"
            value={textAnswer}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder="Tulis jawaban disini..."
            style={styles.textInput}
          />
        </div>
      );
    }

    return null;
  };

  return (
    <Card style={styles.card}>
      <div style={styles.header}>
        <span className="badge badge-secondary" style={styles.badge}>
          Pertanyaan {index + 1} dari {totalQuestions}
        </span>
        <span className="badge badge-primary" style={styles.badge}>
          {question.points} Poin
        </span>
      </div>

      <h2 style={styles.questionText}>{question.question_text}</h2>

      {question.topic_tag && (
        <div style={styles.topicContainer}>
          <span style={styles.topicLabel}>Topik:</span>
          <span className="badge badge-warning">{question.topic_tag}</span>
        </div>
      )}

      <div style={styles.divider} />

      <div style={styles.body}>{renderOptions()}</div>
    </Card>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    padding: '2rem',
    width: '100%',
    maxWidth: '800px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '1.5rem',
  },
  badge: {
    fontSize: '0.8rem',
  },
  questionText: {
    fontSize: '1.4rem',
    marginBottom: '1rem',
    lineHeight: '1.4',
  },
  topicContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '1.5rem',
  },
  topicLabel: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
  },
  divider: {
    height: '1px',
    background: 'var(--border-color)',
    marginBottom: '1.5rem',
  },
  body: {
    display: 'flex',
    flexDirection: 'column',
  },
  optionsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '1rem',
  },
  optionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem 1.25rem',
    borderRadius: '12px',
    border: '1px solid var(--border-color)',
    background: 'rgba(255, 255, 255, 0.02)',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    textAlign: 'left',
    fontSize: '1rem',
    transition: 'all 0.2s ease',
  },
  optionBtnActive: {
    borderColor: 'var(--primary)',
    background: 'rgba(99, 102, 241, 0.1)',
    boxShadow: '0 0 12px rgba(99, 102, 241, 0.2)',
  },
  optionLabel: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.05)',
    fontWeight: 'bold',
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    transition: 'all 0.2s ease',
  },
  optionLabelActive: {
    background: 'var(--primary)',
    color: '#ffffff',
  },
  optionText: {
    flex: 1,
    lineHeight: '1.4',
  },
  checkbox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    borderRadius: '6px',
    border: '2px solid var(--border-color)',
    background: 'transparent',
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: '0.85rem',
    transition: 'all 0.2s ease',
  },
  checkboxActive: {
    background: 'var(--primary)',
    borderColor: 'var(--primary)',
  },
  inputContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  inputLabel: {
    fontSize: '0.95rem',
    color: 'var(--text-secondary)',
  },
  textInput: {
    padding: '1rem',
    borderRadius: '10px',
    border: '1px solid var(--border-color)',
    background: 'rgba(255, 255, 255, 0.03)',
    color: 'var(--text-primary)',
    fontSize: '1.1rem',
    outline: 'none',
    transition: 'all 0.2s ease',
  },
};
