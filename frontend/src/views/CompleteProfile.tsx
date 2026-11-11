import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authService, profileService } from '@/api';
import { authStorage } from '@/lib/authStorage';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { AddressForm, type AddressData } from '@/components/ui/AddressForm';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { getApiErrorMessage } from '@/lib/apiError';
import Link from 'next/link';
import toast from 'react-hot-toast';

/**
 * CompleteProfile Page
 * Multi-step page for users to complete legal acceptance, phone and address.
 */
export function CompleteProfile() {
  const { user, setUser, isLoading } = useAuth();
  const isMountedRef = useRef(true);

  const needsLegal = user && user.legalAcceptanceRequired;
  const needsPhone = user && !user.phoneCompleted;
  const needsAddress = user && !user.addressCompleted;

  const [currentStep, setCurrentStep] = useState<'legal' | 'phone' | 'address'>(
    needsLegal ? 'legal' : needsPhone ? 'phone' : 'address'
  );

  // Legal acceptance state
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [isLegalLoading, setIsLegalLoading] = useState(false);

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
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Update step when user data changes
  useEffect(() => {
    if (!user) return;

    if (user.legalAcceptanceRequired) {
      setCurrentStep('legal');
      return;
    }

    if (!user.phoneCompleted) {
      setCurrentStep('phone');
      return;
    }

    if (!user.addressCompleted) {
      setCurrentStep('address');
    }
  }, [user]);

  const handleLegalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!acceptTerms || !acceptPrivacy) {
      toast.error('Você precisa aceitar os Termos e a Política de Privacidade');
      return;
    }

    setIsLegalLoading(true);
    try {
      const response = await profileService.acceptLegalTerms({
        acceptTerms: true,
        acceptPrivacy: true,
      });
      if (!isMountedRef.current || !user) return;

      const mergedUser = {
        ...user,
        ...response.user,
      };

      setUser(mergedUser);
      authStorage.setUser(mergedUser);
      toast.success('Aceite legal registrado com sucesso!');
      setIsLegalLoading(false);

      if (!mergedUser.phoneCompleted) {
        setCurrentStep('phone');
      } else if (!mergedUser.addressCompleted) {
        setCurrentStep('address');
      } else {
        redirectToApp();
      }
    } catch (error: unknown) {
      if (!isMountedRef.current) return;
      toast.error(getApiErrorMessage(error, 'Erro ao registrar aceite legal'));
      setIsLegalLoading(false);
    }
  };

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
    } catch (error: unknown) {
      if (!isMountedRef.current) return;
      toast.error(getApiErrorMessage(error, 'Erro ao cadastrar telefone'));
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
    } catch (error: unknown) {
      if (!isMountedRef.current) return;
      toast.error(getApiErrorMessage(error, 'Erro ao cadastrar endereço'));
      setIsAddressLoading(false);
    }
  };

  const redirectToApp = () => {
    const returnUrl = authStorage.getReturnUrl() || '/campanhas';
    authStorage.clearReturnUrl();
    window.location.href = returnUrl;
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // If nothing else is needed, redirect
  if (!needsLegal && !needsPhone && !needsAddress) {
    redirectToApp();
    return null;
  }

  const requiredSteps = [
    needsLegal ? 'legal' : null,
    needsPhone ? 'phone' : null,
    needsAddress ? 'address' : null,
  ].filter((step): step is 'legal' | 'phone' | 'address' => !!step);
  const currentStepIndex = requiredSteps.indexOf(currentStep);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <div className="p-6 md:p-8">
          {/* Step indicator */}
          {requiredSteps.length > 1 && (
            <div className="flex items-center gap-2 mb-6">
              {requiredSteps.map((step, index) => (
                <div
                  key={step}
                  className={`flex-1 h-1 rounded-full ${index <= currentStepIndex ? 'bg-blue-600' : 'bg-gray-200'}`}
                />
              ))}
            </div>
          )}

          {currentStep === 'legal' ? (
            <>
              <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  Aceite legal
                </h1>
                <p className="text-sm md:text-base text-gray-600">
                  Para continuar, você precisa aceitar os Termos de Serviço e a Política de Privacidade.
                </p>
              </div>

              <form onSubmit={handleLegalSubmit} className="space-y-4">
                <label className="flex items-start gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    disabled={isLegalLoading}
                    required
                    className="mt-1 rounded border-sky-300 text-sky-600 focus:ring-sky-500"
                  />
                  <span>
                    Li e aceito os{" "}
                    <Link
                      href="/termos"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-600 underline underline-offset-2"
                    >
                      Termos de Serviço
                    </Link>
                    .
                  </span>
                </label>

                <label className="flex items-start gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={acceptPrivacy}
                    onChange={(e) => setAcceptPrivacy(e.target.checked)}
                    disabled={isLegalLoading}
                    required
                    className="mt-1 rounded border-sky-300 text-sky-600 focus:ring-sky-500"
                  />
                  <span>
                    Li e aceito a{" "}
                    <Link
                      href="/privacidade"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-600 underline underline-offset-2"
                    >
                      Política de Privacidade
                    </Link>
                    .
                  </span>
                </label>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLegalLoading || !acceptTerms || !acceptPrivacy}
                >
                  {isLegalLoading ? 'Salvando...' : 'Continuar'}
                </Button>
              </form>
            </>
          ) : currentStep === 'phone' ? (
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

