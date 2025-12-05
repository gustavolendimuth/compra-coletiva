// Barrel export para componentes de campanha

// Card components
export { CampaignCard } from './CampaignCard';
export { CampaignCardHeader } from './CampaignCardHeader';
export { CampaignCardBody } from './CampaignCardBody';
export { CampaignCardFooter } from './CampaignCardFooter';

// Product preview components
export { ProductPreview } from './ProductPreview';
export { ProductPreviewInline } from './ProductPreviewInline';
export { ProductPreviewModal } from './ProductPreviewModal';
export type { ProductPreviewVariant } from './ProductPreview';

// Skeleton components
export { CampaignCardSkeleton, CampaignGridSkeleton } from './CampaignCardSkeleton';

// Filter components
export { CampaignFilters } from './CampaignFilters';
export type {
  CampaignFiltersState,
  CampaignStatusFilter,
  CampaignQuickFilter
} from './CampaignFilters';

// Chat components (refactored modular components)
export { default as CampaignChat } from './CampaignChat';
export { default as CampaignQuestionsPanel } from './CampaignQuestionsPanel';
export { default as OrderChat } from './OrderChat';
export { PublicQAItem } from './PublicQAItem';
export { PublicQAList } from './PublicQAList';
export { EditableQuestion } from './EditableQuestion';
export { MyQuestionsList } from './MyQuestionsList';
export { QuestionForm } from './QuestionForm';
export { QuestionsPanelTabs } from './QuestionsPanelTabs';
export { UnansweredQuestionItem } from './UnansweredQuestionItem';
export { AnsweredQuestionItem } from './AnsweredQuestionItem';
export { QuestionsPanelEmptyState } from './QuestionsPanelEmptyState';
export { MessageList } from './MessageList';
export { MessageInput } from './MessageInput';
export { ChatMessage } from './ChatMessage';
export { ChatEmptyState } from './ChatEmptyState';
export { DateDivider } from './DateDivider';

// Chat utilities
export * from './chatUtils';
