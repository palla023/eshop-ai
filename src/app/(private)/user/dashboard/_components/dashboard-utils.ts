import { IOrder, OrderStatus } from "@/interfaces"

export const ACTIVE_STATUSES: OrderStatus[] = ["pending", "paid", "shipped"]

export function greetingForHour(hour: number) {
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

export function isCancelled(order: IOrder) {
  return order.status === "cancelled"
}

export function lifetimeSpend(orders: IOrder[]) {
  return orders
    .filter((order) => !isCancelled(order))
    .reduce((sum, order) => sum + order.total, 0)
}

export function activeOrderCount(orders: IOrder[]) {
  return orders.filter((order) => ACTIVE_STATUSES.includes(order.status)).length
}

export function statusCounts(orders: IOrder[]) {
  const counts: Record<OrderStatus, number> = {
    pending: 0,
    paid: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  }

  for (const order of orders) {
    counts[order.status] = (counts[order.status] ?? 0) + 1
  }

  return counts
}

export function monthlySpendSeries(orders: IOrder[], months = 6) {
  const now = new Date()
  const buckets = Array.from({ length: months }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (months - 1 - index), 1)
    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label: date.toLocaleString("en-IN", { month: "short" }),
      total: 0,
    }
  })

  const indexByKey = new Map(buckets.map((bucket, index) => [bucket.key, index]))

  for (const order of orders) {
    if (isCancelled(order)) continue
    const date = new Date(order.created_at)
    if (Number.isNaN(date.getTime())) continue
    const key = `${date.getFullYear()}-${date.getMonth()}`
    const index = indexByKey.get(key)
    if (index == null) continue
    buckets[index].total += order.total
  }

  const max = Math.max(...buckets.map((bucket) => bucket.total), 0)
  return { buckets, max }
}

export function lastPurchasedLabel(orders: IOrder[]) {
  const paidOrders = orders.filter((order) => !isCancelled(order))
  if (paidOrders.length === 0) return "No purchases yet"
  const latest = paidOrders[0]
  const date = new Date(latest.created_at)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}
