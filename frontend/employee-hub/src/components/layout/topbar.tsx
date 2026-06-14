import { Bell, Moon, Search, Sun, Menu, LogOut, User, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuthStore } from "@/store/auth-store";
import { useThemeStore } from "@/store/theme-store";
import { useDataStore } from "@/store/data-store";
import { useNavigate, Link } from "@tanstack/react-router";

interface Props {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: Props) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { theme, toggle } = useThemeStore();
  const notifications = useDataStore((s) => s.notifications);
  const markAllRead = useDataStore((s) => s.markAllNotificationsRead);
  const navigate = useNavigate();

  const userIdentifier = user?.username || user?.email || "??";
  const initials = userIdentifier.slice(0, 2).toUpperCase();

  const visible = notifications
    .filter((n) => !n.forRole || n.forRole === user?.role)
    .slice(0, 8);
  const unread = visible.filter((n) => !n.read).length;

  // FIX: logout is now async — await it before navigating
  const handleLogout = async () => {
    await logout();
    navigate({ to: "/login" });
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 backdrop-blur-md px-4 md:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
        <Menu className="h-5 w-5" />
      </Button>
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search employees, requests…" className="pl-9 bg-muted/40 border-0" />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggle}>
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute top-1.5 right-1.5 h-4 min-w-4 px-1 rounded-full bg-accent text-[9px] font-semibold text-accent-foreground flex items-center justify-center">
                  {unread}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-2 py-1.5">
              <DropdownMenuLabel className="px-0">Notifications</DropdownMenuLabel>
              {unread > 0 && (
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={markAllRead}>
                  <Check className="h-3 w-3 mr-1" /> Mark all read
                </Button>
              )}
            </div>
            <DropdownMenuSeparator />
            <div className="max-h-80 overflow-y-auto">
              {visible.length === 0 && (
                <div className="text-center text-xs text-muted-foreground py-6">No notifications.</div>
              )}
              {visible.map((n) => (
                <div key={n.id} className={`px-3 py-2.5 border-b border-border last:border-0 ${!n.read ? "bg-muted/30" : ""}`}>
                  <div className="text-sm font-medium">{n.title}</div>
                  <div className="text-xs text-muted-foreground line-clamp-2">{n.body}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-medium leading-tight">{user?.username || user?.email}</div>
                <div className="text-[10px] text-muted-foreground capitalize">{user?.role ?? "User"}</div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profile">
                <User className="mr-2 h-4 w-4" /> Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
