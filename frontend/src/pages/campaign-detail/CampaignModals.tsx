import { useAuth } from '@/contexts/AuthContext';
import { AddProductModal, EditProductModal } from './modals/ProductModals';
import { EditOrderModal, ViewOrderModal } from './modals/OrderModals';
import {
  ShippingModal,
  DeadlineModal,
  PixModal,
  CloseConfirmDialog,
  ReopenConfirmDialog,
  SentConfirmDialog,
  CloneModal,
} from './modals/CampaignModals';
import { ImageUploadModal } from './modals/ImageUploadModal';
import { PaymentProofModal } from './modals/PaymentProofModal';

interface CampaignModalsProps {
  hook: any;
}

export function CampaignModals({ hook }: CampaignModalsProps) {
  const { user } = useAuth();

  return (
    <>
      <AddProductModal
        isOpen={hook.isProductModalOpen}
        form={hook.productForm}
        isPending={hook.createProductMutation.isPending}
        onClose={() => hook.setIsProductModalOpen(false)}
        onChange={hook.setProductForm}
        onSubmit={hook.handleCreateProduct}
      />

      <EditProductModal
        isOpen={hook.isEditProductModalOpen}
        form={hook.editProductForm}
        isPending={hook.updateProductMutation.isPending}
        onClose={() => hook.setIsEditProductModalOpen(false)}
        onChange={hook.setEditProductForm}
        onSubmit={hook.handleEditProduct}
      />

      <EditOrderModal
        isOpen={hook.isEditOrderModalOpen}
        form={hook.editOrderForm}
        products={hook.alphabeticalProducts || []}
        onClose={() => {
          hook.setIsEditOrderModalOpen(false);
          hook.setEditingOrder(null);
        }}
        onChange={hook.setEditOrderForm}
        isAutosaving={hook.isAutosaving}
        lastSaved={hook.lastSaved}
      />

      <ViewOrderModal
        isOpen={hook.isViewOrderModalOpen}
        order={hook.viewingOrder}
        isActive={hook.isActive}
        canEdit={!!(user?.id === hook.viewingOrder?.userId || hook.canEditCampaign)}
        onClose={() => {
          hook.setIsViewOrderModalOpen(false);
          hook.setViewingOrder(null);
        }}
        onEdit={hook.handleEditOrderFromView}
      />

      <PaymentProofModal
        isOpen={hook.isPaymentProofModalOpen}
        order={hook.orderForPayment}
        isPending={hook.updatePaymentMutation.isPending}
        onClose={() => {
          hook.setIsPaymentProofModalOpen(false);
          hook.setOrderForPayment(null);
        }}
        onSubmit={hook.handlePaymentProofSubmit}
      />

      <ShippingModal
        isOpen={hook.isShippingModalOpen}
        shippingCost={hook.shippingCost}
        isPending={hook.updateShippingMutation.isPending}
        onClose={() => hook.setIsShippingModalOpen(false)}
        onChange={hook.setShippingCost}
        onSubmit={hook.handleUpdateShipping}
      />

      <DeadlineModal
        isOpen={hook.isEditDeadlineModalOpen}
        campaign={hook.campaign}
        deadlineForm={hook.deadlineForm}
        isPending={hook.updateDeadlineMutation.isPending}
        onClose={() => hook.setIsEditDeadlineModalOpen(false)}
        onChange={hook.setDeadlineForm}
        onSubmit={hook.handleUpdateDeadline}
        onRemove={() => {
          hook.setDeadlineForm('');
          hook.handleUpdateDeadline({ preventDefault: () => {} } as React.FormEvent);
        }}
      />

      <PixModal
        isOpen={hook.isPixModalOpen}
        pixKey={hook.pixKey}
        pixType={hook.pixType}
        pixName={hook.pixName}
        pixVisibleAtStatus={hook.pixVisibleAtStatus}
        isPending={hook.updatePixMutation.isPending}
        onClose={() => hook.setIsPixModalOpen(false)}
        onChangePixKey={hook.setPixKey}
        onChangePixType={hook.setPixType}
        onChangePixName={hook.setPixName}
        onChangePixVisibleAtStatus={hook.setPixVisibleAtStatus}
        onSubmit={hook.handleUpdatePix}
        onRemove={hook.handleRemovePix}
      />

      <CloseConfirmDialog
        isOpen={hook.isCloseConfirmOpen}
        onClose={() => hook.setIsCloseConfirmOpen(false)}
        onConfirm={() => hook.handleUpdateStatus('CLOSED')}
      />

      <ReopenConfirmDialog
        isOpen={hook.isReopenConfirmOpen}
        onClose={() => hook.setIsReopenConfirmOpen(false)}
        onConfirm={hook.handleReopenCampaign}
      />

      <SentConfirmDialog
        isOpen={hook.isSentConfirmOpen}
        onClose={() => hook.setIsSentConfirmOpen(false)}
        onConfirm={() => hook.handleUpdateStatus('SENT')}
      />

      <CloneModal
        isOpen={hook.isCloneModalOpen}
        campaign={hook.campaign}
        cloneName={hook.cloneName}
        cloneDescription={hook.cloneDescription}
        isPending={hook.cloneCampaignMutation?.isPending || false}
        onClose={() => hook.setIsCloneModalOpen(false)}
        onChangeName={hook.setCloneName}
        onChangeDescription={hook.setCloneDescription}
        onSubmit={hook.handleCloneCampaign}
      />

      <ImageUploadModal
        isOpen={hook.isImageUploadModalOpen}
        onClose={() => hook.setIsImageUploadModalOpen(false)}
        campaignSlug={hook.campaign?.slug || ''}
        currentImageUrl={hook.campaign?.imageUrl}
      />
    </>
  );
}
