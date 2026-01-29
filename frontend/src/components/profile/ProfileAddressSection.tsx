import { useState } from 'react';
import { AddressForm, type AddressData } from '@/components/ui/AddressForm';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/api';
import { authStorage } from '@/lib/authStorage';
import toast from 'react-hot-toast';

export function ProfileAddressSection() {
  const { user, setUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [address, setAddress] = useState<AddressData>({
    zipCode: user?.defaultZipCode || '',
    address: user?.defaultAddress || '',
    addressNumber: user?.defaultAddressNumber || '',
    complement: '',
    neighborhood: user?.defaultNeighborhood || '',
    city: user?.defaultCity || '',
    state: user?.defaultState || '',
  });

  const hasAddress = user?.defaultAddress && user?.defaultCity;

  const handleSave = async () => {
    if (!address.zipCode || !address.address || !address.addressNumber) {
      toast.error('Preencha CEP, endereço e número');
      return;
    }

    setIsLoading(true);
    try {
      const updatedUser = await authService.completeAddress({
        zipCode: address.zipCode,
        address: address.address,
        addressNumber: address.addressNumber,
        neighborhood: address.neighborhood,
        city: address.city,
        state: address.state,
      });
      setUser(updatedUser);
      authStorage.setUser(updatedUser);
      toast.success('Endereço atualizado!');
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar endereço');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Endereço Padrão
        </h3>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {hasAddress ? 'Editar' : 'Adicionar'}
          </button>
        )}
      </div>

      {!isEditing ? (
        hasAddress ? (
          <div className="text-sm text-gray-700">
            <p className="font-medium">{user?.defaultAddress}, {user?.defaultAddressNumber}</p>
            <p className="text-gray-500">
              {user?.defaultNeighborhood && `${user.defaultNeighborhood} - `}
              {user?.defaultCity} - {user?.defaultState}
            </p>
            <p className="text-gray-400 text-xs mt-1">CEP: {user?.defaultZipCode}</p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Adicione seu endereço para ver a distância até os pontos de retirada das campanhas.
          </p>
        )
      ) : (
        <div className="space-y-4">
          <AddressForm
            value={address}
            onChange={setAddress}
            disabled={isLoading}
          />
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={isLoading} className="flex-1">
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button
              onClick={() => setIsEditing(false)}
              disabled={isLoading}
              variant="secondary"
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
