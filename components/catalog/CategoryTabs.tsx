"use client";

interface CategoryTabsProps {
  active: string;
  onChange: (cat: string) => void;
  categories: string[];
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function CategoryTabs({ active, onChange, categories }: CategoryTabsProps) {
  const tabs = ["Todos", ...categories];
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
                ? "bg-burgundy text-cream shadow-md scale-105"
                : "bg-white text-burgundy border border-burgundy/20 hover:border-burgundy/50 hover:bg-burgundy/5"
            }
          `}
        >
          {tab === "Todos" ? tab : capitalize(tab)}
        </button>
      ))}
    </div>
  );
}
