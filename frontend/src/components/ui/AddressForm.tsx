import { useState } from 'react';
import { CepInput } from './CepInput';

export interface AddressData {
  zipCode: string;
  address: string;
  addressNumber: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}

interface AddressFormProps {
  value: AddressData;
  onChange: (data: AddressData) => void;
  disabled?: boolean;
  errors?: Partial<Record<keyof AddressData, string>>;
  className?: string;
}

export function AddressForm({
  value,
  onChange,
  disabled = false,
  errors = {},
  className = '',
}: AddressFormProps) {
  const [cepSearched, setCepSearched] = useState(!!value.city);

  const handleCepFound = (data: {
    zipCode: string;
    street: string;
    neighborhood: string;
    city: string;
    state: string;
  }) => {
    onChange({
      ...value,
      zipCode: data.zipCode,
      address: data.street,
      neighborhood: data.neighborhood,
      city: data.city,
      state: data.state,
    });
    setCepSearched(true);
  };

  const handleFieldChange = (field: keyof AddressData, val: string) => {
    onChange({ ...value, [field]: val });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <CepInput
        value={value.zipCode}
        onChange={(val) => handleFieldChange('zipCode', val)}
        onCepFound={handleCepFound}
        error={errors.zipCode}
        disabled={disabled}
      />

      {cepSearched && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rua
            </label>
            <input
              type="text"
              value={value.address}
              readOnly
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-base"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Numero *
              </label>
              <input
                type="text"
                value={value.addressNumber}
                onChange={(e) => handleFieldChange('addressNumber', e.target.value)}
                placeholder="No"
                disabled={disabled}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-base ${
                  errors.addressNumber ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.addressNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.addressNumber}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Complemento
              </label>
              <input
                type="text"
                value={value.complement}
                onChange={(e) => handleFieldChange('complement', e.target.value)}
                placeholder="Apto, Sala..."
                disabled={disabled}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bairro
            </label>
            <input
              type="text"
              value={value.neighborhood}
              readOnly
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-base"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cidade
              </label>
              <input
                type="text"
                value={value.city}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <input
                type="text"
                value={value.state}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-base"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
