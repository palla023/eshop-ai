import { IOrder, OrderStatus } from "@/interfaces"

import {
  currencyFormatter,
  formatOrderNumber,
  orderItemCount,
} from "@/app/(private)/user/orders/_components/order-utils"

export { currencyFormatter, formatOrderNumber, orderItemCount }

export const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "paid",
  "shipped",
  "delivered",
  "cancelled",
]

export const SLA_HOURS = 48

const STATUS_RANK: Record<OrderStatus, number> = {
  pending: 0,
  paid: 1,
  shipped: 2,
  delivered: 3,
  cancelled: 4,
}

export function customerName(order: IOrder) {
  return (
    order.customer?.name?.trim() ||
    order.address?.name?.trim() ||
    `Customer #${order.user_id}`
  )
}

export function customerEmail(order: IOrder) {
  return order.customer?.email?.trim() || ""
}

export function isSlaRisk(order: IOrder) {
  if (order.status !== "paid") return false
  const created = new Date(order.created_at).getTime()
  if (Number.isNaN(created)) return false
  return Date.now() - created > SLA_HOURS * 60 * 60 * 1000
}

export function needsStatusConfirm(from: OrderStatus, to: OrderStatus) {
  if (from === to) return false
  if (to === "cancelled") return true
  if (from === "cancelled" || from === "delivered") return true
  return STATUS_RANK[to] < STATUS_RANK[from]
}

export function orderSearchHaystack(order: IOrder) {
  return [
    formatOrderNumber(order.id),
    order.id,
    order.payment_id,
    customerName(order),
    customerEmail(order),
    order.address?.phone,
    order.address?.city,
    order.address?.state,
    order.address?.postal_code,
    ...order.items.map((item) => item.name),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
}

export function downloadOrdersCsv(orders: IOrder[]) {
  const header = [
    "Order ID",
    "Created at",
    "Status",
    "Customer",
    "Email",
    "Items",
    "Item count",
    "Subtotal",
    "Shipping",
    "Total",
    "Payment ID",
    "City",
    "State",
  ]

  const rows = orders.map((order) => [
    order.id,
    order.created_at,
    order.status,
    customerName(order),
    customerEmail(order),
    order.items.map((item) => `${item.name} x${item.quantity}`).join("; "),
    String(orderItemCount(order)),
    String(order.subtotal),
    String(order.shipping_fee),
    String(order.total),
    order.payment_id ?? "",
    order.address?.city ?? "",
    order.address?.state ?? "",
  ])

  const csv = [header, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")
    )
    .join("\n")

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
