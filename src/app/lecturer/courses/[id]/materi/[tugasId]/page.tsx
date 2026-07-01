import React from 'react';
import MateriDetailClient from './MateriDetailClient';

export function generateStaticParams() {
  return [{ id: 'dummy', tugasId: 'dummy' }];
}

export default function MateriDetailPage() {
  return <MateriDetailClient />;
}
