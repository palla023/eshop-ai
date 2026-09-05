import dayjs from "dayjs"

import { IUser } from "@/interfaces"

export type RoleFilter = "all" | IUser["role"]
export type StatusFilter = "all" | "active" | "inactive"

export function userInitials(name?: string, email?: string) {
  const source = name?.trim() || email?.trim() || "U"
  const parts = source.split(/\s+/).slice(0, 2)
  const initials = parts.map((part) => part[0]?.toUpperCase() ?? "").join("")
  return initials || "U"
}

export function formatUserDate(value?: string) {
  if (!value) return "—"
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format("DD MMM YYYY, hh:mm A") : "—"
}

export function userSearchHaystack(user: IUser) {
  return [user.name, user.email, user.role, user.id]
    .join(" ")
    .toLowerCase()
}

export function downloadUsersCsv(users: IUser[]) {
  const header = ["Name", "Email", "Role", "Status", "Created at"]
  const rows = users.map((user) => [
    user.name,
    user.email,
    user.role,
    user.is_active === false ? "inactive" : "active",
    user.created_at,
  ])
  const csv = [header, ...rows]
    .map((row) =>
      row
        .map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`)
        .join(",")
    )
    .join("\n")

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `users-${dayjs().format("YYYY-MM-DD")}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export function isLastActiveAdmin(users: IUser[], user: IUser) {
  if (user.role !== "admin" || user.is_active === false) return false
  return users.filter((row) => row.role === "admin" && row.is_active !== false)
    .length <= 1
}
