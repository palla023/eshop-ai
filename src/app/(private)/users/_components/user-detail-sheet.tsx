"use client"

import type { ReactNode } from "react"
import { Mail, Shield, UserRound } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { IUser } from "@/interfaces"

import { formatUserDate, userInitials } from "./admin-user-utils"
import { RoleBadge, StatusBadge } from "./user-badges"

type UserDetailSheetProps = {
  user: IUser | null
  isCurrentUser: boolean
  lockPrivileges: boolean
  isUpdating: boolean
  onOpenChange: (open: boolean) => void
  onEdit: () => void
  onToggleActive: () => void
  onDelete: () => void
}

export function UserDetailSheet({
  user,
  isCurrentUser,
  lockPrivileges,
  isUpdating,
  onOpenChange,
  onEdit,
  onToggleActive,
  onDelete,
}: UserDetailSheetProps) {
  const photo = user?.profile_pic?.trim()
  const active = user ? user.is_active !== false : false

  return (
    <Sheet open={Boolean(user)} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-lg"
      >
        {user ? (
          <>
            <SheetHeader className="border-b">
              <SheetTitle className="flex flex-wrap items-center gap-2">
                {user.name || "Untitled user"}
                <RoleBadge role={user.role} />
                <StatusBadge isActive={active} />
              </SheetTitle>
              <SheetDescription>
                Joined {formatUserDate(user.created_at)}
                {isCurrentUser ? " · This is you" : ""}
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-6 px-4 pb-6">
              <div className="flex items-center gap-4">
                <div className="size-16 overflow-hidden rounded-full ring-1 ring-foreground/10">
                  {photo ? (
                    <img
                      src={photo}
                      alt={user.name}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center bg-linear-to-br from-zinc-200 to-zinc-500 text-lg font-semibold text-black">
                      {userInitials(user.name, user.email)}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium">{user.name}</p>
                  <p className="text-muted-foreground truncate text-sm">
                    {user.email}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <DetailStat
                  icon={<Mail className="size-4" />}
                  label="Email"
                  value={user.email}
                />
                <DetailStat
                  icon={<Shield className="size-4" />}
                  label="Role"
                  value={user.role === "admin" ? "Admin" : "Customer"}
                />
                <DetailStat
                  icon={<UserRound className="size-4" />}
                  label="User ID"
                  value={user.id}
                />
              </div>

              <Separator />

              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={onEdit} disabled={isUpdating}>
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onToggleActive}
                  disabled={isUpdating || lockPrivileges}
                >
                  {active ? "Deactivate" : "Reactivate"}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={onDelete}
                  disabled={isUpdating || isCurrentUser || lockPrivileges}
                >
                  Delete
                </Button>
              </div>
              {lockPrivileges ? (
                <p className="text-muted-foreground text-xs">
                  {isCurrentUser
                    ? "You can edit your name, but you cannot change your own access from here."
                    : "This is the last active admin. Promote another admin before changing access."}
                </p>
              ) : null}
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

function DetailStat({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border p-3">
      <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase">
        {icon}
        {label}
      </p>
      <p className="mt-1 break-all text-sm font-medium">{value}</p>
    </div>
  )
}
