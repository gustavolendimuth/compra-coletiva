import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/api';
import { authStorage } from '@/lib/authStorage';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { AddressForm, type AddressData } from '@/components/ui/AddressForm';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import toast from 'react-hot-toast';

/**
 * CompleteProfile Page
 * Multi-step page for users to complete phone and address registration.
 * Step 1: Phone (if phoneCompleted === false)
 * Step 2: Address (if addressCompleted === false)
 */
export function CompleteProfile() {
  const { user, setUser } = useAuth();
  const isMountedRef = useRef(true);

  // Determine current step
  const needsPhone = user && !user.phoneCompleted;
  const needsAddress = user && !user.addressCompleted;
  const [currentStep, setCurrentStep] = useState<'phone' | 'address'>(
    needsPhone ? 'phone' : 'address'
  );

  // Phone state
  const [phone, setPhone] = useState('');
  const [isPhoneLoading, setIsPhoneLoading] = useState(false);

  // Address state
  const [address, setAddress] = useState<AddressData>({
    zipCode: '',
    address: '',
    addressNumber: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
  });
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const [addressErrors, setAddressErrors] = useState<Partial<Record<keyof AddressData, string>>>({});

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Update step when user data changes
  useEffect(() => {
    if (user?.phoneCompleted && !user?.addressCompleted) {
      setCurrentStep('address');
    }
  }, [user?.phoneCompleted, user?.addressCompleted]);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      toast.error('Por favor, informe um telefone válido');
      return;
    }

    setIsPhoneLoading(true);
    try {
      const updatedUser = await authService.completePhone({ phone });
      if (!isMountedRef.current) return;

      setUser(updatedUser);
      authStorage.setUser(updatedUser);
      toast.success('Telefone cadastrado!');

      // Move to address step if needed
      if (!updatedUser.addressCompleted) {
        setCurrentStep('address');
      } else {
        redirectToApp();
      }
    } catch (error: any) {
      if (!isMountedRef.current) return;
      toast.error(error.response?.data?.message || 'Erro ao cadastrar telefone');
      setIsPhoneLoading(false);
    }
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const errors: Partial<Record<keyof AddressData, string>> = {};
    if (!address.zipCode || address.zipCode.replace(/\D/g, '').length !== 8) {
      errors.zipCode = 'CEP inválido';
    }
    if (!address.address) {
      errors.address = 'Busque um CEP válido';
    }
    if (!address.addressNumber) {
      errors.addressNumber = 'Informe o número';
    }
    if (Object.keys(errors).length > 0) {
      setAddressErrors(errors);
      return;
    }

    setIsAddressLoading(true);
    setAddressErrors({});

    try {
      const updatedUser = await authService.completeAddress({
        zipCode: address.zipCode,
        address: address.address,
        addressNumber: address.addressNumber,
        neighborhood: address.neighborhood,
        city: address.city,
        state: address.state,
      });
      if (!isMountedRef.current) return;

      setUser(updatedUser);
      authStorage.setUser(updatedUser);
      toast.success('Endereço cadastrado com sucesso!');
      redirectToApp();
    } catch (error: any) {
      if (!isMountedRef.current) return;
      toast.error(error.response?.data?.message || 'Erro ao cadastrar endereço');
      setIsAddressLoading(false);
    }
  };

  const redirectToApp = () => {
    const returnTo = sessionStorage.getItem('returnTo') || '/';
    sessionStorage.removeItem('returnTo');
    window.location.href = returnTo;
  };

  if (!user) return null;

  // If neither phone nor address is needed, redirect
  if (!needsPhone && !needsAddress) {
    redirectToApp();
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <div className="p-6 md:p-8">
          {/* Step indicator */}
          {needsPhone && needsAddress && (
            <div className="flex items-center gap-2 mb-6">
              <div className={`flex-1 h-1 rounded-full ${currentStep === 'phone' ? 'bg-blue-600' : 'bg-blue-600'}`} />
              <div className={`flex-1 h-1 rounded-full ${currentStep === 'address' ? 'bg-blue-600' : 'bg-gray-200'}`} />
            </div>
          )}

          {currentStep === 'phone' ? (
            <>
              <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  Complete seu cadastro
                </h1>
                <p className="text-sm md:text-base text-gray-600">
                  Para continuar, precisamos do seu telefone para contato.
                </p>
              </div>

              <form onSubmit={handlePhoneSubmit} className="space-y-4">
                <PhoneInput
                  value={phone}
                  onChange={setPhone}
                  required
                  disabled={isPhoneLoading}
                  autoFocus
                />
                <Button type="submit" className="w-full" disabled={isPhoneLoading || !phone}>
                  {isPhoneLoading ? 'Salvando...' : needsAddress ? 'Continuar' : 'Finalizar'}
                </Button>
              </form>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                <p className="text-xs md:text-sm text-blue-800">
                  <strong>Por que precisamos do seu telefone?</strong> Utilizamos
                  seu telefone para comunicação sobre pedidos e campanhas.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  Informe seu endereço
                </h1>
                <p className="text-sm md:text-base text-gray-600">
                  Seu endereço será usado para calcular a distância até os pontos
                  de retirada das campanhas.
                </p>
              </div>

              <form onSubmit={handleAddressSubmit} className="space-y-4">
                <AddressForm
                  value={address}
                  onChange={setAddress}
                  disabled={isAddressLoading}
                  errors={addressErrors}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isAddressLoading || !address.address || !address.addressNumber}
                >
                  {isAddressLoading ? 'Salvando...' : 'Finalizar cadastro'}
                </Button>
              </form>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                <p className="text-xs md:text-sm text-blue-800">
                  <strong>Por que precisamos do seu endereço?</strong> Com ele,
                  mostramos as campanhas mais próximas de você e calculamos a
                  distância até o ponto de retirada.
                </p>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
