import { cn } from "@/lib/utils";
import type { PaymentReleaseTrigger } from "@/api";
import {
  paymentReleaseTriggerOptions,
  type PaymentReleaseTriggerOption,
} from "@/lib/paymentRelease";

interface PaymentReleaseTriggerFieldProps {
  value: PaymentReleaseTrigger;
  onChange: (value: PaymentReleaseTrigger) => void;
  label?: string;
  helperText?: string;
  disabled?: boolean;
}

function TriggerOptionCard({
  option,
  selected,
  disabled,
  onSelect,
}: {
  option: PaymentReleaseTriggerOption;
  selected: boolean;
  disabled?: boolean;
  onSelect: (value: PaymentReleaseTrigger) => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(option.value)}
      className={cn(
        "w-full rounded-2xl border p-4 text-left transition-all",
        "focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2",
        selected
          ? "border-sky-300 bg-gradient-to-br from-sky-50 to-white shadow-md shadow-sky-100"
          : "border-gray-200 bg-white hover:border-sky-200 hover:bg-sky-50/40",
        disabled && "cursor-not-allowed opacity-60"
      )}
      aria-pressed={selected}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-sky-900">{option.shortLabel}</p>
          <p className="mt-1 text-xs leading-relaxed text-gray-600">
            {option.description}
          </p>
        </div>
        <span
          className={cn(
            "mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border",
            selected
              ? "border-sky-500 bg-sky-500 text-white"
              : "border-gray-300 bg-white text-transparent"
          )}
        >
          <span className="text-[10px] font-bold">✓</span>
        </span>
      </div>
    </button>
  );
}

export function PaymentReleaseTriggerField({
  value,
  onChange,
  label = "Quando liberar o pagamento",
  helperText = "Escolha em que momento os compradores podem visualizar o PIX e concluir o pagamento.",
  disabled = false,
}: PaymentReleaseTriggerFieldProps) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-sky-800">{label}</label>
        <p className="mt-1 text-sm text-sky-600/70">{helperText}</p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {paymentReleaseTriggerOptions.map((option) => (
          <TriggerOptionCard
            key={option.value}
            option={option}
            selected={value === option.value}
            disabled={disabled}
            onSelect={onChange}
          />
        ))}
      </div>
    </div>
  );
}
