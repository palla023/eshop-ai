import { IUser } from "@/interfaces"
import { cn } from "@/lib/utils"

export function RoleBadge({ role }: { role: IUser["role"] }) {
  const isAdmin = role === "admin"
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        isAdmin
          ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300"
          : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
      )}
    >
      {isAdmin ? "Admin" : "Customer"}
    </span>
  )
}

export function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        isActive
          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
          : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
      )}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  )
}
