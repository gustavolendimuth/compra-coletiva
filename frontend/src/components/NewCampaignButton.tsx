'use client';

import { useState } from "react";
import { Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui";
import { NewCampaignModal } from "./NewCampaignModal";

interface NewCampaignButtonProps {
  onModalOpen?: () => void; // Callback when modal is opened
}

export const NewCampaignButton: React.FC<NewCampaignButtonProps> = ({
  onModalOpen,
}) => {
  const { requireAuth } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleNewCampaignClick = () => {
    requireAuth(() => {
      setIsModalOpen(true);
      onModalOpen?.(); // Call callback if provided
    });
  };

  return (
    <>
      <Button
        onClick={handleNewCampaignClick}
        className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 text-sm md:text-base"
      >
        <Plus className="w-4 h-4 md:w-5 md:h-5" />
        <span className="hidden md:inline">Nova Campanha</span>
        <span className="md:hidden">Nova</span>
      </Button>

      <NewCampaignModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};
