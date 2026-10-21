import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

export interface SelectOption {
  value: string | number;
  label: string;
  subLabel?: string;
  badge?: string;
  badgeClassName?: string;
}

export interface SearchableSelectProps {
  value: string | number | null | undefined | Array<string | number>;
  onChange: (value: any) => void;
  options: SelectOption[];
  placeholder?: string;
  allOptionLabel?: string;
  icon?: React.ReactNode;
  className?: string;
  dropdownClassName?: string;
  disabled?: boolean;
  isMulti?: boolean;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Pilih opsi...',
  allOptionLabel = 'Semua',
  icon,
  className = '',
  dropdownClassName = '',
  disabled = false,
  isMulti = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.subLabel && opt.subLabel.toLowerCase().includes(q)) ||
        (opt.badge && opt.badge.toLowerCase().includes(q))
    );
  }, [options, search]);

  // Selected values as string array for multi-mode
  const selectedValues: string[] = useMemo(() => {
    if (value === null || value === undefined || value === '') return [];
    if (Array.isArray(value)) {
      return value.map(String);
    }
    return [String(value)];
  }, [value]);

  // Current selected option for single-select mode
  const singleSelectedOption = useMemo(() => {
    if (isMulti) return null;
    if (value === null || value === undefined || value === '') return null;
    return options.find((opt) => String(opt.value) === String(value)) || null;
  }, [isMulti, options, value]);

  // Selected options for multi-select mode
  const selectedMultiOptions = useMemo(() => {
    if (!isMulti) return [];
    return options.filter((opt) => selectedValues.includes(String(opt.value)));
  }, [isMulti, options, selectedValues]);

  const isSelected = isMulti
    ? selectedValues.length > 0
    : value !== null && value !== undefined && value !== '';

  // Single select handler
  const handleSelectSingle = (val: string | number | null) => {
    onChange(val);
    setIsOpen(false);
    setSearch('');
  };

  // Multi select toggle handler
  const handleToggleMulti = (val: string | number) => {
    const strVal = String(val);
    let next: string[];
    if (selectedValues.includes(strVal)) {
      next = selectedValues.filter((v) => v !== strVal);
    } else {
      next = [...selectedValues, strVal];
    }
    onChange(next.length > 0 ? next : null);
  };

  // Select all currently visible options
  const handleSelectAll = () => {
    const visibleValues = filteredOptions.map((opt) => String(opt.value));
    const merged = Array.from(new Set([...selectedValues, ...visibleValues]));
    onChange(merged);
  };

  // Clear all selections
  const handleClearAll = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onChange(null);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-1.5 pl-8 pr-2.5 py-1 bg-slate-950 border ${
          isOpen
            ? 'border-indigo-500 ring-1 ring-indigo-500/50'
            : isSelected
            ? 'border-indigo-500/60 bg-slate-900/90'
            : 'border-slate-700/80 hover:border-slate-600'
        } rounded-lg text-xs font-medium text-white transition-all cursor-pointer truncate ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {/* Left Icon */}
        {icon && (
          <div className="absolute left-2.5 text-slate-400 pointer-events-none flex items-center justify-center">
            {icon}
          </div>
        )}

        {/* Selected Label Display */}
        <div className="truncate text-left flex-1 flex items-center gap-1.5">
          {isMulti ? (
            selectedValues.length === 0 ? (
              <span className="text-slate-300 truncate">{allOptionLabel || placeholder}</span>
            ) : selectedValues.length === 1 ? (
              <span className="text-white font-medium truncate">
                {selectedMultiOptions[0]?.label || selectedValues[0]}
              </span>
            ) : (
              <div className="flex items-center gap-1.5 truncate">
                <span className="px-1.5 py-0.5 rounded bg-indigo-500/25 text-indigo-300 font-bold text-[10px] shrink-0 border border-indigo-500/30">
                  {selectedValues.length} Terpilih
                </span>
                <span className="truncate text-slate-300 text-xs">
                  {selectedMultiOptions[0]?.label || selectedValues[0]} (+{selectedValues.length - 1})
                </span>
              </div>
            )
          ) : (
            <span className="truncate">
              {singleSelectedOption ? singleSelectedOption.label : allOptionLabel || placeholder}
            </span>
          )}
        </div>

        {/* Action icons on right */}
        <div className="flex items-center gap-1 shrink-0 ml-1 text-slate-400">
          {isSelected && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClearAll}
              title="Hapus pilihan"
              className="p-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-3 h-3" />
            </span>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-indigo-400' : 'text-slate-400'
            }`}
          />
        </div>
      </button>

      {/* Flyout Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute left-0 top-full mt-1.5 z-[100] min-w-[240px] max-w-[340px] w-full bg-slate-950 border border-slate-700/90 rounded-xl shadow-2xl shadow-black ring-1 ring-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-100 ${dropdownClassName}`}
        >
          {/* Search Input Box */}
          <div className="p-2 border-b border-slate-800/90 bg-slate-900/95">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setIsOpen(false);
                }}
                placeholder="Ketik untuk mencari..."
                className="w-full pl-8 pr-7 py-1 bg-slate-950 border border-slate-700/80 rounded-md text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2 text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Multi-select Quick Action Toolbar */}
          {isMulti && (
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/90 border-b border-slate-800/80 text-[11px]">
              <span className="text-slate-400 font-medium">
                {selectedValues.length} dari {options.length} dipilih
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors cursor-pointer"
                >
                  {search ? 'Pilih Hasil' : 'Pilih Semua'}
                </button>
                <span className="text-slate-700">|</span>
                <button
                  type="button"
                  onClick={() => handleClearAll()}
                  className="text-slate-400 hover:text-rose-400 font-semibold transition-colors cursor-pointer"
                >
                  Hapus
                </button>
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5 text-xs bg-slate-950">
            {/* Single Select Default "Semua ..." Option (if no search query) */}
            {!isMulti && !search && allOptionLabel && (
              <button
                type="button"
                onClick={() => handleSelectSingle(null)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                  !isSelected
                    ? 'bg-indigo-600/20 text-indigo-300 font-semibold border border-indigo-500/30'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <span>{allOptionLabel}</span>
                {!isSelected && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
              </button>
            )}

            {/* List of Options */}
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const optValStr = String(opt.value);
                const isItemActive = isMulti
                  ? selectedValues.includes(optValStr)
                  : String(value) === optValStr;

                return (
                  <button
                    key={optValStr}
                    type="button"
                    onClick={() => {
                      if (isMulti) {
                        handleToggleMulti(opt.value);
                      } else {
                        handleSelectSingle(opt.value);
                      }
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                      isItemActive
                        ? 'bg-indigo-600/20 text-indigo-200 font-semibold border border-indigo-500/30'
                        : 'text-slate-300 hover:bg-slate-800/70 hover:text-white border border-transparent'
                    }`}
                  >
                    {/* Multi-Select Checkbox Box */}
                    {isMulti && (
                      <div
                        className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          isItemActive
                            ? 'bg-indigo-600 border-indigo-500 text-white'
                            : 'border-slate-600 bg-slate-900/90 text-transparent'
                        }`}
                      >
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}

                    <div className="truncate flex-1">
                      <span className="block truncate">{opt.label}</span>
                      {opt.subLabel && (
                        <span className="block text-[10px] text-slate-400 truncate">
                          {opt.subLabel}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {opt.badge && (
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-semibold border ${
                            opt.badgeClassName || 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {opt.badge}
                        </span>
                      )}
                      {!isMulti && isItemActive && (
                        <Check className="w-3.5 h-3.5 text-indigo-400" />
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="py-4 text-center text-slate-500 text-xs">
                Tidak ada hasil untuk &ldquo;{search}&rdquo;
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
