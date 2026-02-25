'use client';

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";
import { campaignApi, campaignService } from "@/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button, Modal, Input, Textarea, ImageUpload } from "@/components/ui";
import { AddressForm, type AddressData } from "@/components/ui/AddressForm";
import DateTimeInput from "@/components/DateTimeInput";
import { applyPixMask, removeMask, getPixPlaceholder } from "@/lib/pixMasks";

interface NewCampaignButtonProps {
  onModalOpen?: () => void; // Callback when modal is opened
}

export const NewCampaignButton: React.FC<NewCampaignButtonProps> = ({
  onModalOpen,
}) => {
  const { requireAuth, refreshUser } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [pickupAddress, setPickupAddress] = useState<AddressData>({
    zipCode: '',
    address: '',
    addressNumber: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
  });
  const [addressErrors, setAddressErrors] = useState<Partial<Record<keyof AddressData, string>>>({});
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    deadline: string;
    shippingCost: number | "";
    pixKey: string;
    pixType: "CPF" | "CNPJ" | "EMAIL" | "PHONE" | "RANDOM" | "";
    pixName: string;
    pixVisibleAtStatus: "ACTIVE" | "CLOSED" | "SENT" | "ARCHIVED";
  }>({
    name: "",
    description: "",
    deadline: "",
    shippingCost: "",
    pixKey: "",
    pixType: "",
    pixName: "",
    pixVisibleAtStatus: "ACTIVE",
  });

  const queryClient = useQueryClient();

  // Clear PIX key when type changes to avoid inconsistencies
  useEffect(() => {
    if (formData.pixType) {
      setFormData((prev) => ({ ...prev, pixKey: "" }));
    }
  }, [formData.pixType]);

  const createMutation = useMutation({
    mutationFn: campaignApi.create,
    onSuccess: async (createdCampaign) => {
      // Upload image if selected
      if (selectedImage) {
        try {
          await campaignService.uploadImage(createdCampaign.slug, selectedImage);
        } catch (error) {
          toast.error("Campanha criada, mas erro ao enviar imagem");
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      await refreshUser(); // Refresh user to get updated role
      toast.success("Campanha criada com sucesso!");
      setIsModalOpen(false);
      setFormData({
        name: "",
        description: "",
        deadline: "",
        shippingCost: "",
        pixKey: "",
        pixType: "",
        pixName: "",
        pixVisibleAtStatus: "ACTIVE",
      });
      setSelectedImage(null);
      setPickupAddress({
        zipCode: '',
        address: '',
        addressNumber: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
      });
      setAddressErrors({});
    },
    onError: () => {
      toast.error("Erro ao criar campanha");
    },
  });

  const validateAddress = (): boolean => {
    const errors: Partial<Record<keyof AddressData, string>> = {};
    const hasAnyField = pickupAddress.zipCode || pickupAddress.address || pickupAddress.city;

    if (hasAnyField) {
      if (!pickupAddress.zipCode || pickupAddress.zipCode.replace(/\D/g, '').length !== 8) {
        errors.zipCode = 'CEP é obrigatório';
      }
      if (!pickupAddress.address) {
        errors.address = 'Endereço é obrigatório';
      }
      if (!pickupAddress.addressNumber) {
        errors.addressNumber = 'Número é obrigatório';
      }
    }

    setAddressErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateAddress()) return;

    const shippingCost =
      typeof formData.shippingCost === "number" ? formData.shippingCost : 0;

    // Remove mask from PIX key before sending
    const cleanPixKey = formData.pixKey
      ? removeMask(formData.pixKey, formData.pixType)
      : undefined;

    const hasAddress = pickupAddress.zipCode && pickupAddress.address;

    createMutation.mutate({
      name: formData.name,
      description: formData.description,
      deadline: formData.deadline,
      shippingCost,
      pixKey: cleanPixKey,
      pixType: formData.pixType || undefined,
      pixName: formData.pixName || undefined,
      pixVisibleAtStatus: formData.pixVisibleAtStatus,
      ...(hasAddress && {
        pickupZipCode: pickupAddress.zipCode.replace(/\D/g, ''),
        pickupAddress: pickupAddress.address,
        pickupAddressNumber: pickupAddress.addressNumber,
        pickupComplement: pickupAddress.complement || undefined,
        pickupNeighborhood: pickupAddress.neighborhood,
        pickupCity: pickupAddress.city,
        pickupState: pickupAddress.state,
      }),
    });
  };

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

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nova Campanha"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-sky-800 mb-2">
              Imagem da Campanha (opcional)
            </label>
            <ImageUpload
              onImageSelect={setSelectedImage}
              onImageRemove={() => setSelectedImage(null)}
              disabled={createMutation.isPending}
            />
          </div>

          <Input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            label="Nome da Campanha *"
            placeholder="Ex: Café CEBB - Outubro 2025"
          />

          <Textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            label="Descrição"
            rows={3}
            placeholder="Descrição opcional da campanha"
          />

          <div>
            <label className="block text-sm font-medium text-sky-800 mb-2">
              Data Limite (opcional)
            </label>
            <DateTimeInput
              value={formData.deadline}
              onChange={(value) =>
                setFormData({ ...formData, deadline: value })
              }
            />
            <p className="text-sm text-sky-600/60 mt-2">
              A campanha será fechada automaticamente quando atingir esta data.
              Formato: dd/mm/aaaa HH:mm (24h)
            </p>
          </div>

          <Input
            type="number"
            step="0.01"
            min="0"
            value={formData.shippingCost}
            onChange={(e) =>
              setFormData({
                ...formData,
                shippingCost:
                  e.target.value === "" ? "" : parseFloat(e.target.value),
              })
            }
            label="Valor do Frete Total"
            placeholder="0.00"
          />

          <div className="border-t border-sky-100 pt-4">
            <h3 className="text-base font-display font-bold text-sky-900 mb-3">
              Configuração PIX (opcional)
            </h3>
            <p className="text-sm text-sky-700/50 mb-4">
              Configure a chave PIX para que os compradores possam visualizar e realizar pagamentos.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-sky-800 mb-2">
                  Tipo de Chave PIX
                </label>
                <select
                  value={formData.pixType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pixType: e.target.value as any,
                    })
                  }
                  className="w-full px-4 py-2.5 border border-sky-200 rounded-xl focus:ring-2 focus:ring-sky-400 focus:border-transparent text-base text-sky-900 bg-white transition-all"
                >
                  <option value="">Selecione o tipo</option>
                  <option value="CPF">CPF</option>
                  <option value="CNPJ">CNPJ</option>
                  <option value="EMAIL">E-mail</option>
                  <option value="PHONE">Telefone</option>
                  <option value="RANDOM">Chave Aleatória</option>
                </select>
              </div>

              <Input
                type="text"
                value={formData.pixKey}
                onChange={(e) => {
                  const maskedValue = applyPixMask(e.target.value, formData.pixType);
                  setFormData({ ...formData, pixKey: maskedValue });
                }}
                label="Chave PIX"
                placeholder={getPixPlaceholder(formData.pixType)}
                disabled={!formData.pixType}
              />

              <Input
                type="text"
                value={formData.pixName}
                onChange={(e) =>
                  setFormData({ ...formData, pixName: e.target.value })
                }
                label="Nome do Titular"
                placeholder="Nome do titular da conta PIX"
              />

              <div>
                <label className="block text-sm font-medium text-sky-800 mb-2">
                  Mostrar PIX quando a campanha estiver
                </label>
                <select
                  value={formData.pixVisibleAtStatus}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pixVisibleAtStatus: e.target.value as any,
                    })
                  }
                  className="w-full px-4 py-2.5 border border-sky-200 rounded-xl focus:ring-2 focus:ring-sky-400 focus:border-transparent text-base text-sky-900 bg-white transition-all"
                >
                  <option value="ACTIVE">Ativa</option>
                  <option value="CLOSED">Fechada</option>
                  <option value="SENT">Enviada</option>
                </select>
                <p className="text-sm text-sky-600/60 mt-2">
                  O PIX será exibido em destaque apenas quando a campanha atingir o status selecionado.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-sky-100 pt-4">
            <h3 className="text-base font-display font-bold text-sky-900 mb-3">
              Endereço de Retirada (opcional)
            </h3>
            <p className="text-sm text-sky-700/50 mb-4">
              Informe o local onde os compradores poderão retirar os produtos.
            </p>
            <AddressForm
              value={pickupAddress}
              onChange={setPickupAddress}
              errors={addressErrors}
              disabled={createMutation.isPending}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1"
            >
              {createMutation.isPending ? "Criando..." : "Criar Campanha"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};
