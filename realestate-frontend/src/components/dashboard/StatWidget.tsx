"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

interface StatWidgetProps {
  title: string;
  value: string | number | null | undefined;
  icon: LucideIcon;
  colorClass?: string; // e.g., "text-blue-600", "text-red-600"
  bgColorClass?: string; // e.g., "bg-blue-50", "bg-red-50"
  borderColorClass?: string; // e.g., "border-blue-200"
}

export default function StatWidget({
  title,
  value,
  icon: Icon,
  colorClass = "text-gray-600",
  bgColorClass = "bg-white",
  borderColorClass = "border-gray-200",
}: StatWidgetProps) {
  // Format value based on type
  const formattedValue = React.useMemo(() => {
    if (value === null || value === undefined) return "—";
    if (typeof value === "number") {
      return value.toLocaleString();
    }
    return value;
  }, [value]);

  return (
    <div className={`bg-white border rounded-xl p-5 shadow-sm transition-all hover:shadow-md ${borderColorClass}`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg ${bgColorClass}`}>
          <Icon className={`w-5 h-5 ${colorClass}`} />
        </div>
      </div>
      <div>
        <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</div>
        <div className="text-2xl font-black text-gray-900">{formattedValue}</div>
      </div>
    </div>
  );
}
