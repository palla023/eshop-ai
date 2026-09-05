"use client"

import { useState } from "react"
import Link from "next/link"
import { Loader2, LogOut, MapPin, ShoppingBag, UserRound } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { clearSessionOnAuthError } from "@/services/users"
import { useUserStore } from "@/store/user-store"

import { ChangePasswordForm } from "./_components/change-password-form"
import { ProfileDetailsForm } from "./_components/profile-details-form"

function getInitials(name?: string) {
  if (!name?.trim()) return "U"
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "U"
  )
}

function memberSince(value?: string) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export default function UserProfilePage() {
  const user = useUserStore((state) => state.user)
  const clearUser = useUserStore((state) => state.clearUser)
  const [isSigningOut, setIsSigningOut] = useState(false)

  if (!user) {
    return (
      <div className="flex min-h-48 items-center justify-center">
        <Loader2 className="text-muted-foreground size-8 animate-spin" />
      </div>
    )
  }

  const displayName = user.name?.trim() || user.email
  const hasPhoto = Boolean(user.profile_pic?.trim())

  async function handleSignOut() {
    if (isSigningOut) return
    setIsSigningOut(true)
    try {
      await clearSessionOnAuthError()
      clearUser()
      window.location.replace("/login")
    } catch (error) {
      setIsSigningOut(false)
      toast.error(
        error instanceof Error ? error.message : "Could not sign out."
      )
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <section className="relative overflow-hidden rounded-2xl bg-zinc-950 px-5 py-6 text-white sm:px-8 sm:py-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.18),transparent_42%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="relative size-16 shrink-0 overflow-hidden rounded-full ring-2 ring-white/20 sm:size-20">
              {hasPhoto ? (
                <img
                  src={user.profile_pic}
                  alt={displayName}
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center bg-linear-to-br from-zinc-200 to-zinc-500 text-lg font-semibold text-black">
                  {getInitials(user.name || user.email)}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs tracking-wide text-white/55 uppercase">
                Account · My profile
              </p>
              <h1 className="mt-1 truncate text-2xl font-bold tracking-tight sm:text-3xl">
                {displayName}
              </h1>
              <p className="mt-1 truncate text-sm text-white/70">{user.email}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium capitalize">
              {user.role}
            </span>
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/80">
              Member since {memberSince(user.created_at)}
            </span>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(22rem,1fr)]">
        <div className="flex flex-col gap-4">
          <ProfileDetailsForm user={user} />
          <ChangePasswordForm />
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Account snapshot</CardTitle>
              <CardDescription>
                Details tied to this signed-in session.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 pt-4">
              <dl className="grid gap-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Role</dt>
                  <dd className="capitalize">{user.role}</dd>
                </div>
                <Separator />
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd>Active</dd>
                </div>
                <Separator />
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Member since</dt>
                  <dd className="text-right">{memberSince(user.created_at)}</dd>
                </div>
                <Separator />
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Auth email</dt>
                  <dd className="max-w-[60%] truncate text-right">{user.email}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle>Shortcuts</CardTitle>
              <CardDescription>Jump to related account settings.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 pt-4">
              <Link
                href="/user/address"
                className="hover:bg-muted/60 flex items-start gap-3 rounded-xl border p-3 transition-colors"
              >
                <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg">
                  <MapPin className="size-4" />
                </div>
                <div>
                  <p className="font-medium">Shipping addresses</p>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    Add or edit delivery locations used at checkout.
                  </p>
                </div>
              </Link>
              <Link
                href="/user/orders"
                className="hover:bg-muted/60 flex items-start gap-3 rounded-xl border p-3 transition-colors"
              >
                <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg">
                  <ShoppingBag className="size-4" />
                </div>
                <div>
                  <p className="font-medium">Order history</p>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    Review purchases, status, and invoices.
                  </p>
                </div>
              </Link>
              <Link
                href="/user/dashboard"
                className="hover:bg-muted/60 flex items-start gap-3 rounded-xl border p-3 transition-colors"
              >
                <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg">
                  <UserRound className="size-4" />
                </div>
                <div>
                  <p className="font-medium">Dashboard</p>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    Spend, pipeline, and account overview.
                  </p>
                </div>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle>Session</CardTitle>
              <CardDescription>
                Sign out of this device when you are done shopping.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <Button
                type="button"
                variant="destructive"
                className="w-full"
                disabled={isSigningOut}
                onClick={handleSignOut}
              >
                {isSigningOut ? <Loader2 className="animate-spin" /> : <LogOut />}
                Sign out
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
