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

  return (
    <Drawer.Root open={isOpen} onOpenChange={setIsOpen}>
      <Drawer.Trigger asChild>
        <button
          className="rounded-lg p-2 text-gray-700 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label="Profile"
        >
          {user.avatar ? (
            <img src={user.avatar} alt={user.name ?? user.email} className="h-5 w-5 rounded-full object-cover" />
          ) : (
            <User className="h-5 w-5" />
          )}
        </button>
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 mt-24 flex h-auto flex-col rounded-t-2xl bg-background border-t border-border">
          <div className="mx-auto mt-4 h-1.5 w-12 flex-shrink-0 rounded-full bg-muted-foreground/30" />
          <div className="p-6">
            {/* User Info */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name ?? user.email}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <User className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex flex-col">
                {user.name && <span className="text-base font-medium text-foreground">{user.name}</span>}
                <span className="text-sm text-muted-foreground">{user.email}</span>
              </div>
            </div>

            {/* Menu Items */}
            <div className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start"
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




