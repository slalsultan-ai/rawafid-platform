import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color?: "teal" | "emerald" | "amber" | "blue" | "rose";
  description?: string;
}

const colorMap = {
  teal: { bg: "bg-teal-50", icon: "bg-teal-100 text-teal-700", value: "text-teal-700" },
  emerald: { bg: "bg-emerald-50", icon: "bg-emerald-100 text-emerald-700", value: "text-emerald-700" },
  amber: { bg: "bg-amber-50", icon: "bg-amber-100 text-amber-700", value: "text-amber-700" },
  blue: { bg: "bg-blue-50", icon: "bg-blue-100 text-blue-700", value: "text-blue-700" },
  rose: { bg: "bg-rose-50", icon: "bg-rose-100 text-rose-700", value: "text-rose-700" },
};

export function StatsCard({ title, value, icon: Icon, color = "teal", description }: StatsCardProps) {
  const colors = colorMap[color];
  return (
    <div className={cn("rounded-xl p-5 border border-white/50 shadow-sm", colors.bg)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className={cn("text-3xl font-bold mt-1", colors.value)}>{value}</p>
          {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
        </div>
        <div className={cn("p-2.5 rounded-xl", colors.icon)}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
