import { useState, useRef, useCallback } from 'react';
import { formatTimeMask, extractDigits, hhmmToHours, hoursToHHMM } from '../../utils/timeFormat';

/**
 * Masked time input that accepts HH:MM format.
 * Props:
 *   - value: string in HH:MM format (e.g. "08:30") or empty string
 *   - onChange: called with the new HH:MM string on each valid keystroke
 *   - label, error, className, placeholder: forwarded to the wrapper/input
 *   - ...rest: forwarded to the underlying <input>
 */
export function TimeInput({ value = '', onChange, label, error, className = '', placeholder = '00:00', ...rest }) {
  const inputRef = useRef(null);

  const handleChange = useCallback((e) => {
    const raw = extractDigits(e.target.value);
    const formatted = formatTimeMask(raw);
    onChange(formatted);
  }, [onChange]);

  const handleKeyDown = useCallback((e) => {
    // Allow: backspace, delete, tab, escape, enter, arrows
    const allowed = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
    if (allowed.includes(e.key)) return;

    // Allow Ctrl/Cmd + A, C, V, X
    if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) return;

    // Only allow digits
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
      return;
    }

    // Prevent typing more than 4 digits
    const digits = extractDigits(value);
    if (digits.length >= 4) {
      e.preventDefault();
    }
  }, [value]);

  const handlePaste = useCallback((e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    const digits = extractDigits(pasted).slice(0, 4);
    const formatted = formatTimeMask(digits);
    onChange(formatted);
  }, [onChange]);

  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        placeholder={placeholder}
        className={`px-3 py-2 border rounded-lg text-sm bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${error ? 'border-red-400' : 'border-gray-300'} ${className}`}
        {...rest}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
