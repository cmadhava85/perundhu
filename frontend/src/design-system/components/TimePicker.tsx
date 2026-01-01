import React, { useState, useCallback, useMemo } from 'react';

import './TimePicker.css';

export type TimeFormat = '12h' | '24h';
export type TimeStep = 15 | 30 | 60;

export interface TimePickerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** Time value as string (HH:MM format) */
  value?: string;
  /** Time change handler */
  onChange: (time: string) => void;
  /** Time format */
  format?: TimeFormat;
  /** Time step in minutes */
  step?: TimeStep;
  /** Disabled state */
  disabled?: boolean;
  /** Label */
  label?: string;
  /** Placeholder */
  placeholder?: string;
  /** Error state */
  error?: boolean;
  /** Error message */
  errorMessage?: string;
  /** Helper text */
  helperText?: string;
  /** Start hour (minimum hour) */
  minHour?: number;
  /** End hour (maximum hour) */
  maxHour?: number;
  /** Show seconds */
  showSeconds?: boolean;
  /** Custom className */
  className?: string;
}

/**
 * Modern TimePicker Component
 * - Multiple time formats (12h/24h)
 * - Configurable time steps (15/30/60 min)
 * - Touch-optimized spinner (native mobile feel)
 * - Keyboard navigation and input
 * - Accessible (ARIA labels, keyboard)
 * - Slider for quick selection
 * - Mobile-responsive
 */
