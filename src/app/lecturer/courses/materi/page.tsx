import React, { Suspense } from 'react';
import MateriDetailClient from './MateriDetailClient';

export default function MateriDetailPage() {
  return (
    <Suspense fallback={
      <div style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--grey-blue)', fontFamily: 'sans-serif' }}>
        Loading material details...
      </div>
    }>
      <MateriDetailClient />
    </Suspense>
  );
}
