import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCampaignDetail } from "./campaign-detail/useCampaignDetail";
import { LoadingSkeleton } from "./campaign-detail/LoadingSkeleton";
import { CampaignHeader } from "./campaign-detail";
import { TabNavigation } from "./campaign-detail";
import { OverviewTab } from "./campaign-detail/tabs/OverviewTab";
import { ProductsTab } from "./campaign-detail/tabs/ProductsTab";
import { OrdersTab } from "./campaign-detail/tabs/OrdersTab";
import { ShippingTab } from "./campaign-detail/tabs/ShippingTab";
import { QuestionsTab } from "./campaign-detail/tabs/QuestionsTab";
import { CampaignModals } from "./campaign-detail/CampaignModals";

export default function CampaignDetail() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "overview" | "products" | "orders" | "shipping" | "questions"
  >("overview");
  const hook = useCampaignDetail();

  // Handle navigation from notifications
  useEffect(() => {
    if (hook.shouldOpenQuestionsTab) {
      setActiveTab("questions");
      hook.setShouldOpenQuestionsTab(false);
    }
  }, [hook.shouldOpenQuestionsTab, hook.setShouldOpenQuestionsTab]);

  if (!hook.campaign) {
    return <LoadingSkeleton />;
  }

  return (
    <div>
      <div className="mb-4 md:mb-6">
        <CampaignHeader
          campaign={hook.campaign}
          canEditCampaign={hook.canEditCampaign}
          ordersCount={hook.orders?.length || 0}
          onEditDeadline={hook.handleOpenEditDeadline}
          onCloseCampaign={() => hook.setIsCloseConfirmOpen(true)}
          onReopenCampaign={() => hook.setIsReopenConfirmOpen(true)}
          onMarkAsSent={() => hook.setIsSentConfirmOpen(true)}
          onUpdateCampaign={hook.handleUpdateCampaign}
          onCloneCampaign={hook.handleOpenCloneModal}
          onImageUpload={() => hook.setIsImageUploadModalOpen(true)}
        />
      </div>

      <TabNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        canEditCampaign={hook.canEditCampaign}
      />

      {activeTab === "overview" && hook.analytics && (
        <OverviewTab
          campaignId={hook.campaign.id}
          analytics={hook.analytics}
          products={hook.products || []}
          orders={hook.orders || []}
          isActive={hook.isActive}
          canEditCampaign={hook.canEditCampaign}
          onAddProduct={() => hook.setIsProductModalOpen(true)}
          onAddOrder={hook.handleAddOrder}
          onViewOrder={(order) => {
            hook.setViewingOrder(order);
            hook.setIsViewOrderModalOpen(true);
          }}
          onTogglePayment={hook.handleTogglePayment}
          onAddToOrder={hook.handleAddToOrder}
        />
      )}

      {activeTab === "products" && (
        <ProductsTab
          products={hook.products || []}
          sortedProducts={hook.sortedProducts || []}
          isActive={hook.isActive}
          canEditCampaign={hook.canEditCampaign}
          sortField={hook.productSortField}
          sortDirection={hook.productSortDirection}
          onAddProduct={() => hook.setIsProductModalOpen(true)}
          onEditProduct={hook.openEditProductModal}
          onDeleteProduct={hook.handleDeleteProduct}
          onSort={hook.handleProductSort}
        />
      )}

      {activeTab === "orders" && (
        <OrdersTab
          orders={hook.orders || []}
          filteredOrders={hook.filteredOrders || []}
          isActive={hook.isActive}
          canEditCampaign={hook.canEditCampaign}
          currentUserId={user?.id}
          orderSearch={hook.orderSearch}
          sortField={hook.orderSortField}
          sortDirection={hook.orderSortDirection}
          onAddOrder={hook.handleAddOrder}
          onViewOrder={(order) => {
            hook.setViewingOrder(order);
            hook.setIsViewOrderModalOpen(true);
          }}
          onTogglePayment={hook.handleTogglePayment}
          onEditOrder={hook.openEditOrderModal}
          onDeleteOrder={hook.handleDeleteOrder}
          onSearchChange={hook.setOrderSearch}
          onSort={hook.handleSort}
        />
      )}

      {activeTab === "shipping" && hook.campaign && (
        <ShippingTab
          campaign={hook.campaign}
          isActive={hook.isActive}
          canEditCampaign={hook.canEditCampaign}
          onEditShipping={() => {
            hook.setShippingCost(String(hook.campaign!.shippingCost));
            hook.setIsShippingModalOpen(true);
          }}
        />
      )}

      {activeTab === "questions" && hook.canEditCampaign && (
        <QuestionsTab
          campaignId={hook.campaign.id}
          canEditCampaign={hook.canEditCampaign}
        />
      )}

      <CampaignModals hook={hook} />
    </div>
  );
}
