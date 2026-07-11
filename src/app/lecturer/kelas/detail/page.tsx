import React, { Suspense } from 'react';
import CourseDetailClient from './CourseDetailClient';

export default function CourseDetailPage() {
  return (
    <Suspense fallback={
      <div style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--grey-blue)', fontFamily: 'sans-serif' }}>
        Loading class details...
      </div>
    }>
      <CourseDetailClient />
    </Suspense>
  );
}
