"use client"

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import {
  AlertTriangle,
  Download,
  Loader2,
  Package,
  RefreshCw,
  Search,
  ShoppingBag,
  Truck,
  Wallet,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { OrderStatusBadge } from "@/app/(private)/user/orders/_components/order-status-badge"
import {
  formatOrderDate,
  orderStatusStyles,
} from "@/app/(private)/user/orders/_components/order-utils"
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
import { IOrder, OrderStatus } from "@/interfaces"
import { cn } from "@/lib/utils"
import {
  getAllOrders,
  updateOrderById,
  updateOrdersStatus,
} from "@/services/orders"

import {
  currencyFormatter,
  customerEmail,
  customerName,
  downloadOrdersCsv,
  formatOrderNumber,
  isSlaRisk,
  needsStatusConfirm,
  ORDER_STATUSES,
  orderItemCount,
  orderSearchHaystack,
} from "./admin-order-utils"
import { OrderDetailSheet } from "./order-detail-sheet"
import { OrderStatusSelect } from "./order-status-select"

type StatusFilter = "all" | OrderStatus | "at_risk"

type PendingChange = {
  ids: string[]
  status: OrderStatus
}

export function AdminOrders() {
  const [orders, setOrders] = useState<IOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkStatus, setBulkStatus] = useState<OrderStatus>("shipped")
  const [updatingIds, setUpdatingIds] = useState<string[]>([])
  const [selectedOrder, setSelectedOrder] = useState<IOrder | null>(null)
  const [pendingChange, setPendingChange] = useState<PendingChange | null>(null)

  const loadOrders = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) setIsLoading(true)
    try {
      const data = await getAllOrders()
      setOrders(data)
      setSelectedIds((current) =>
        current.filter((id) => data.some((order) => order.id === id))
      )
      setSelectedOrder((current) =>
        current ? data.find((order) => order.id === current.id) ?? current : null
      )
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load orders. Please try again."
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase()
    return orders.filter((order) => {
      if (statusFilter === "at_risk" && !isSlaRisk(order)) return false
      if (
        statusFilter !== "all" &&
        statusFilter !== "at_risk" &&
        order.status !== statusFilter
      ) {
        return false
      }
      if (query && !orderSearchHaystack(order).includes(query)) return false
      return true
    })
  }, [orders, search, statusFilter])

  const metrics = useMemo(() => {
    const revenue = orders
      .filter((order) => order.status !== "cancelled")
      .reduce((sum, order) => sum + order.total, 0)
    const toFulfill = orders.filter((order) => order.status === "paid").length
    const inTransit = orders.filter((order) => order.status === "shipped").length
    const atRisk = orders.filter(isSlaRisk).length
    return { revenue, toFulfill, inTransit, atRisk, total: orders.length }
  }, [orders])

  const visibleIds = filteredOrders.map((order) => order.id)
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id))

  function toggleSelected(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id]
    )
  }

  function toggleSelectAllVisible() {
    setSelectedIds((current) => {
      if (allVisibleSelected) {
        return current.filter((id) => !visibleIds.includes(id))
      }
      return Array.from(new Set([...current, ...visibleIds]))
    })
  }

  async function applyStatusChange(ids: string[], status: OrderStatus) {
    const uniqueIds = Array.from(new Set(ids))
    if (uniqueIds.length === 0) return

    setUpdatingIds(uniqueIds)
    try {
      const updated =
        uniqueIds.length === 1
          ? [await updateOrderById(uniqueIds[0], { status })]
          : await updateOrdersStatus(uniqueIds, status)

      const updatedById = new Map(updated.map((order) => [order.id, order]))
      setOrders((current) =>
        current.map((order) => updatedById.get(order.id) ?? order)
      )
      setSelectedOrder((current) =>
        current ? updatedById.get(current.id) ?? current : null
      )
      toast.success(
        uniqueIds.length === 1
          ? `Order status updated to ${orderStatusStyles[status].label}.`
          : `${uniqueIds.length} orders updated to ${orderStatusStyles[status].label}.`
      )
      setPendingChange(null)
      if (uniqueIds.length > 1) {
        setSelectedIds([])
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update order status."
      )
    } finally {
      setUpdatingIds([])
    }
  }

  function requestStatusChange(ids: string[], nextStatus: OrderStatus) {
    const uniqueIds = Array.from(new Set(ids))
    const requiresConfirm = uniqueIds.some((id) => {
      const order = orders.find((item) => item.id === id)
      return order ? needsStatusConfirm(order.status, nextStatus) : false
    })

    if (requiresConfirm) {
      setPendingChange({ ids: uniqueIds, status: nextStatus })
      return
    }

    void applyStatusChange(uniqueIds, nextStatus)
  }

  const filterPills: { id: StatusFilter; label: string }[] = [
    { id: "all", label: `All (${orders.length})` },
    ...ORDER_STATUSES.map((status) => ({
      id: status as StatusFilter,
      label: `${orderStatusStyles[status].label} (${orders.filter((order) => order.status === status).length})`,
    })),
    { id: "at_risk", label: `SLA risk (${metrics.atRisk})` },
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
          label="Gross merchandise"
          value={currencyFormatter.format(metrics.revenue)}
          hint={`${metrics.total} orders`}
          icon={<Wallet className="size-4" />}
          active={statusFilter === "all"}
          onClick={() => setStatusFilter("all")}
        />
        <MetricCard
          label="Ready to fulfill"
          value={String(metrics.toFulfill)}
          hint="Paid, awaiting shipment"
          icon={<Package className="size-4" />}
          active={statusFilter === "paid"}
          onClick={() => setStatusFilter("paid")}
        />
        <MetricCard
          label="In transit"
          value={String(metrics.inTransit)}
          hint="Shipped to customers"
          icon={<Truck className="size-4" />}
          active={statusFilter === "shipped"}
          onClick={() => setStatusFilter("shipped")}
        />
        <MetricCard
          label="SLA risk"
          value={String(metrics.atRisk)}
          hint="Paid over 48 hours"
          icon={<AlertTriangle className="size-4" />}
          active={statusFilter === "at_risk"}
          onClick={() => setStatusFilter("at_risk")}
        />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {filterPills.map((pill) => (
            <Button
              key={pill.id}
              type="button"
              size="sm"
              variant={statusFilter === pill.id ? "default" : "outline"}
              onClick={() => setStatusFilter(pill.id)}
            >
              {pill.label}
            </Button>
          ))}
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-md">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search customer, order ID, payment, city, or item"
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
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => loadOrders({ silent: true })}
            >
              <RefreshCw />
              Refresh
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => downloadOrdersCsv(filteredOrders)}
              disabled={filteredOrders.length === 0}
            >
              <Download />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      {selectedIds.length > 0 ? (
        <div className="bg-muted/40 flex flex-col gap-3 rounded-xl p-3 ring-1 ring-foreground/10 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium">
            {selectedIds.length} selected
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={bulkStatus}
              onValueChange={(value) => setBulkStatus(value as OrderStatus)}
            >
              <SelectTrigger size="sm" className="min-w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORDER_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {orderStatusStyles[status].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              size="sm"
              disabled={updatingIds.length > 0}
              onClick={() => requestStatusChange(selectedIds, bulkStatus)}
            >
              {updatingIds.length > 0 ? (
                <>
                  Updating
                  <Loader2 className="size-4 animate-spin" />
                </>
              ) : (
                "Apply status"
              )}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setSelectedIds([])}
            >
              Clear
            </Button>
          </div>
        </div>
      ) : null}

      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="flex items-start gap-4 p-6">
            <div className="bg-muted flex size-12 items-center justify-center rounded-full">
              <ShoppingBag className="text-muted-foreground size-5" />
            </div>
            <div>
              <p className="font-semibold">No orders match these filters</p>
              <p className="text-muted-foreground text-sm">
                Try another status, clear search, or wait for customers to
                check out.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Table>
          <TableHeader className="bg-muted">
            <TableRow className="hover:bg-muted">
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  className="size-4 accent-primary"
                  checked={allVisibleSelected}
                  onChange={toggleSelectAllVisible}
                  aria-label="Select all visible orders"
                />
              </TableHead>
              <TableHead className="font-bold">Order</TableHead>
              <TableHead className="font-bold">Customer</TableHead>
              <TableHead className="font-bold">Items</TableHead>
              <TableHead className="font-bold">Total</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              <TableHead className="text-right font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((order) => {
              const itemCount = orderItemCount(order)
              const updating = updatingIds.includes(order.id)

              return (
                <TableRow key={order.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      className="size-4 accent-primary"
                      checked={selectedIds.includes(order.id)}
                      onChange={() => toggleSelected(order.id)}
                      aria-label={`Select order ${formatOrderNumber(order.id)}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">
                        {formatOrderNumber(order.id)}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {formatOrderDate(order.created_at)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">{customerName(order)}</span>
                      <span className="text-muted-foreground text-xs">
                        {customerEmail(order) ||
                          order.address?.city ||
                          "No contact"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="max-w-48 truncate text-sm">
                      {order.items.map((item) => item.name).join(", ") || "—"}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {itemCount} {itemCount === 1 ? "item" : "items"}
                    </p>
                  </TableCell>
                  <TableCell className="font-medium tabular-nums">
                    {currencyFormatter.format(order.total)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col items-start gap-2">
                      <OrderStatusSelect
                        value={order.status}
                        disabled={updating}
                        onChange={(status) =>
                          requestStatusChange([order.id], status)
                        }
                      />
                      {isSlaRisk(order) ? (
                        <span className="text-amber-700 dark:text-amber-400 text-xs font-medium">
                          Overdue to ship
                        </span>
                      ) : (
                        <OrderStatusBadge status={order.status} />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedOrder(order)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}

      <OrderDetailSheet
        order={selectedOrder}
        isUpdating={
          selectedOrder ? updatingIds.includes(selectedOrder.id) : false
        }
        onOpenChange={(open) => {
          if (!open) setSelectedOrder(null)
        }}
        onStatusChange={(status) => {
          if (selectedOrder) {
            requestStatusChange([selectedOrder.id], status)
          }
        }}
      />

      <Dialog
        open={Boolean(pendingChange)}
        onOpenChange={(open) => {
          if (!open && updatingIds.length === 0) setPendingChange(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm status change</DialogTitle>
            <DialogDescription>
              {pendingChange?.status === "cancelled"
                ? "Cancelling cannot be undone from the customer’s perspective. Payment records stay attached to the order."
                : "This moves one or more orders backward or out of a terminal state. Use only for operations corrections."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={updatingIds.length > 0}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant={pendingChange?.status === "cancelled" ? "destructive" : "default"}
              disabled={!pendingChange || updatingIds.length > 0}
              onClick={() => {
                if (!pendingChange) return
                void applyStatusChange(pendingChange.ids, pendingChange.status)
              }}
            >
              {updatingIds.length > 0 ? (
                <>
                  Updating
                  <Loader2 className="size-4 animate-spin" />
                </>
              ) : (
                "Confirm"
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
      <Card
        className={cn(
          "transition-colors",
          active && "ring-2 ring-primary/40"
        )}
      >
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
