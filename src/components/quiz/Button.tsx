import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'disabled';
  children: React.ReactNode;
}

export default function Button({
  variant = 'primary',
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const btnClass =
    variant === 'primary'
      ? 'premium-btn premium-btn-primary'
      : variant === 'secondary'
      ? 'premium-btn premium-btn-secondary'
      : 'premium-btn premium-btn-disabled';

  return (
    <button
      className={`${btnClass} ${className}`}
      disabled={disabled || variant === 'disabled'}
      {...props}
    >
      {children}
    </button>
  );
}
