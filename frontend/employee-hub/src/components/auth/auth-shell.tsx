import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export function AuthShell({ title, subtitle, children }: Props) {
  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex relative overflow-hidden bg-gradient-to-br from-primary/30 via-background to-accent/20 p-12 flex-col justify-between">
        <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_30%_20%,oklch(0.65_0.2_275),transparent_50%),radial-gradient(circle_at_70%_80%,oklch(0.72_0.17_162),transparent_50%)]" />
        <div className="relative flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-semibold tracking-tight">Nimbus HR</span>
        </div>
        <div className="relative max-w-md space-y-4">
          <h2 className="text-3xl font-semibold leading-tight">
            The modern way to run your <span className="gradient-text">people operations</span>.
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage employees, track attendance, approve leave, and run payroll — all in one elegant workspace.
          </p>
          <div className="flex gap-2 pt-2">
            <div className="h-1 w-12 rounded-full bg-primary" />
            <div className="h-1 w-6 rounded-full bg-muted" />
            <div className="h-1 w-6 rounded-full bg-muted" />
          </div>
        </div>
        <div className="relative text-xs text-muted-foreground">
          © {new Date().getFullYear()} Nimbus HR. All rights reserved.
        </div>
      </div>
      <div className="flex items-center justify-center p-6 md:p-12">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-6"
        >
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          </div>
          {children}
        </motion.div>
      </div>
    </div>
  );
}