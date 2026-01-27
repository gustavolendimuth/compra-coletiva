import type { Metadata } from 'next';
import { MessagesPage } from './MessagesPage';

export const metadata: Metadata = {
  title: 'Mensagens',
};

export default function AdminMessages() {
  return <MessagesPage />;
}
