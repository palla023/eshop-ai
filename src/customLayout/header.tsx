"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, LogOut, Menu, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { IUser } from "@/interfaces";
import { clearSessionOnAuthError } from "@/services/users";
import { useUserStore } from "@/store/user-store";
import MenuItems from "./menu-items";

function getInitials(name?: string) {
  if (!name?.trim()) return "U";
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "U"
  );
}

const PrivateLayoutHeader = ({ user }: { user: IUser }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const clearUser = useUserStore((state) => state.clearUser);
  const displayName = user.name?.trim() || user.email;
  const hasPhoto = Boolean(user.profile_pic?.trim());

  async function handleSignOut() {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await clearSessionOnAuthError();
      clearUser();
      window.location.replace("/login");
    } catch {
      setIsSigningOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black">
      <div className="flex w-full items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-2xl font-bold tracking-tight text-white"
        >
          <ShoppingBag className="size-6" aria-hidden />
          Eshop
        </Link>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 py-1 pl-3.5 pr-1 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
            <div className="flex min-w-0 flex-col items-end leading-tight">
              <span className="max-w-[140px] truncate text-sm font-medium text-white sm:max-w-[200px]">
                {displayName}
              </span>
            </div>
            <div className="relative size-9 shrink-0 overflow-hidden rounded-full ring-2 ring-white/20">
              {hasPhoto ? (
                <img
                  src={user.profile_pic}
                  alt={displayName}
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center bg-linear-to-br from-zinc-200 to-zinc-400 text-xs font-semibold text-black">
                  {getInitials(user.name || user.email)}
                </div>
              )}
            </div>
          </div>

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-lg"
                aria-label="Open menu"
                className="text-white hover:bg-white/10 hover:text-white"
              >
                <Menu className="size-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-sm">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
                <SheetDescription>
                  {user.role === "admin" ? "Admin navigation" : "Account navigation"}
                </SheetDescription>
              </SheetHeader>
              <MenuItems onNavigate={() => setMenuOpen(false)} />
              <SheetFooter className="border-t">
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full justify-start gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={isSigningOut}
                  onClick={handleSignOut}
                >
                  {isSigningOut ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <LogOut className="size-4" />
                  )}
                  Sign out
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default PrivateLayoutHeader;
