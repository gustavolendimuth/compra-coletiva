import { useState } from 'react';
import { CepInput } from '../ui/CepInput';

interface ProximitySearchProps {
  onSearch: (zipCode: string, maxDistance: number) => void;
  onClear: () => void;
  isActive: boolean;
  className?: string;
}

export function ProximitySearch({
  onSearch,
  onClear,
  isActive,
  className = '',
}: ProximitySearchProps) {
  const [cep, setCep] = useState('');
  const [maxDistance, setMaxDistance] = useState(50);
  const distances = [10, 25, 50, 100];

  const handleSearch = () => {
    const digits = cep.replace(/\D/g, '');
    if (digits.length === 8) {
      onSearch(digits, maxDistance);
    }
  };

  const handleClear = () => {
    setCep('');
    onClear();
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="text-sm font-medium text-gray-700">Buscar campanhas próximas</span>
      </div>

      <div className="flex gap-2 mb-3">
        <div className="flex-1">
          <CepInput
            value={cep}
            onChange={setCep}
            label=""
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={cep.replace(/\D/g, '').length !== 8}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium min-h-[44px]"
        >
          Buscar
        </button>
      </div>

      {/* Distance selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-500">Raio:</span>
        {distances.map((d) => (
          <button
            key={d}
            onClick={() => {
              setMaxDistance(d);
              if (isActive) {
                const digits = cep.replace(/\D/g, '');
                if (digits.length === 8) onSearch(digits, d);
              }
            }}
            className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
              maxDistance === d
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {d} km
          </button>
        ))}
      </div>

      {isActive && (
        <button
          onClick={handleClear}
          className="mt-3 text-xs text-red-600 hover:text-red-700 underline"
        >
          Limpar busca por proximidade
        </button>
      )}
    </div>
  );
}
