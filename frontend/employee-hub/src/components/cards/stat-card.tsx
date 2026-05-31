import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: string | number;
  delta?: string;
  icon: LucideIcon;
  tone?: "primary" | "accent" | "warning" | "destructive";
}

const tones = {
  primary: "from-primary/30 to-primary/5 text-primary",
  accent: "from-accent/30 to-accent/5 text-accent",
  warning: "from-yellow-500/30 to-yellow-500/5 text-yellow-500",
  destructive: "from-destructive/30 to-destructive/5 text-destructive",
};

export function StatCard({ label, value, delta, icon: Icon, tone = "primary" }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="glass rounded-xl p-5 relative overflow-hidden group"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight">{value}</div>
          {delta && <div className="mt-1 text-xs text-muted-foreground">{delta}</div>}
        </div>
        <div
          className={cn(
            "h-10 w-10 rounded-lg bg-gradient-to-br flex items-center justify-center",
            tones[tone],
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
}