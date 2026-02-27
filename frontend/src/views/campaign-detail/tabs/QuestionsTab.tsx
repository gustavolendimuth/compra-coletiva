import { MessageCircle } from "lucide-react";
import { CampaignQuestionsPanel } from "@/components/campaign";

interface QuestionsTabProps {
  campaignId: string;
  canEditCampaign: boolean;
}

export function QuestionsTab({
  campaignId,
  canEditCampaign,
}: QuestionsTabProps) {
  if (!canEditCampaign) {
    return null;
  }

  return (
    <div className="pb-20 md:pb-0">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="font-display text-2xl font-bold text-sky-900 mb-2 flex items-center gap-2">
            <span className="w-7 h-7 rounded-xl bg-sky-100 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-4 h-4 text-sky-600" />
            </span>
            Moderar Perguntas
          </h2>
          <p className="text-sky-700">
            Responda as perguntas dos usuários. Suas respostas serão publicadas
            automaticamente.
          </p>
        </div>
        <CampaignQuestionsPanel campaignId={campaignId} />
      </div>
    </div>
  );
}
