"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

import PageTitle from "@/components/ui/page-title"
import { useUserStore } from "@/store/user-store"

import { AdminUsers } from "./_components/admin-users"

export default function AdminUsersPage() {
  const router = useRouter()
  const user = useUserStore((state) => state.user)

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.replace("/user/dashboard")
    }
  }, [user, router])

  if (!user || user.role !== "admin") {
    return null
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-1">
        <PageTitle title="Users" />
        <p className="text-muted-foreground text-sm">
          Create accounts, assign roles, and deactivate access without losing
          order history.
        </p>
      </div>
      <AdminUsers />
    </div>
  )
}