export const TimePicker = React.forwardRef<HTMLDivElement, TimePickerProps>(
  (
    {
      value = '',
      onChange,
      format = '24h',
      step = 15,
      disabled = false,
      label,
      placeholder = 'Select time',
      error = false,
      errorMessage,
      helperText,
      minHour = 0,
      maxHour = 23,
      showSeconds = false,
      className = '',
      ...props
    },
    ref
  ) => {
    // Parse time value
    const parseTime = (timeStr: string) => {
      if (!timeStr) return { hours: 0, minutes: 0, seconds: 0 };
      const parts = timeStr.split(':');
      return {
        hours: parseInt(parts[0]) || 0,
        minutes: parseInt(parts[1]) || 0,
        seconds: parseInt(parts[2]) || 0,
      };
    };

    const parsed = parseTime(value);
    const [hours, setHours] = useState(parsed.hours);
    const [minutes, setMinutes] = useState(parsed.minutes);
    const [seconds, setSeconds] = useState(parsed.seconds);
    const [isOpen, setIsOpen] = useState(false);
    const [displayMode, setDisplayMode] = useState<'hours' | 'minutes' | 'seconds'>('hours');

    // Generate time options
    const generateTimeOptions = useCallback(
      (type: 'hours' | 'minutes' | 'seconds') => {
        const options: number[] = [];

        if (type === 'hours') {
          for (let i = minHour; i <= maxHour; i++) {
            options.push(i);
          }
        } else if (type === 'minutes') {
          for (let i = 0; i < 60; i += step) {
            options.push(i);
          }
        } else {
          for (let i = 0; i < 60; i += step) {
            options.push(i);
          }
        }

        return options;
      },
      [minHour, maxHour, step]
    );

    const hourOptions = useMemo(() => generateTimeOptions('hours'), [generateTimeOptions]);
    const minuteOptions = useMemo(() => generateTimeOptions('minutes'), [generateTimeOptions]);
    const secondOptions = useMemo(() => generateTimeOptions('seconds'), [generateTimeOptions]);

    // Format display
    const formatTime = useCallback(
      (h: number, m: number, s: number = 0) => {
        const formatWithPad = (num: number) => String(num).padStart(2, '0');

        if (format === '12h') {
          const period = h >= 12 ? 'PM' : 'AM';
          const display12 = h % 12 || 12;
          const timeStr = `${formatWithPad(display12)}:${formatWithPad(m)}`;
          return showSeconds ? `${timeStr}:${formatWithPad(s)} ${period}` : `${timeStr} ${period}`;
        } else {
          const timeStr = `${formatWithPad(h)}:${formatWithPad(m)}`;
          return showSeconds ? `${timeStr}:${formatWithPad(s)}` : timeStr;
        }
      },
      [format, showSeconds]
    );

    // Handle time change
    const handleTimeChange = useCallback(
      (newHours: number, newMinutes: number, newSeconds: number = 0) => {
        setHours(newHours);
        setMinutes(newMinutes);
        setSeconds(newSeconds);

        const formatWithPad = (num: number) => String(num).padStart(2, '0');
        const timeStr = showSeconds
          ? `${formatWithPad(newHours)}:${formatWithPad(newMinutes)}:${formatWithPad(newSeconds)}`
          : `${formatWithPad(newHours)}:${formatWithPad(newMinutes)}`;

        onChange(timeStr);
      },
      [onChange, showSeconds]
    );

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;
      const parts = input.split(':');

      if (parts[0]) {
        let h = parseInt(parts[0]);
        if (format === '12h' && input.includes('AM')) {
          h = h === 12 ? 0 : h;
        } else if (format === '12h' && input.includes('PM')) {
          h = h === 12 ? 12 : h + 12;
        }
        h = Math.max(minHour, Math.min(maxHour, h));

        const m = parts[1] ? parseInt(parts[1]) : 0;
        const s = parts[2] ? parseInt(parts[2]) : 0;

        handleTimeChange(h, m, s);
      }
    };

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (disabled) return;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          if (displayMode === 'hours') {
            const nextHour = (hours + 1) > maxHour ? minHour : hours + 1;
            handleTimeChange(nextHour, minutes, seconds);
          } else if (displayMode === 'minutes') {
            const nextMin = (minutes + step) >= 60 ? 0 : minutes + step;
            handleTimeChange(hours, nextMin, seconds);
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (displayMode === 'hours') {
            const prevHour = hours - 1 < minHour ? maxHour : hours - 1;
            handleTimeChange(prevHour, minutes, seconds);
          } else if (displayMode === 'minutes') {
            const prevMin = minutes - step < 0 ? 60 - step : minutes - step;
            handleTimeChange(hours, prevMin, seconds);
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (displayMode === 'hours') setDisplayMode('minutes');
          else if (displayMode === 'minutes' && showSeconds) setDisplayMode('seconds');
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (displayMode === 'seconds') setDisplayMode('minutes');
          else if (displayMode === 'minutes') setDisplayMode('hours');
          break;
        case 'Enter':
          e.preventDefault();
          setIsOpen(false);
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          break;
        default:
          break;
      }
    };

    const displayValue = value ? formatTime(hours, minutes, seconds) : placeholder;

    return (
      <div
        ref={ref}
        className={`timepicker-wrapper ${error ? 'error' : ''} ${disabled ? 'disabled' : ''} ${className}`}
        {...props}
      >
        {label && (
          <label className="timepicker-label" htmlFor="timepicker-input">
            {label}
          </label>
        )}

        {/* Input Display */}
        <div className="timepicker-input-group">
          <input
            id="timepicker-input"
            type="text"
            className="timepicker-input"
            value={displayValue}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            aria-label={label || 'Select time'}
            readOnly
          />
          <svg
            className={`timepicker-icon ${isOpen ? 'open' : ''}`}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>

        {/* Picker Panel */}
        {isOpen && !disabled && (
          <div className="timepicker-panel">
            {/* Hour Selector */}
            <div className={`timepicker-column ${displayMode === 'hours' ? 'active' : ''}`}>
              <div className="timepicker-column-label">Hour</div>
              <div className="timepicker-spinner">
                {hourOptions.map((h) => (
                  <button
                    key={h}
                    className={`timepicker-option ${h === hours ? 'selected' : ''}`}
                    onClick={() => {
                      handleTimeChange(h, minutes, seconds);
                      setDisplayMode('minutes');
                    }}
                    onMouseEnter={() => setDisplayMode('hours')}
                  >
                    {String(h).padStart(2, '0')}
                  </button>
                ))}
              </div>
            </div>

            {/* Minute Selector */}
            <div className={`timepicker-column ${displayMode === 'minutes' ? 'active' : ''}`}>
              <div className="timepicker-column-label">Minute</div>
              <div className="timepicker-spinner">
                {minuteOptions.map((m) => (
                  <button
                    key={m}
                    className={`timepicker-option ${m === minutes ? 'selected' : ''}`}
                    onClick={() => {
                      handleTimeChange(hours, m, seconds);
                      if (showSeconds) setDisplayMode('seconds');
                      else setIsOpen(false);
                    }}
                    onMouseEnter={() => setDisplayMode('minutes')}
                  >
                    {String(m).padStart(2, '0')}
                  </button>
                ))}
              </div>
            </div>

            {/* Second Selector (if enabled) */}
            {showSeconds && (
              <div className={`timepicker-column ${displayMode === 'seconds' ? 'active' : ''}`}>
                <div className="timepicker-column-label">Second</div>
                <div className="timepicker-spinner">
                  {secondOptions.map((s) => (
                    <button
                      key={s}
                      className={`timepicker-option ${s === seconds ? 'selected' : ''}`}
                      onClick={() => {
                        handleTimeChange(hours, minutes, s);
                        setIsOpen(false);
                      }}
                      onMouseEnter={() => setDisplayMode('seconds')}
                    >
                      {String(s).padStart(2, '0')}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="timepicker-actions">
              <button
                className="timepicker-cancel"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </button>
              <button
                className="timepicker-confirm"
                onClick={() => setIsOpen(false)}
              >
                Confirm
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && errorMessage && (
          <div className="timepicker-error">{errorMessage}</div>
        )}

        {/* Helper Text */}
        {helperText && <div className="timepicker-helper">{helperText}</div>}
      </div>
    );
  }
);

TimePicker.displayName = 'TimePicker';
