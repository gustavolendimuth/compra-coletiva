import type { Metadata } from 'next';
import { SEOPage } from './SEOPage';

export const metadata: Metadata = {
  title: 'SEO',
};

export default function AdminSEO() {
  return <SEOPage />;
}
