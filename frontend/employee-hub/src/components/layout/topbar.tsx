import { Bell, Moon, Search, Sun, Menu, LogOut, User } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore } from "@/store/auth-store";
import { useThemeStore } from "@/store/theme-store";
import { useNavigate, Link } from "@tanstack/react-router";
import { useEmployees } from "@/api/queries/useEmployees";
import { useAnnouncements } from "@/api/queries/useAnnouncements";

const DJANGO_BASE = "http://127.0.0.1:8000";

interface Props {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: Props) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { theme, toggle } = useThemeStore();
  const navigate = useNavigate();

  // Get current user's employee record for profile picture
  const { data: employees = [] } = useEmployees();
  const me = employees.find((e) => e.user.username === user?.username);

  // Use latest announcements as notifications (no notification model in Django)
  const { data: announcements = [] } = useAnnouncements();
  const recentAnnouncements = [...announcements]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 5);

  const userIdentifier = user?.username || "??";
  const initials = userIdentifier.slice(0, 2).toUpperCase();

  const avatarSrc = (() => {
    if (!me?.profile_picture) return undefined;
    return me.profile_picture.startsWith("http")
      ? me.profile_picture
      : `${DJANGO_BASE}/media/${me.profile_picture}`;
  })();

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

        {/* Notifications — latest announcements */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              {recentAnnouncements.length > 0 && (
                <span className="absolute top-1.5 right-1.5 h-4 min-w-4 px-1 rounded-full bg-accent text-[9px] font-semibold text-accent-foreground flex items-center justify-center">
                  {recentAnnouncements.length}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-2 py-1.5">
              <DropdownMenuLabel className="px-0">Announcements</DropdownMenuLabel>
            </div>
            <DropdownMenuSeparator />
            <div className="max-h-80 overflow-y-auto">
              {recentAnnouncements.length === 0 && (
                <div className="text-center text-xs text-muted-foreground py-6">No announcements.</div>
              )}
              {recentAnnouncements.map((a) => (
                <div key={a.id} className="px-3 py-2.5 border-b border-border last:border-0 hover:bg-muted/20">
                  <div className="text-sm font-medium">{a.title}</div>
                  <div className="text-xs text-muted-foreground line-clamp-2">{a.content}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">
                    {new Date(a.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
            {recentAnnouncements.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/announcements" className="text-xs text-center w-full justify-center text-primary">
                    View all announcements
                  </Link>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={avatarSrc} alt={userIdentifier} className="object-cover" />
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-medium leading-tight">{user?.username}</div>
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
