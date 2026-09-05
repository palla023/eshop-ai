"use client"

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import {
  Download,
  Loader2,
  RefreshCw,
  Search,
  Shield,
  UserCheck,
  UserMinus,
  Users,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { IUser } from "@/interfaces"
import { cn } from "@/lib/utils"
import {
  deleteUserProfileById,
  getAllUserProfiles,
  updateUserProfileById,
} from "@/services/users"
import { useUserStore } from "@/store/user-store"

import {
  downloadUsersCsv,
  formatUserDate,
  isLastActiveAdmin,
  type RoleFilter,
  type StatusFilter,
  userInitials,
  userSearchHaystack,
} from "./admin-user-utils"
import { RoleBadge, StatusBadge } from "./user-badges"
import { UserDetailSheet } from "./user-detail-sheet"
import { UserForm } from "./user-form"

export function AdminUsers() {
  const currentUser = useUserStore((state) => state.user)
  const setUser = useUserStore((state) => state.setUser)

  const [users, setUsers] = useState<IUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null)
  const [editingUser, setEditingUser] = useState<IUser | null>(null)
  const [deletingUser, setDeletingUser] = useState<IUser | null>(null)
  const [updatingIds, setUpdatingIds] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)

  const loadUsers = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) setIsLoading(true)
    try {
      const data = await getAllUserProfiles()
      setUsers(data)
      setSelectedUser((current) =>
        current ? data.find((user) => user.id === current.id) ?? current : null
      )
      setEditingUser((current) =>
        current ? data.find((user) => user.id === current.id) ?? current : null
      )
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load users. Please try again."
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase()
    return users.filter((user) => {
      if (roleFilter !== "all" && user.role !== roleFilter) return false
      if (statusFilter === "active" && user.is_active === false) return false
      if (statusFilter === "inactive" && user.is_active !== false) return false
      if (query && !userSearchHaystack(user).includes(query)) return false
      return true
    })
  }, [users, search, roleFilter, statusFilter])

  const metrics = useMemo(() => {
    const admins = users.filter((user) => user.role === "admin").length
    const customers = users.filter((user) => user.role !== "admin").length
    const inactive = users.filter((user) => user.is_active === false).length
    const active = users.length - inactive
    return { total: users.length, admins, customers, active, inactive }
  }, [users])

  function applyUser(updated: IUser) {
    setUsers((current) => {
      const exists = current.some((user) => user.id === updated.id)
      const next = exists
        ? current.map((user) => (user.id === updated.id ? updated : user))
        : [updated, ...current]
      return next
    })
    setSelectedUser((current) =>
      current?.id === updated.id ? updated : current
    )
    if (currentUser?.id === updated.id) {
      setUser({ ...currentUser, ...updated })
    }
  }

  async function handleToggleActive(user: IUser) {
    const nextActive = user.is_active === false
    setUpdatingIds((current) => [...current, user.id])
    try {
      const updated = await updateUserProfileById(user.id, {
        is_active: nextActive,
      })
      applyUser(updated)
      toast.success(
        nextActive ? "User reactivated." : "User deactivated. They cannot sign in."
      )
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update access."
      )
    } finally {
      setUpdatingIds((current) => current.filter((id) => id !== user.id))
    }
  }

  async function handleDelete() {
    if (!deletingUser) return
    setIsDeleting(true)
    try {
      await deleteUserProfileById(deletingUser.id)
      setUsers((current) => current.filter((user) => user.id !== deletingUser.id))
      setSelectedUser((current) =>
        current?.id === deletingUser.id ? null : current
      )
      toast.success("User profile deleted.")
      setDeletingUser(null)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete user."
      )
    } finally {
      setIsDeleting(false)
    }
  }

  const filterPills: { id: RoleFilter | StatusFilter; label: string; kind: "role" | "status" }[] = [
    { id: "all", label: `All (${metrics.total})`, kind: "role" },
    { id: "user", label: `Customers (${metrics.customers})`, kind: "role" },
    { id: "admin", label: `Admins (${metrics.admins})`, kind: "role" },
    { id: "active", label: `Active (${metrics.active})`, kind: "status" },
    { id: "inactive", label: `Inactive (${metrics.inactive})`, kind: "status" },
  ]

  if (isLoading) {
    return (
      <div className="flex min-h-80 w-full items-center justify-center">
        <Loader2 className="text-muted-foreground size-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="All accounts"
          value={String(metrics.total)}
          hint="Profiles on file"
          icon={<Users className="size-4" />}
          active={roleFilter === "all" && statusFilter === "all"}
          onClick={() => {
            setRoleFilter("all")
            setStatusFilter("all")
          }}
        />
        <MetricCard
          label="Customers"
          value={String(metrics.customers)}
          hint="Shopper role"
          icon={<UserCheck className="size-4" />}
          active={roleFilter === "user"}
          onClick={() => setRoleFilter(roleFilter === "user" ? "all" : "user")}
        />
        <MetricCard
          label="Admins"
          value={String(metrics.admins)}
          hint="Staff seats"
          icon={<Shield className="size-4" />}
          active={roleFilter === "admin"}
          onClick={() => setRoleFilter(roleFilter === "admin" ? "all" : "admin")}
        />
        <MetricCard
          label="Inactive"
          value={String(metrics.inactive)}
          hint="Blocked from login"
          icon={<UserMinus className="size-4" />}
          active={statusFilter === "inactive"}
          onClick={() =>
            setStatusFilter(statusFilter === "inactive" ? "all" : "inactive")
          }
        />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {filterPills.map((pill) => {
            const active =
              pill.id === "all" && pill.kind === "role"
                ? roleFilter === "all" && statusFilter === "all"
                : pill.kind === "role"
                  ? roleFilter === pill.id
                  : statusFilter === pill.id
            return (
              <Button
                key={`${pill.kind}-${pill.id}`}
                type="button"
                size="sm"
                variant={active ? "default" : "outline"}
                onClick={() => {
                  if (pill.id === "all" && pill.kind === "role") {
                    setRoleFilter("all")
                    setStatusFilter("all")
                    return
                  }
                  if (pill.kind === "role") {
                    setRoleFilter(pill.id as RoleFilter)
                  } else {
                    setStatusFilter(pill.id as StatusFilter)
                  }
                }}
              >
                {pill.label}
              </Button>
            )
          })}
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-md">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email, or user ID"
              className="pl-8"
            />
            {search ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="absolute top-1/2 right-2 -translate-y-1/2"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                <X />
              </Button>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={roleFilter}
              onValueChange={(value) => setRoleFilter(value as RoleFilter)}
            >
              <SelectTrigger size="sm" className="min-w-32">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="user">Customers</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => loadUsers({ silent: true })}
            >
              <RefreshCw />
              Refresh
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => downloadUsersCsv(filteredUsers)}
              disabled={filteredUsers.length === 0}
            >
              <Download />
              Export CSV
            </Button>
            <UserForm
              currentUserId={currentUser?.id}
              onSuccess={(created) => applyUser(created)}
            />
          </div>
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="flex items-start gap-4 p-6">
            <div className="bg-muted flex size-12 items-center justify-center rounded-full">
              <Users className="text-muted-foreground size-5" />
            </div>
            <div>
              <p className="font-semibold">No users match these filters</p>
              <p className="text-muted-foreground text-sm">
                Try another role, clear search, or add a new account.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Table>
          <TableHeader className="bg-muted">
            <TableRow className="hover:bg-muted">
              <TableHead className="font-bold">User</TableHead>
              <TableHead className="font-bold">Role</TableHead>
              <TableHead className="font-bold">Access</TableHead>
              <TableHead className="font-bold">Joined</TableHead>
              <TableHead className="text-right font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => {
              const updating = updatingIds.includes(user.id)
              const isSelf = currentUser?.id === user.id
              const photo = user.profile_pic?.trim()

              return (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="size-10 overflow-hidden rounded-full ring-1 ring-foreground/10">
                        {photo ? (
                          <img
                            src={photo}
                            alt={user.name}
                            className="size-full object-cover"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center bg-linear-to-br from-zinc-200 to-zinc-500 text-xs font-semibold text-black">
                            {userInitials(user.name, user.email)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {user.name || "Untitled user"}
                          {isSelf ? (
                            <span className="text-muted-foreground ml-1.5 text-xs font-normal">
                              you
                            </span>
                          ) : null}
                        </p>
                        <p className="text-muted-foreground truncate text-xs">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <RoleBadge role={user.role} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge isActive={user.is_active !== false} />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatUserDate(user.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedUser(user)}
                      >
                        View
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={updating}
                        onClick={() => setEditingUser(user)}
                      >
                        Edit
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}

      <UserForm
        user={editingUser ?? undefined}
        currentUserId={currentUser?.id}
        lockPrivileges={
          editingUser
            ? currentUser?.id === editingUser.id ||
              isLastActiveAdmin(users, editingUser)
            : false
        }
        open={Boolean(editingUser)}
        showTrigger={false}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setEditingUser(null)
        }}
        onSuccess={(updated) => applyUser(updated)}
      />

      <UserDetailSheet
        user={selectedUser}
        isCurrentUser={Boolean(
          selectedUser && currentUser?.id === selectedUser.id
        )}
        lockPrivileges={
          selectedUser
            ? currentUser?.id === selectedUser.id ||
              isLastActiveAdmin(users, selectedUser)
            : false
        }
        isUpdating={
          selectedUser ? updatingIds.includes(selectedUser.id) : false
        }
        onOpenChange={(open) => {
          if (!open) setSelectedUser(null)
        }}
        onEdit={() => {
          if (selectedUser) setEditingUser(selectedUser)
        }}
        onToggleActive={() => {
          if (selectedUser) void handleToggleActive(selectedUser)
        }}
        onDelete={() => {
          if (selectedUser) setDeletingUser(selectedUser)
        }}
      />

      <Dialog
        open={Boolean(deletingUser)}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeletingUser(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete user</DialogTitle>
            <DialogDescription>
              Delete{" "}
              <span className="font-bold">{deletingUser?.name}</span> (
              {deletingUser?.email})? This removes the store profile and related
              addresses and orders. Prefer deactivation if you only need to
              block login.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isDeleting}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting}
              onClick={() => void handleDelete()}
            >
              {isDeleting ? (
                <>
                  Deleting
                  <Loader2 className="size-4 animate-spin" />
                </>
              ) : (
                "Delete profile"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function MetricCard({
  label,
  value,
  hint,
  icon,
  active,
  onClick,
}: {
  label: string
  value: string
  hint: string
  icon: ReactNode
  active: boolean
  onClick: () => void
}) {
  return (
    <button type="button" onClick={onClick} className="text-left">
      <Card className={cn("transition-colors", active && "ring-2 ring-primary/40")}>
        <CardContent className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              {label}
            </p>
            <p className="text-xl font-semibold tabular-nums">{value}</p>
            <p className="text-muted-foreground text-xs">{hint}</p>
          </div>
          <div className="bg-muted text-muted-foreground flex size-8 items-center justify-center rounded-full">
            {icon}
          </div>
        </CardContent>
      </Card>
    </button>
  )
}
