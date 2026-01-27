import type { Metadata } from 'next';
import { CampaignsPage } from './CampaignsPage';

export const metadata: Metadata = {
  title: 'Campanhas',
};

export default function AdminCampaigns() {
  return <CampaignsPage />;
}
