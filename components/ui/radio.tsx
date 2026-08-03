'use client';

import React, { createContext, useContext } from 'react';
import { cn } from '@/utils/cn';

interface RadioGroupContextType {
  name: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}

const RadioGroupContext = createContext<RadioGroupContextType | undefined>(undefined);

export interface RadioGroupProps {
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  label?: string;
  children: React.ReactNode;
  className?: string;
}

export function RadioGroup({
  name: propName,
  value: propValue,
  defaultValue,
  onChange,
  disabled = false,
  label,
  children,
  className,
}: RadioGroupProps) {
  const generatedName = React.useId();
  const name = propName || generatedName;
  const [internalValue, setInternalValue] = React.useState(defaultValue);

  const currentValue = propValue !== undefined ? propValue : internalValue;

  const handleChange = (val: string) => {
    if (disabled) return;
    if (propValue === undefined) {
      setInternalValue(val);
    }
    onChange?.(val);
  };

  return (
    <RadioGroupContext.Provider value={{ name, value: currentValue, onChange: handleChange, disabled }}>
      <div role="radiogroup" aria-label={label} className={cn('flex flex-col gap-2.5', className)}>
        {label && <span className="text-xs font-semibold text-[var(--text-primary)]">{label}</span>}
        {children}
      </div>
    </RadioGroupContext.Provider>
  );
}

export interface RadioProps {
  value: string;
  label?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function Radio({ value, label, disabled: radioDisabled, className, id }: RadioProps) {
  const context = useContext(RadioGroupContext);
  if (!context) {
    throw new Error('Radio must be used within a RadioGroup');
  }

  const { name, value: groupValue, onChange, disabled: groupDisabled } = context;
  const isChecked = groupValue === value;
  const isDisabled = radioDisabled || groupDisabled;
  const radioId = id || `${name}-${value}`;

  return (
    <label
      htmlFor={radioId}
      className={cn(
        'inline-flex items-center gap-2.5 cursor-pointer select-none text-sm text-[var(--text-primary)]',
        isDisabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <div className="relative flex items-center justify-center shrink-0">
        <input
          id={radioId}
          type="radio"
          name={name}
          value={value}
          checked={isChecked}
          disabled={isDisabled}
          onChange={() => onChange?.(value)}
          className="sr-only peer"
        />
        <div
          className={cn(
            'w-5 h-5 rounded-full border bg-[var(--surface)] transition-all flex items-center justify-center peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--focus-ring)] peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[var(--bg)]',
            isChecked ? 'border-[var(--primary)]' : 'border-[var(--border)] hover:border-[var(--border-hover)]'
          )}
        >
          {isChecked && <div className="w-2.5 h-2.5 rounded-full bg-[var(--primary)]" />}
        </div>
      </div>
      {label && <span className="text-sm font-medium">{label}</span>}
    </label>
  );
}
