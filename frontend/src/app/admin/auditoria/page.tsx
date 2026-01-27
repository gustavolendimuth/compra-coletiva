import type { Metadata } from 'next';
import { AuditPage } from './AuditPage';

export const metadata: Metadata = {
  title: 'Auditoria',
};

export default function AdminAudit() {
  return <AuditPage />;
}
