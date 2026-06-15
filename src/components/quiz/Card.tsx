import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  glow?: boolean;
}

export default function Card({ children, className = '', glow = false, ...props }: CardProps) {
  const cardClass = `glass-panel ${glow ? 'glow-on-hover' : ''} ${className}`;

  return (
    <div className={cardClass} {...props}>
      {children}
    </div>
  );
}
