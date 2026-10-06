'use client';

import React from 'react';
import { AppShell } from '@/components/layout/AppShell';

export default function MasterLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
