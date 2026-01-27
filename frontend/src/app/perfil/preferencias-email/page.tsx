import type { Metadata } from 'next';
import { EmailPreferencesPage } from './EmailPreferencesPage';

export const metadata: Metadata = {
  title: 'Preferências de Email',
};

export default function EmailPreferences() {
  return <EmailPreferencesPage />;
}
