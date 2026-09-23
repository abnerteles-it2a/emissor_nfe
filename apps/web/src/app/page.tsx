import React from 'react';
import { fetchFiscalDocuments } from '@/lib/api';
import { DashboardView } from '@/components/DashboardView';

export const revalidate = 0;

export default async function DashboardPage() {
  const documents = await fetchFiscalDocuments().catch(() => []);

  return <DashboardView initialDocuments={documents} />;
}
