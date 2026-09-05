"use client"

import PageTitle from "@/components/ui/page-title"

import { AdminOrders } from "./_components/admin-orders"

export default function AdminOrdersPage() {
  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-1">
        <PageTitle title="Orders" />
        <p className="text-muted-foreground text-sm">
          Review every customer order, update fulfillment, and export operations
          reports.
        </p>
      </div>
      <AdminOrders />
    </div>
  )
}
