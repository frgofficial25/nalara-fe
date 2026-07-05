import React, { Suspense } from 'react';
import QuizDetailClient from './QuizDetailClient';

export default function QuizDetailPage() {
  return (
    <Suspense fallback={
      <div style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--grey-blue)', fontFamily: 'sans-serif' }}>
        Memuat detail kuis...
      </div>
    }>
      <QuizDetailClient />
    </Suspense>
  );
}
