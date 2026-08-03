'use client';

import React, { useState, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/utils/cn';
import { ComponentSize } from '@/types/ui';
import { useOutsideClick } from '@/hooks/use-outside-click';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  helperText?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  size?: ComponentSize;
  fullWidth?: boolean;
  className?: string;
  id?: string;
}

export function Select({
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  label,
  helperText,
  error,
  disabled = false,
  required = false,
  size = 'md',
  fullWidth = true,
  className,
  id,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const backupId = React.useId();
  const selectId = id || backupId;

  const selectedOption = options.find((opt) => opt.value === value);

  useOutsideClick(containerRef, () => setIsOpen(false));

  const sizeStyles: Record<ComponentSize, string> = {
    sm: 'h-8 text-xs px-2.5',
    md: 'h-10 text-sm px-3',
    lg: 'h-12 text-base px-4',
  };

  const toggleOpen = () => {
    if (disabled) return;
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    if (nextOpen) {
      const idx = options.findIndex((opt) => opt.value === value);
      setFocusedIndex(idx >= 0 ? idx : 0);
    }
  };

  const handleSelect = (option: SelectOption) => {
    if (option.disabled) return;
    onChange?.(option.value);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!isOpen) {
        toggleOpen();
      } else if (focusedIndex >= 0 && options[focusedIndex]) {
        handleSelect(options[focusedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        toggleOpen();
      } else {
        setFocusedIndex((prev) => (prev + 1) % options.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        toggleOpen();
      } else {
        setFocusedIndex((prev) => (prev - 1 + options.length) % options.length);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn('flex flex-col gap-1.5 relative', fullWidth && 'w-full')}
    >
      {label && (
        <label
          htmlFor={selectId}
          className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1"
        >
          {label}
          {required && <span className="text-[var(--danger)]">*</span>}
        </label>
      )}

      <button
        id={selectId}
        type="button"
        disabled={disabled}
        onClick={toggleOpen}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={cn(
          'w-full flex items-center justify-between bg-[var(--surface)] text-[var(--text-primary)] border rounded-[var(--radius-md)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] disabled:bg-[var(--surface-elevated)] disabled:cursor-not-allowed text-left min-h-[44px] sm:min-h-0',
          error
            ? 'border-[var(--danger)] focus:ring-[var(--danger)]'
            : 'border-[var(--border)] hover:border-[var(--border-hover)] focus:border-[var(--primary)]',
          sizeStyles[size],
          className
        )}
      >
        <span className={cn('truncate', !selectedOption && 'text-[var(--text-muted)]')}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-[var(--text-muted)] transition-transform duration-200 ml-2 shrink-0',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <ul
          role="listbox"
          className="absolute top-full left-0 right-0 mt-1 z-50 max-h-60 overflow-auto bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-md)] shadow-lg py-1 focus:outline-none"
        >
          {options.length === 0 ? (
            <li className="px-3 py-2 text-xs text-[var(--text-muted)]">No options</li>
          ) : (
            options.map((opt, index) => {
              const isSelected = opt.value === value;
              const isFocused = index === focusedIndex;

              return (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(opt)}
                  onMouseEnter={() => setFocusedIndex(index)}
                  className={cn(
                    'flex items-center justify-between px-3 py-2 text-xs sm:text-sm cursor-pointer transition-colors',
                    opt.disabled && 'opacity-50 cursor-not-allowed',
                    isFocused && 'bg-[var(--surface-elevated)] text-[var(--primary)]',
                    isSelected && 'font-semibold text-[var(--primary)]'
                  )}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check className="w-4 h-4 shrink-0 text-[var(--primary)] ml-2" />}
                </li>
              );
            })
          )}
        </ul>
      )}

      {error ? (
        <p className="text-xs text-[var(--danger)] font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-[var(--text-secondary)]">{helperText}</p>
      ) : null}
    </div>
  );
}
