import { useState, useEffect } from 'react';

interface CepInputProps {
  value: string;
  onChange: (value: string) => void;
  onCepFound?: (data: { zipCode: string; street: string; neighborhood: string; city: string; state: string }) => void;
  onSearching?: (isSearching: boolean) => void;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  label?: string;
  className?: string;
}

export function CepInput({
  value,
  onChange,
  onCepFound,
  onSearching,
  error,
  disabled = false,
  autoFocus = false,
  label = 'CEP',
  className = '',
}: CepInputProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Mask: XXXXX-XXX
  const formatCep = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 8);
    if (digits.length > 5) {
      return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    }
    return digits;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCep(e.target.value);
    onChange(formatted);
    setSearchError(null);
  };

  // Auto-search when CEP is complete (8 digits)
  useEffect(() => {
    const digits = value.replace(/\D/g, '');
    if (digits.length === 8 && onCepFound) {
      setIsSearching(true);
      onSearching?.(true);
      setSearchError(null);

      fetch(`https://viacep.com.br/ws/${digits}/json/`)
        .then((res) => res.json())
        .then((data) => {
          if (data.erro) {
            setSearchError('CEP não encontrado');
            return;
          }
          onCepFound({
            zipCode: `${digits.slice(0, 5)}-${digits.slice(5)}`,
            street: data.logradouro || '',
            neighborhood: data.bairro || '',
            city: data.localidade || '',
            state: data.uf || '',
          });
        })
        .catch(() => {
          setSearchError('Erro ao buscar CEP');
        })
        .finally(() => {
          setIsSearching(false);
          onSearching?.(false);
        });
    }
  }, [value, onCepFound, onSearching]);

  const displayError = error || searchError;

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          value={value}
          onChange={handleChange}
          placeholder="00000-000"
          disabled={disabled}
          autoFocus={autoFocus}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base ${
            displayError ? 'border-red-500' : 'border-gray-300'
          } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          maxLength={9}
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
        )}
      </div>
      {displayError && (
        <p className="mt-1 text-sm text-red-600">{displayError}</p>
      )}
    </div>
  );
}
