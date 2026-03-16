"use client";

interface CategoryTabsProps {
  active: string;
  onChange: (cat: string) => void;
}

const tabs = ["Todos", "Torta", "Bolo"];

export function CategoryTabs({ active, onChange }: CategoryTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`
            px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap
            transition-all duration-200
            ${
              active === tab
                ? "bg-chocolate text-cream shadow-md scale-105"
                : "bg-white text-chocolate border border-chocolate/20 hover:border-chocolate/50 hover:bg-chocolate/5"
            }
          `}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
