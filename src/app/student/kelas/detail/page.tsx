import React, { Suspense } from 'react';
import CourseDetailClient from '../../courses/detail/CourseDetailClient';

export default function StudentKelasDetailPage() {
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
