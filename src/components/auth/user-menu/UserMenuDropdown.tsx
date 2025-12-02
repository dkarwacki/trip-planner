/**
 * User Menu Dropdown
 *
 * Desktop dropdown menu showing user info and logout option.
 */

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { User, LogOut } from "lucide-react";
import { useAuthStore, type AuthUser } from "../stores";

interface UserMenuDropdownProps {
  user: AuthUser;
}

export function UserMenuDropdown({ user }: UserMenuDropdownProps) {
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = async () => {
    await logout();
  };

  // Get initials for avatar
  const getInitials = () => {
    if (user.name) {
      return user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return user.email[0].toUpperCase();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full bg-slate-700 hover:bg-slate-600">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name ?? user.email} className="h-full w-full rounded-full object-cover" />
          ) : (
            <span className="text-sm font-medium text-white">{getInitials()}</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 border-slate-700 bg-slate-800" align="end" sideOffset={8}>
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name ?? user.email}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <User className="h-4 w-4 text-slate-300" />
            )}
          </div>
          <div className="flex flex-col">
            {user.name && <span className="text-sm font-medium text-white">{user.name}</span>}
            <span className="text-xs text-slate-400">{user.email}</span>
          </div>
        </div>
        <DropdownMenuSeparator className="bg-slate-700" />
        <DropdownMenuItem
          className="cursor-pointer text-red-400 focus:bg-red-500/10 focus:text-red-400"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
