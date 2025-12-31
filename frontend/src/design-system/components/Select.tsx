import React, { useState, useRef, useEffect, useCallback } from 'react';
import { colors, spacing, borderRadius, shadows, textStyles, transitions } from '../tokens';
import './Select.css';

export type SelectSize = 'sm' | 'md' | 'lg';
export type SelectVariant = 'default' | 'outline';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  description?: string;
}

export interface SelectProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** Select options */
  options: SelectOption[];
  /** Selected value(s) */
  value?: string | number | (string | number)[];
  /** Change handler */
  onChange: (value: string | number | (string | number)[], option?: SelectOption) => void;
  /** Multi-select mode */
  isMulti?: boolean;
  /** Select size */
  size?: SelectSize;
  /** Select variant */
  variant?: SelectVariant;
  /** Full width */
  fullWidth?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Searchable */
  searchable?: boolean;
  /** Clearable */
  clearable?: boolean;
  /** Label */
  label?: string;
  /** Error state */
  error?: boolean;
  /** Error message */
  errorMessage?: string;
  /** Helper text */
  helperText?: string;
  /** Custom className */
  className?: string;
}

/**
 * Modern Select/Dropdown Component
 * - Multiple variants and sizes
 * - Multi-select support
 * - Searchable options
 * - Touch-optimized (44px+ touch targets)
 * - Keyboard navigation (Arrow keys, Enter, Escape)
 * - Accessible (ARIA labels, roles)
 * - Mobile bottom sheet variant (on small screens)
 * - Dark mode support
 */
export const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  (
    {
      options,
      value,
      onChange,
      isMulti = false,
      size = 'md',
      variant = 'default',
      fullWidth = false,
      placeholder = 'Select an option...',
      disabled = false,
      searchable = false,
      clearable = false,
      label,
      error = false,
      errorMessage,
      helperText,
      className = '',
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const selectRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Handle click outside
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (selectRef.current && !selectRef.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }
    }, [isOpen]);

    // Filter options based on search
    const filteredOptions = searchQuery.trim()
      ? options.filter(opt =>
          opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          opt.description?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : options;

    // Get selected option(s)
    const selectedOptions = Array.isArray(value)
      ? options.filter(opt => value.includes(opt.value))
      : options.find(opt => opt.value === value);

    const selectedLabel = Array.isArray(selectedOptions)
      ? selectedOptions.length > 0
        ? `${selectedOptions.length} selected`
        : placeholder
      : selectedOptions?.label || placeholder;

    // Handle option click
    const handleSelectOption = useCallback((option: SelectOption) => {
      if (option.disabled) return;

      if (isMulti) {
        const currentValues = Array.isArray(value) ? value : [];
        const newValues = currentValues.includes(option.value)
          ? currentValues.filter(v => v !== option.value)
          : [...currentValues, option.value];
        onChange(newValues);
      } else {
        onChange(option.value, option);
        setIsOpen(false);
      }

      setSearchQuery('');
    }, [value, isMulti, onChange]);

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (!isOpen && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown')) {
        e.preventDefault();
        setIsOpen(true);
        return;
      }

      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < filteredOptions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredOptions.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredOptions[highlightedIndex]) {
            handleSelectOption(filteredOptions[highlightedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          break;
        default:
          break;
      }
    };

    // Clear selection
    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange(isMulti ? [] : '', undefined);
      setSearchQuery('');
    };

    // Size-specific styles
    const sizeClass = {
      sm: 'select-sm',
      md: 'select-md',
      lg: 'select-lg',
    }[size];

    return (
      <div
        ref={ref || selectRef}
        className={`select-wrapper ${sizeClass} ${variant} ${error ? 'error' : ''} ${
          fullWidth ? 'full-width' : ''
        } ${disabled ? 'disabled' : ''} ${className}`}
        {...props}
      >
        {label && (
          <label className="select-label" htmlFor={`select-${label}`}>
            {label}
          </label>
        )}

        {/* Select trigger button */}
        <button
          type="button"
          className={`select-trigger ${isOpen ? 'open' : ''}`}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label={label || placeholder}
        >
          <span className="select-value">
            {selectedLabel}
          </span>

          <div className="select-icons">
            {clearable && value && (
              <button
                className="select-clear-btn"
                onClick={handleClear}
                aria-label="Clear selection"
                tabIndex={-1}
              >
                ✕
              </button>
            )}
            <svg
              className={`select-chevron ${isOpen ? 'open' : ''}`}
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 8l4 4 4-4" />
            </svg>
          </div>
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <div
            ref={dropdownRef}
            className={`select-dropdown ${isMulti ? 'multi' : ''}`}
            role="listbox"
            aria-label={label || 'Select options'}
          >
            {/* Search input (if searchable) */}
            {searchable && (
              <div className="select-search">
                <input
                  ref={searchInputRef}
                  type="text"
                  className="select-search-input"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setHighlightedIndex(0);
                  }}
                  onKeyDown={handleKeyDown}
                  autoFocus
                />
              </div>
            )}

            {/* Options list */}
            <div className="select-options">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option, index) => (
                  <button
                    key={option.value}
                    className={`select-option ${
                      highlightedIndex === index ? 'highlighted' : ''
                    } ${
                      isMulti
                        ? Array.isArray(value) && value.includes(option.value)
                          ? 'selected'
                          : ''
                        : value === option.value
                        ? 'selected'
                        : ''
                    } ${option.disabled ? 'disabled' : ''}`}
                    onClick={() => handleSelectOption(option)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    role="option"
                    aria-selected={
                      isMulti
                        ? Array.isArray(value) && value.includes(option.value)
                        : value === option.value
                    }
                    disabled={option.disabled}
                  >
                    {isMulti && (
                      <input
                        type="checkbox"
                        className="select-option-checkbox"
                        checked={Array.isArray(value) && value.includes(option.value)}
                        readOnly
                        aria-hidden="true"
                      />
                    )}

                    <div className="select-option-content">
                      {option.icon && (
                        <span className="select-option-icon">{option.icon}</span>
                      )}
                      <div className="select-option-text">
                        <div className="select-option-label">{option.label}</div>
                        {option.description && (
                          <div className="select-option-description">
                            {option.description}
                          </div>
                        )}
                      </div>
                    </div>

                    {!isMulti && value === option.value && (
                      <span className="select-option-checkmark">✓</span>
                    )}
                  </button>
                ))
              ) : (
                <div className="select-no-options">
                  No options found
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error message */}
        {error && errorMessage && (
          <div className="select-error">{errorMessage}</div>
        )}

        {/* Helper text */}
        {helperText && (
          <div className="select-helper">{helperText}</div>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
