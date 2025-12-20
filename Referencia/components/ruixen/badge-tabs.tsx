
import React, { useState } from "react";

export interface BadgeTabItem {
  value: string;
  label: string;
  badge?: number;
  content: React.ReactNode;
}

interface BadgeTabsProps {
  items: BadgeTabItem[];
  defaultValue?: string;
  className?: string;
}

const BadgeTabs: React.FC<BadgeTabsProps> = ({ items, defaultValue, className = "" }) => {
  const [activeTab, setActiveTab] = useState(defaultValue || items[0]?.value);

  const activeContent = items.find((item) => item.value === activeTab)?.content;

  return (
    <div className={`w-full ${className}`}>
      {/* Tab List */}
      <div className="flex flex-wrap gap-2 mb-6 p-1 bg-slate-100/80 rounded-2xl w-fit">
        {items.map((item) => {
          const isActive = activeTab === item.value;
          return (
            <button
              key={item.value}
              onClick={() => setActiveTab(item.value)}
              className={`
                relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300
                ${
                  isActive
                    ? "bg-white text-slate-800 shadow-sm ring-1 ring-black/5"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                }
              `}
            >
              <span>{item.label}</span>
              {item.badge && item.badge > 0 && (
                <span
                  className={`
                    flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] rounded-full leading-none transition-colors
                    ${
                      isActive
                        ? "bg-rose-500 text-white"
                        : "bg-slate-200 text-slate-600 group-hover:bg-slate-300"
                    }
                  `}
                >
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="animate-fadeIn">
        {activeContent}
      </div>
    </div>
  );
};

export default BadgeTabs;
