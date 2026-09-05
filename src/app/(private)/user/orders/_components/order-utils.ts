import { IOrder, OrderStatus } from "@/interfaces"

export const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
})

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
})

export function formatOrderDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return dateFormatter.format(date)
}

export function formatOrderNumber(id: string | number) {
  const value = String(id ?? "").trim()
  if (!value) return "#—"
  if (/^\d+$/.test(value)) {
    return `#${value}`
  }
  return `#${value.replace(/-/g, "").slice(0, 8).toUpperCase()}`
}

export function orderItemCount(order: IOrder) {
  return order.items.reduce((sum, item) => sum + (item.quantity || 0), 0)
}

export function orderTax(order: IOrder) {
  return Math.max(0, order.total - order.subtotal - order.shipping_fee)
}

export const orderStatusStyles: Record<
  OrderStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "Pending",
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  paid: {
    label: "Paid",
    className: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
  },
  shipped: {
    label: "Shipped",
    className: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
  },
  delivered: {
    label: "Delivered",
    className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-destructive/10 text-destructive",
  },
}
