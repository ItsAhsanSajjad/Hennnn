import { Search, X } from "lucide-react";

export interface FilterOption<T extends string> {
  id: T;
  label: string;
  count?: number;
}

interface FilterBarProps<T extends string> {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder?: string;
  filterOptions?: FilterOption<T>[];
  selectedFilter?: T;
  onFilterChange?: (filterId: T) => void;
  totalResultsText?: string;
}

export function FilterBar<T extends string>({
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search records...",
  filterOptions,
  selectedFilter,
  onFilterChange,
  totalResultsText,
}: FilterBarProps<T>) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <Search
          size={16}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#566D7E]"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full rounded-2xl border border-[#D8793F]/25 bg-[#FFFDF4] py-2.5 pl-10 pr-10 text-xs font-bold text-[#17372F] placeholder:text-[#566D7E]/70 focus:border-[#10B981] focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 shadow-sm min-h-[44px]"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#566D7E] hover:text-[#17372F] p-1"
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Filter Tabs & Counter */}
      <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
        {filterOptions && onFilterChange && selectedFilter && (
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#FFF8EC] border border-[#D8793F]/20">
            {filterOptions.map((opt) => {
              const isSelected = selectedFilter === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onFilterChange(opt.id)}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-black uppercase tracking-wider transition cursor-pointer min-h-[36px] flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-[#17372F] text-[#FFFDF4] shadow-sm"
                      : "text-[#566D7E] hover:text-[#17372F] hover:bg-[#FFFDF4]/80"
                  }`}
                >
                  <span>{opt.label}</span>
                  {typeof opt.count === "number" && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                        isSelected ? "bg-white/20 text-white" : "bg-[#D8793F]/15 text-[#8C3A14]"
                      }`}
                    >
                      {opt.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {totalResultsText && (
          <span className="text-xs font-bold text-[#566D7E] px-2">{totalResultsText}</span>
        )}
      </div>
    </div>
  );
}
