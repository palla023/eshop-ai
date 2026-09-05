import { IOrder, IProduct, IUser, OrderStatus } from "@/interfaces"

import { isSlaRisk } from "@/app/(private)/orders/_components/admin-order-utils"
import {
  greetingForHour,
  lifetimeSpend,
  monthlySpendSeries,
  statusCounts,
} from "@/app/(private)/user/dashboard/_components/dashboard-utils"

export { greetingForHour, lifetimeSpend, monthlySpendSeries, statusCounts }

export const PIPELINE_STATUSES: OrderStatus[] = [
  "pending",
  "paid",
  "shipped",
  "delivered",
  "cancelled",
]

export const PIPELINE_BAR: Record<OrderStatus, string> = {
  pending: "bg-amber-500",
  paid: "bg-sky-500",
  shipped: "bg-indigo-500",
  delivered: "bg-emerald-500",
  cancelled: "bg-zinc-400",
}

export function averageOrderValue(orders: IOrder[]) {
  const billed = orders.filter((order) => order.status !== "cancelled")
  if (billed.length === 0) return 0
  return lifetimeSpend(orders) / billed.length
}

export function openFulfillmentCount(orders: IOrder[]) {
  return orders.filter((order) =>
    ["pending", "paid", "shipped"].includes(order.status)
  ).length
}

export function slaRiskCount(orders: IOrder[]) {
  return orders.filter(isSlaRisk).length
}

export function fulfilmentRate(orders: IOrder[]) {
  if (orders.length === 0) return 0
  const delivered = orders.filter((order) => order.status === "delivered").length
  return Math.round((delivered / orders.length) * 100)
}

export function cancellationRate(orders: IOrder[]) {
  if (orders.length === 0) return 0
  const cancelled = orders.filter((order) => order.status === "cancelled").length
  return Math.round((cancelled / orders.length) * 100)
}

export function ordersToday(orders: IOrder[], now = new Date()) {
  return orders.filter((order) => {
    const date = new Date(order.created_at)
    if (Number.isNaN(date.getTime())) return false
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    )
  }).length
}

export function attentionOrders(orders: IOrder[], limit = 6) {
  const ranked = orders
    .filter(
      (order) =>
        order.status === "pending" ||
        order.status === "paid" ||
        isSlaRisk(order)
    )
    .slice()
    .sort((a, b) => {
      const aRisk = isSlaRisk(a) ? 0 : a.status === "pending" ? 1 : 2
      const bRisk = isSlaRisk(b) ? 0 : b.status === "pending" ? 1 : 2
      if (aRisk !== bRisk) return aRisk - bRisk
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    })

  return ranked.slice(0, limit)
}

export type ProductRank = {
  id: string
  name: string
  image?: string
  quantity: number
  revenue: number
}

export function topProducts(orders: IOrder[], limit = 5): ProductRank[] {
  const map = new Map<string, ProductRank>()

  for (const order of orders) {
    if (order.status === "cancelled") continue
    for (const item of order.items) {
      const id = String(item.id)
      const current = map.get(id) ?? {
        id,
        name: item.name,
        image: item.images?.[0],
        quantity: 0,
        revenue: 0,
      }
      current.quantity += item.quantity || 0
      current.revenue += item.price * (item.quantity || 0)
      if (!current.image && item.images?.[0]) current.image = item.images[0]
      map.set(id, current)
    }
  }

  return Array.from(map.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit)
}

export type CityRank = {
  city: string
  orders: number
  revenue: number
}

export function topCities(orders: IOrder[], limit = 5): CityRank[] {
  const map = new Map<string, CityRank>()

  for (const order of orders) {
    if (order.status === "cancelled") continue
    const city = order.address?.city?.trim() || "Unspecified"
    const current = map.get(city) ?? { city, orders: 0, revenue: 0 }
    current.orders += 1
    current.revenue += order.total
    map.set(city, current)
  }

  return Array.from(map.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit)
}

export function catalogGaps(products: IProduct[]) {
  return products.filter(
    (product) => !product.images?.length || !product.category_id
  ).length
}

export function newCustomersThisMonth(users: IUser[], now = new Date()) {
  return users.filter((user) => {
    if (user.role === "admin") return false
    const date = new Date(user.created_at)
    if (Number.isNaN(date.getTime())) return false
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth()
    )
  }).length
}

export function customerCount(users: IUser[]) {
  return users.filter((user) => user.role !== "admin").length
}
