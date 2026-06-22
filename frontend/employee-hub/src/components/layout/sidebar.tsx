import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarCheck,
  Wallet,
  PalmtreeIcon,
  Megaphone,
  Settings,
  UserCircle,
  Sparkles,
  Briefcase,
  ShieldCheck,
  ScrollText,
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { cn } from "@/lib/utils";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard };

// Matches Django ROLE_CHOICES exactly: admin | manager | employee
const navByRole: Record<'admin' | 'manager' | 'employee', NavItem[]> = {
  admin: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/employees", label: "Employees", icon: Users },
    { to: "/departments", label: "Departments", icon: Building2 },
    { to: "/positions", label: "Positions", icon: Briefcase },
    { to: "/attendance", label: "Attendance", icon: CalendarCheck },
    { to: "/leave", label: "Leave Requests", icon: PalmtreeIcon },
    { to: "/payroll", label: "Payroll", icon: Wallet },
    { to: "/announcements", label: "Announcements", icon: Megaphone },
    { to: "/settings", label: "Settings", icon: Settings },
  ],
  manager: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/employees", label: "My Team", icon: Users },
    { to: "/attendance", label: "Team Attendance", icon: CalendarCheck },
    { to: "/leave", label: "Leave Approvals", icon: PalmtreeIcon },
    { to: "/announcements", label: "Announcements", icon: Megaphone },
    { to: "/settings", label: "Settings", icon: Settings },
  ],
  employee: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/attendance", label: "My Attendance", icon: CalendarCheck },
    { to: "/leave", label: "My Leave", icon: PalmtreeIcon },
    { to: "/payroll", label: "Payroll", icon: Wallet },
    { to: "/announcements", label: "Announcements", icon: Megaphone },
    { to: "/settings", label: "Settings", icon: Settings },
  ],
};

interface Props {
  onNavigate?: () => void;
}

export function AppSidebar({ onNavigate }: Props) {
  const user = useAuthStore((s) => s.user);
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  // Guard: no user = not logged in yet
  if (!user) return null;

  // FIX: role is now flat on user, not nested under user.employee
  const currentRole = user.role;
  const items = navByRole[currentRole] ?? [];

  return (
    <aside className="flex h-full w-64 flex-col bg-sidebar border-r border-sidebar-border">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-sidebar-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent glow-primary">
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <div className="text-sm font-semibold text-sidebar-foreground">Nimbus HR</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {currentRole} portal
          </div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.to || pathname.startsWith(item.to + "/");
          return (
            <Link
              key={item.to}
              to={item.to as string}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground hover:bg-sidebar-accent",
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-4 border-t border-sidebar-border">
        <div className="rounded-lg bg-gradient-to-br from-primary/20 to-accent/10 p-3 border border-primary/20">
          <div className="text-xs font-medium text-sidebar-foreground">Need help?</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            Check our HR handbook
          </div>
        </div>
      </div>
    </aside>
  );
}
