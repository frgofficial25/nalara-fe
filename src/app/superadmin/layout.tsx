import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function SuperadminLayout({
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
