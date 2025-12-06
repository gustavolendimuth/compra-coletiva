import { useAuth } from '@/contexts/AuthContext';
import { AddProductModal, EditProductModal } from './modals/ProductModals';
import { AddOrderModal, EditOrderModal, ViewOrderModal } from './modals/OrderModals';
import {
  ShippingModal,
  DeadlineModal,
  CloseConfirmDialog,
  ReopenConfirmDialog,
  SentConfirmDialog,
} from './modals/CampaignModals';

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

      <AddOrderModal
        isOpen={hook.isOrderModalOpen}
        form={hook.orderForm}
        products={hook.alphabeticalProducts || []}
        isPending={hook.createOrderMutation.isPending}
        onClose={hook.handleCloseOrderModal}
        onChange={hook.setOrderForm}
      />

      <EditOrderModal
        isOpen={hook.isEditOrderModalOpen}
        form={hook.editOrderForm}
        products={hook.alphabeticalProducts || []}
        isPending={hook.updateOrderWithItemsMutation.isPending}
        onClose={() => {
          hook.setIsEditOrderModalOpen(false);
          hook.setEditingOrder(null);
        }}
        onChange={hook.setEditOrderForm}
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
    </>
  );
}
