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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-1.5">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name ?? user.email} className="h-5 w-5 rounded-full object-cover" />
          ) : (
            <User className="h-4 w-4" />
          )}
          <span>Profile</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" sideOffset={8}>
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name ?? user.email}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <User className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <div className="flex flex-col">
            {user.name && <span className="text-sm font-medium text-foreground">{user.name}</span>}
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
