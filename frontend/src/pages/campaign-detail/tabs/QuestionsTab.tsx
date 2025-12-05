import { CampaignQuestionsPanel } from '@/components/campaign';

interface QuestionsTabProps {
  campaignId: string;
  canEditCampaign: boolean;
}

export function QuestionsTab({ campaignId, canEditCampaign }: QuestionsTabProps) {
  if (!canEditCampaign) {
    return null;
  }

  return (
    <div className="pb-20 md:pb-0">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Moderar Perguntas</h2>
          <p className="text-gray-600">
            Responda as perguntas dos usuários. Suas respostas serão publicadas automaticamente.
          </p>
        </div>
        <CampaignQuestionsPanel campaignId={campaignId} />
      </div>
    </div>
  );
}
