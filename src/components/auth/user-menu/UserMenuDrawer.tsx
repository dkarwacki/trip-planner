/**
 * User Menu Drawer
 *
 * Mobile drawer showing user info and logout option.
 * Uses Vaul for the drawer component.
 */

import React, { useState } from "react";
import { Drawer } from "vaul";
import { Button } from "@/components/ui/button";
import { User, LogOut } from "lucide-react";
import { useAuthStore, type AuthUser } from "../stores";

interface UserMenuDrawerProps {
  user: AuthUser;
}

export function UserMenuDrawer({ user }: UserMenuDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = async () => {
    setIsOpen(false);
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
    <Drawer.Root open={isOpen} onOpenChange={setIsOpen}>
      <Drawer.Trigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full bg-slate-700 hover:bg-slate-600 p-0">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name ?? user.email} className="h-full w-full rounded-full object-cover" />
          ) : (
            <span className="text-sm font-medium text-white">{getInitials()}</span>
          )}
        </Button>
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 z-50" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 mt-24 flex h-auto flex-col rounded-t-2xl bg-slate-800 border-t border-slate-700">
          <div className="mx-auto mt-4 h-1.5 w-12 flex-shrink-0 rounded-full bg-slate-600" />
          <div className="p-6">
            {/* User Info */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-700">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name ?? user.email}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <User className="h-5 w-5 text-slate-300" />
                )}
              </div>
              <div className="flex flex-col">
                {user.name && <span className="text-base font-medium text-white">{user.name}</span>}
                <span className="text-sm text-slate-400">{user.email}</span>
              </div>
            </div>

            {/* Menu Items */}
            <div className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start text-red-400 hover:bg-red-500/10 hover:text-red-400"
                onClick={handleLogout}
              >
                <LogOut className="mr-3 h-5 w-5" />
                Sign out
              </Button>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
