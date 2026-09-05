"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import {
  ArrowRight,
  Clock3,
  CreditCard,
  LayoutDashboard,
  Loader2,
  MapPin,
  Package,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Truck,
  Wallet,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { IAddress, IOrder, OrderStatus } from "@/interfaces"
import { getUserAddresses } from "@/services/addresses"
import { getUserOrders } from "@/services/orders"
import { useCartStore } from "@/store/cart-store"
import { useUserStore } from "@/store/user-store"

import { OrderStatusBadge } from "../orders/_components/order-status-badge"
import {
  currencyFormatter,
  formatOrderDate,
  formatOrderNumber,
  orderItemCount,
  orderStatusStyles,
} from "../orders/_components/order-utils"
import {
  activeOrderCount,
  greetingForHour,
  lastPurchasedLabel,
  lifetimeSpend,
  monthlySpendSeries,
  statusCounts,
} from "./_components/dashboard-utils"

const STATUS_ORDER: OrderStatus[] = [
  "pending",
  "paid",
  "shipped",
  "delivered",
  "cancelled",
]

function getInitials(name?: string) {
  if (!name?.trim()) return "U"
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "U"
  )
}

function memberSince(value?: string) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  })
}

export default function UserDashboardPage() {
  const user = useUserStore((state) => state.user)
  const cart = useCartStore((state) => state.cart)
  const hasCartHydrated = useCartStore((state) => state.hasHydrated)

  const [orders, setOrders] = useState<IOrder[]>([])
  const [addresses, setAddresses] = useState<IAddress[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadDashboard() {
      setIsLoading(true)
      try {
        const [orderData, addressData] = await Promise.all([
          getUserOrders(),
          getUserAddresses(),
        ])
        if (!cancelled) {
          setOrders(orderData)
          setAddresses(addressData)
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Failed to load your dashboard."
          )
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadDashboard()

    return () => {
      cancelled = true
    }
  }, [])

  const firstName = user?.name?.trim().split(/\s+/)[0] || "there"
  const displayName = user?.name?.trim() || user?.email || "Account"
  const greeting = greetingForHour(new Date().getHours())
  const todayLabel = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })

  const spend = useMemo(() => lifetimeSpend(orders), [orders])
  const activeOrders = useMemo(() => activeOrderCount(orders), [orders])
  const counts = useMemo(() => statusCounts(orders), [orders])
  const spendSeries = useMemo(() => monthlySpendSeries(orders), [orders])
  const defaultAddress =
    addresses.find((address) => address.is_default) ?? addresses[0]
  const recentOrders = orders.slice(0, 5)
  const latestOrder = orders[0]
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const cartValue = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="bg-muted h-40 animate-pulse rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="bg-muted h-28 animate-pulse rounded-xl"
            />
          ))}
        </div>
        <div className="flex min-h-48 items-center justify-center">
          <Loader2 className="text-muted-foreground size-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="relative overflow-hidden rounded-2xl bg-zinc-950 px-5 py-6 text-white sm:px-8 sm:py-7">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.18),transparent_42%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="relative size-14 shrink-0 overflow-hidden rounded-full ring-2 ring-white/20">
              {user?.profile_pic?.trim() ? (
                <img
                  src={user.profile_pic}
                  alt={displayName}
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center bg-linear-to-br from-zinc-200 to-zinc-500 text-sm font-semibold text-black">
                  {getInitials(user?.name || user?.email)}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs tracking-wide text-white/55 uppercase">
                Account overview · {todayLabel}
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-pretty sm:text-3xl">
                {greeting}, {firstName}
              </h1>
              <p className="mt-1.5 max-w-xl text-sm text-white/70">
                Track orders, spend, and shipping from one place — the same
                workspace used to manage your storefront account.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              asChild
              className="bg-amber-400 text-black hover:bg-amber-300"
            >
              <Link href="/user/products">
                Continue shopping
                <ArrowRight />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="/user/orders">View orders</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Lifetime spend"
          value={currencyFormatter.format(spend)}
          hint={lastPurchasedLabel(orders)}
          icon={Wallet}
        />
        <KpiCard
          label="Total orders"
          value={String(orders.length)}
          hint={`${activeOrders} in progress`}
          icon={ShoppingBag}
        />
        <KpiCard
          label="Cart"
          value={hasCartHydrated ? String(cartCount) : "—"}
          hint={
            hasCartHydrated
              ? cartCount > 0
                ? currencyFormatter.format(cartValue)
                : "Ready when you are"
              : "Syncing cart"
          }
          icon={ShoppingCart}
        />
        <KpiCard
          label="Saved addresses"
          value={String(addresses.length)}
          hint={
            defaultAddress
              ? `Default: ${defaultAddress.city}`
              : "Add a shipping address"
          }
          icon={MapPin}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(20rem,1fr)]">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <LayoutDashboard className="text-muted-foreground size-4" />
                Order pipeline
              </CardTitle>
              <CardDescription>
                Live mix of your order statuses across the account.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 pt-4">
              {orders.length === 0 ? (
                <EmptyHint
                  icon={Package}
                  title="No order activity yet"
                  body="Completed checkouts will appear here as a status pipeline."
                />
              ) : (
                STATUS_ORDER.map((status) => {
                  const count = counts[status]
                  const pct =
                    orders.length === 0
                      ? 0
                      : Math.round((count / orders.length) * 100)
                  return (
                    <div key={status} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <OrderStatusBadge status={status} />
                          <span className="text-muted-foreground tabular-nums">
                            {count}
                          </span>
                        </span>
                        <span className="text-muted-foreground tabular-nums">
                          {pct}%
                        </span>
                      </div>
                      <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                        <div
                          className="h-full rounded-full bg-zinc-900"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle>Recent orders</CardTitle>
              <CardDescription>
                Latest five purchases, with totals and fulfillment status.
              </CardDescription>
              <CardAction>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/user/orders">
                    All orders
                    <ArrowRight />
                  </Link>
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="px-0 pt-0">
              {recentOrders.length === 0 ? (
                <div className="px-(--card-spacing) py-8">
                  <EmptyHint
                    icon={ShoppingBag}
                    title="No orders yet"
                    body="When you complete checkout, they will list here with tracking status."
                    action={
                      <Button asChild>
                        <Link href="/user/products">
                          Start shopping
                          <ArrowRight />
                        </Link>
                      </Button>
                    }
                  />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-4">Order</TableHead>
                      <TableHead>Placed</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="pr-4 text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="pl-4">
                          <Link
                            href={`/user/orders/${order.id}`}
                            className="font-medium hover:underline"
                          >
                            {formatOrderNumber(order.id)}
                          </Link>
                          <p className="text-muted-foreground mt-0.5 max-w-48 truncate text-xs">
                            {order.items.map((item) => item.name).join(", ")}
                          </p>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatOrderDate(order.created_at)}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {orderItemCount(order)}
                        </TableCell>
                        <TableCell>
                          <OrderStatusBadge status={order.status} />
                        </TableCell>
                        <TableCell className="pr-4 text-right font-medium tabular-nums">
                          {currencyFormatter.format(order.total)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="text-muted-foreground size-4" />
                Spend trend
              </CardTitle>
              <CardDescription>Last six months, excluding cancelled.</CardDescription>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="flex h-36 items-end gap-2">
                {spendSeries.buckets.map((bucket) => {
                  const height =
                    spendSeries.max === 0
                      ? 8
                      : Math.max(8, Math.round((bucket.total / spendSeries.max) * 100))
                  return (
                    <div
                      key={bucket.key}
                      className="flex min-w-0 flex-1 flex-col items-center gap-2"
                    >
                      <div className="flex h-28 w-full items-end">
                        <div
                          className="w-full rounded-md bg-zinc-900"
                          style={{ height: `${height}%` }}
                          title={currencyFormatter.format(bucket.total)}
                        />
                      </div>
                      <span className="text-muted-foreground text-[11px]">
                        {bucket.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle>Latest shipment</CardTitle>
              <CardDescription>
                Most recent order and where it stands.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {latestOrder ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">
                        Order {formatOrderNumber(latestOrder.id)}
                      </p>
                      <p className="text-muted-foreground mt-0.5 text-sm">
                        {formatOrderDate(latestOrder.created_at)}
                      </p>
                    </div>
                    <OrderStatusBadge status={latestOrder.status} />
                  </div>
                  <div className="flex items-center gap-2">
                    {latestOrder.items.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        className="bg-muted/40 size-12 overflow-hidden rounded-lg"
                      >
                        {item.images?.[0] ? (
                          <img
                            src={item.images[0]}
                            alt={item.name}
                            className="size-full object-contain p-1"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center">
                            <Package className="text-muted-foreground size-4" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {orderItemCount(latestOrder)}{" "}
                      {orderItemCount(latestOrder) === 1 ? "item" : "items"}
                    </span>
                    <span className="font-medium tabular-nums">
                      {currencyFormatter.format(latestOrder.total)}
                    </span>
                  </div>
                  <Button asChild variant="outline">
                    <Link href={`/user/orders/${latestOrder.id}`}>
                      Open order
                      <ArrowRight />
                    </Link>
                  </Button>
                </div>
              ) : (
                <EmptyHint
                  icon={Truck}
                  title="Nothing in transit"
                  body="Place an order to start tracking fulfillment here."
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle>Default address</CardTitle>
              <CardDescription>Used at checkout when available.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {defaultAddress ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <div className="bg-muted flex size-10 items-center justify-center rounded-full">
                      <MapPin className="text-muted-foreground size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium">{defaultAddress.name}</p>
                      <p className="text-muted-foreground mt-1 text-sm text-pretty">
                        {defaultAddress.address_line}
                        <br />
                        {defaultAddress.city}, {defaultAddress.state}{" "}
                        {defaultAddress.postal_code}
                      </p>
                    </div>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/user/address">Manage addresses</Link>
                  </Button>
                </div>
              ) : (
                <EmptyHint
                  icon={MapPin}
                  title="No address on file"
                  body="Add a shipping address before your next checkout."
                  action={
                    <Button asChild size="sm">
                      <Link href="/user/address">Add address</Link>
                    </Button>
                  }
                />
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Quick actions</CardTitle>
            <CardDescription>
              Jump into the workflows you use most.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 pt-4 sm:grid-cols-2">
            <QuickLink
              href="/user/products"
              icon={Package}
              title="Browse catalog"
              body="Find products and add them to cart."
            />
            <QuickLink
              href="/user/cart"
              icon={ShoppingCart}
              title="Checkout cart"
              body={
                hasCartHydrated && cartCount > 0
                  ? `${cartCount} ${cartCount === 1 ? "item" : "items"} waiting`
                  : "Review items and pay securely."
              }
            />
            <QuickLink
              href="/user/orders"
              icon={Clock3}
              title="Track orders"
              body="Status, invoices, and item history."
            />
            <QuickLink
              href="/user/address"
              icon={MapPin}
              title="Shipping book"
              body="Keep default and backup addresses current."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Account</CardTitle>
            <CardDescription>Signed-in profile for this session.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pt-4">
            <div className="flex items-center gap-3">
              <div className="bg-muted flex size-11 items-center justify-center rounded-full text-sm font-semibold">
                {getInitials(user?.name || user?.email)}
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium">{displayName}</p>
                <p className="text-muted-foreground truncate text-sm">
                  {user?.email}
                </p>
              </div>
            </div>
            <Separator />
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Role</dt>
                <dd className="mt-0.5 capitalize">{user?.role ?? "user"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Member since</dt>
                <dd className="mt-0.5">{memberSince(user?.created_at)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Payment</dt>
                <dd className="mt-0.5 flex items-center gap-1.5">
                  <CreditCard className="size-3.5" />
                  Stripe checkout
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Fulfillment</dt>
                <dd className="mt-0.5">
                  {orderStatusStyles.shipped.label} &amp;{" "}
                  {orderStatusStyles.delivered.label}
                </dd>
              </div>
            </dl>
          </CardContent>
          <CardFooter className="flex-col items-stretch gap-3">
            <Button asChild variant="outline">
              <Link href="/user/profile">Manage profile</Link>
            </Button>
            <p className="text-muted-foreground text-xs">
              Cart is stored on this device. Orders and addresses sync from your
              account.
            </p>
          </CardFooter>
        </Card>
      </section>
    </div>
  )
}

function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string
  value: string
  hint: string
  icon: typeof Wallet
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 pt-1">
        <div className="min-w-0">
          <p className="text-muted-foreground text-sm">{label}</p>
          <p className="mt-1 truncate text-2xl font-bold tracking-tight tabular-nums">
            {value}
          </p>
          <p className="text-muted-foreground mt-1 truncate text-xs">{hint}</p>
        </div>
        <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-full">
          <Icon className="text-muted-foreground size-4" />
        </div>
      </CardContent>
    </Card>
  )
}

function QuickLink({
  href,
  icon: Icon,
  title,
  body,
}: {
  href: string
  icon: typeof Package
  title: string
  body: string
}) {
  return (
    <Link
      href={href}
      className="hover:bg-muted/60 flex items-start gap-3 rounded-xl border p-3 transition-colors"
    >
      <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="font-medium">{title}</p>
        <p className="text-muted-foreground mt-0.5 text-xs text-pretty">{body}</p>
      </div>
    </Link>
  )
}

function EmptyHint({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: typeof Package
  title: string
  body: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-start gap-3">
      <div className="bg-muted flex size-10 items-center justify-center rounded-full">
        <Icon className="text-muted-foreground size-4" />
      </div>
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-muted-foreground mt-1 text-sm text-pretty">{body}</p>
      </div>
      {action}
    </div>
  )
}
