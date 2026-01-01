/**
 * FilterBottomSheet - Phase 2 Mobile Filter Enhancement
 * Mobile-friendly slide-up filter panel with swipe-to-close
 */

import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../design-system';
import { triggerHaptic } from '../utils/haptic';
import '../styles/filter-bottom-sheet.css';

export interface FilterOption {
  id: string;
  label: string;
  value: string;
  selected: boolean;
}

export interface FilterGroup {
  id: string;
  title: string;
  options: FilterOption[];
  multiSelect?: boolean;
}

interface FilterBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filterGroups: FilterGroup[];
  onApplyFilters: (filters: FilterGroup[]) => void;
  onClearAll: () => void;
  activeFilterCount?: number;
}

export const FilterBottomSheet: React.FC<FilterBottomSheetProps> = ({
  isOpen,
  onClose,
  filterGroups,
  onApplyFilters,
  onClearAll,
  activeFilterCount = 0,
}) => {
  const { t } = useTranslation();
  const sheetRef = useRef<HTMLDivElement>(null);
  const [localFilters, setLocalFilters] = useState<FilterGroup[]>(filterGroups);
  const [startY, setStartY] = useState<number>(0);
  const [currentY, setCurrentY] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(filterGroups);
  }, [filterGroups]);

  // Handle swipe down to close
  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const deltaY = e.touches[0].clientY - startY;
    if (deltaY > 0) {
      setCurrentY(deltaY);
    }
  };

  const handleTouchEnd = () => {
    if (currentY > 100) {
      onClose();
    }
    setCurrentY(0);
    setIsDragging(false);
  };

  // Handle filter selection
  const handleFilterToggle = (groupId: string, optionId: string) => {
    triggerHaptic('selection');
    setLocalFilters((prev) =>
      prev.map((group) => {
        if (group.id !== groupId) return group;

        return {
          ...group,
          options: group.options.map((option) => {
            if (group.multiSelect) {
              // Multi-select: toggle the clicked option
              return option.id === optionId
                ? { ...option, selected: !option.selected }
                : option;
            } else {
              // Single select: only one can be selected
              return { ...option, selected: option.id === optionId };
            }
          }),
        };
      })
    );
  };

  const handleApply = () => {
    triggerHaptic('success');
    onApplyFilters(localFilters);
    onClose();
  };

  const handleClear = () => {
    triggerHaptic('light');
    setLocalFilters((prev) =>
      prev.map((group) => ({
        ...group,
        options: group.options.map((option) => ({ ...option, selected: false })),
      }))
    );
    onClearAll();
  };

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="filter-bottom-sheet-backdrop" onClick={handleBackdropClick}>
      <div
        ref={sheetRef}
        className={`filter-bottom-sheet ${isDragging ? 'dragging' : ''}`}
        style={{
          transform: `translateY(${currentY}px)`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag Handle */}
        <div className="sheet-handle" aria-hidden="true">
          <div className="handle-bar" />
        </div>

        {/* Header */}
        <div className="sheet-header">
          <div className="sheet-title">
            <h2>{t('filters.title', 'Filters')}</h2>
            {activeFilterCount > 0 && (
              <span className="filter-count-badge">{activeFilterCount}</span>
            )}
          </div>
          <button
            className="sheet-close-button"
            onClick={onClose}
            aria-label={t('common.close', 'Close')}
          >
            ✕
          </button>
        </div>

        {/* Filter Groups */}
        <div className="sheet-content">
          {localFilters.map((group) => (
            <div key={group.id} className="filter-group">
              <h3 className="filter-group-title">{group.title}</h3>
              <div className="filter-options">
                {group.options.map((option) => (
                  <button
                    key={option.id}
                    className={`filter-chip ${option.selected ? 'selected' : ''}`}
                    onClick={() => handleFilterToggle(group.id, option.id)}
                    aria-pressed={option.selected}
                  >
                    {option.selected && <span className="check-icon">✓</span>}
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="sheet-footer">
          <Button
            variant="outline"
            size="md"
            onClick={handleClear}
            disabled={activeFilterCount === 0}
          >
            {t('filters.clearAll', 'Clear All')}
          </Button>
          <Button variant="primary" size="md" onClick={handleApply}>
            {t('filters.apply', 'Apply Filters')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FilterBottomSheet;
