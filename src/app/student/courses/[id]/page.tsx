import React from 'react';
import CourseDetailClient from './CourseDetailClient';

export function generateStaticParams() {
  return [{ id: 'dummy' }];
}

export default function CourseDetailPage() {
  return <CourseDetailClient />;
}
