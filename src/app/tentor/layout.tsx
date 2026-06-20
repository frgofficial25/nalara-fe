import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function TentorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  );
}
