import React from 'react';
import { Search, X, Star, Code, Link as LinkIcon, Type, Image as ImageIcon, CheckSquare } from 'lucide-react';
import { ContentType } from '../types';

export type FilterCategory = 'all' | 'pinned' | ContentType;

interface FilterBarProps {
  selectedFilter: FilterCategory;
  onSelectFilter: (filter: FilterCategory) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalCount: number;
  filteredCount: number;
  pinnedCount: number;
  isMultiSelectMode?: boolean;
  onToggleSelectMode?: () => void;
  selectedCount?: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  selectedFilter,
  onSelectFilter,
  searchQuery,
  onSearchChange,
  totalCount,
  filteredCount,
  pinnedCount,
  isMultiSelectMode = false,
  onToggleSelectMode,
  selectedCount = 0,
}) => {
  const filters: { id: FilterCategory; label: string; icon?: React.ElementType; badge?: number }[] = [
    { id: 'all', label: 'All', badge: totalCount },
    { id: 'pinned', label: 'Pinned', icon: Star, badge: pinnedCount },
    { id: 'text', label: 'Text', icon: Type },
    { id: 'code', label: 'Code', icon: Code },
    { id: 'link', label: 'Links', icon: LinkIcon },
    { id: 'image', label: 'Media', icon: ImageIcon },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 py-2">
      {/* Category Pills & Select Mode Button */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        {filters.map((f) => {
          const isSelected = selectedFilter === f.id;
          const Icon = f.icon;
          return (
            <button
              key={f.id}
              onClick={() => onSelectFilter(f.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer whitespace-nowrap ${
                isSelected
                  ? 'bg-[#282724] text-[#FAF8F5] font-medium border border-[#3E3D38]'
                  : 'text-[#8C877D] hover:text-[#FAF8F5] hover:bg-[#1E1D1B]'
              }`}
            >
              {Icon && <Icon className={`w-3.5 h-3.5 ${f.id === 'pinned' && isSelected ? 'fill-[#D97706] text-[#D97706]' : ''}`} />}
              <span>{f.label}</span>
              {f.badge !== undefined && f.badge > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected ? 'bg-[#191816] text-[#FAF8F5]' : 'bg-[#201F1D] text-[#716C62]'
                  }`}
                >
                  {f.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Quick Multi-Select Mode Toggle */}
        {onToggleSelectMode && totalCount > 0 && (
          <button
            onClick={onToggleSelectMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap border transition-colors ${
              isMultiSelectMode
                ? 'bg-[#252119] border-[#59441D] text-[#D97706]'
                : 'bg-[#181715] hover:bg-[#22211F] border-[#262522] text-[#8C877D] hover:text-[#FAF8F5]'
            }`}
            title="Toggle item multi-select"
          >
            <CheckSquare className={`w-3.5 h-3.5 ${isMultiSelectMode ? 'text-[#D97706]' : ''}`} />
            <span>Select</span>
            {selectedCount > 0 && (
              <span className="text-[10px] px-1.5 rounded-full bg-[#D97706] text-black font-semibold font-mono">
                {selectedCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="relative w-full sm:w-64">
        <input
          id="filter-search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search clips... (/)"
          className="w-full pl-8 pr-12 py-1.5 text-xs bg-[#181715] border border-[#262522] hover:border-[#353430] focus:border-[#D97706] rounded-lg text-[#FAF8F5] placeholder-[#635F57] transition-colors"
        />
        <Search className="w-3.5 h-3.5 text-[#635F57] absolute left-2.5 top-2.5" />
        {searchQuery ? (
          <button
            onClick={() => onSearchChange('')}
            className="p-1 text-[#635F57] hover:text-[#FAF8F5] absolute right-1.5 top-1.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <kbd className="hidden sm:inline-block absolute right-2 top-2 px-1.5 py-0.2 rounded bg-[#121211] border border-[#2D2B26] text-[10px] font-mono text-[#635F57]">
            /
          </kbd>
        )}
      </div>
    </div>
  );
};
