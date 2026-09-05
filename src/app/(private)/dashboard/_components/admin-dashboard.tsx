"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowRight,
  LayoutDashboard,
  Loader2,
  MapPin,
  Package,
  ShoppingBag,
  Tags,
  Truck,
  Users,
  Wallet,
} from "lucide-react"
import { toast } from "sonner"

import { OrderStatusBadge } from "@/app/(private)/user/orders/_components/order-status-badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
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
import { ICategory, IOrder, IProduct, IUser } from "@/interfaces"
import { getAllCategories } from "@/services/categories"
import { getAllOrders } from "@/services/orders"
import { getAllProducts } from "@/services/products"
import { getAllUserProfiles } from "@/services/users"
import { useUserStore } from "@/store/user-store"

import {
  currencyFormatter,
  customerName,
  formatOrderNumber,
  isSlaRisk,
  orderItemCount,
} from "../../orders/_components/admin-order-utils"
import { formatOrderDate } from "../../user/orders/_components/order-utils"
import {
  attentionOrders,
  averageOrderValue,
  cancellationRate,
  catalogGaps,
  customerCount,
  fulfilmentRate,
  greetingForHour,
  lifetimeSpend,
  monthlySpendSeries,
  newCustomersThisMonth,
  openFulfillmentCount,
  ordersToday,
  PIPELINE_BAR,
  PIPELINE_STATUSES,
  slaRiskCount,
  statusCounts,
  topCities,
  topProducts,
} from "./dashboard-utils"

export function AdminDashboard() {
  const user = useUserStore((state) => state.user)

  const [orders, setOrders] = useState<IOrder[]>([])
  const [products, setProducts] = useState<IProduct[]>([])
  const [categories, setCategories] = useState<ICategory[]>([])
  const [users, setUsers] = useState<IUser[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadDashboard() {
      setIsLoading(true)
      try {
        const [orderData, productData, categoryData, userData] =
          await Promise.all([
            getAllOrders(),
            getAllProducts(),
            getAllCategories(),
            getAllUserProfiles().catch(() => [] as IUser[]),
          ])
        if (!cancelled) {
          setOrders(orderData)
          setProducts(productData)
          setCategories(categoryData)
          setUsers(userData)
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Failed to load the operations dashboard."
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

  const firstName = user?.name?.trim().split(/\s+/)[0] || "Admin"
  const greeting = greetingForHour(new Date().getHours())
  const todayLabel = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })

  const gmv = useMemo(() => lifetimeSpend(orders), [orders])
  const aov = useMemo(() => averageOrderValue(orders), [orders])
  const openCount = useMemo(() => openFulfillmentCount(orders), [orders])
  const riskCount = useMemo(() => slaRiskCount(orders), [orders])
  const counts = useMemo(() => statusCounts(orders), [orders])
  const spendSeries = useMemo(() => monthlySpendSeries(orders), [orders])
  const recentOrders = orders.slice(0, 6)
  const queue = useMemo(() => attentionOrders(orders), [orders])
  const skuLeaders = useMemo(() => topProducts(orders), [orders])
  const cityLeaders = useMemo(() => topCities(orders), [orders])
  const customers = useMemo(() => customerCount(users), [users])
  const newThisMonth = useMemo(() => newCustomersThisMonth(users), [users])
  const missingMedia = useMemo(() => catalogGaps(products), [products])
  const deliveredPct = fulfilmentRate(orders)
  const cancelledPct = cancellationRate(orders)
  const todayOrders = ordersToday(orders)

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="bg-muted h-44 animate-pulse rounded-2xl" />
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
      <section className="relative overflow-hidden rounded-2xl bg-zinc-950 px-5 py-6 text-white sm:px-8 sm:py-8">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-size-[28px_28px]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.16),transparent_38%)]" />
        <div className="relative flex flex-col gap-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs tracking-wide text-white/55 uppercase">
                Operations console · {todayLabel}
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-pretty sm:text-3xl">
                {greeting}, {firstName}
              </h1>
              <p className="mt-1.5 max-w-xl text-sm text-white/70">
                Monitor revenue, fulfillment SLAs, catalog health, and customer
                demand from a single admin workspace.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                asChild
                className="bg-amber-400 text-black hover:bg-amber-300"
              >
                <Link href="/orders">
                  Review orders
                  <ArrowRight />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/products">Manage catalog</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <HeroStat label="Gross merchandise" value={currencyFormatter.format(gmv)} />
            <HeroStat
              label="Orders today"
              value={String(todayOrders)}
              hint={`${orders.length} lifetime`}
            />
            <HeroStat
              label="Open fulfillment"
              value={String(openCount)}
              hint={riskCount > 0 ? `${riskCount} past SLA` : "Within SLA"}
            />
            <HeroStat
              label="Delivered rate"
              value={`${deliveredPct}%`}
              hint={`${cancelledPct}% cancelled`}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Average order value"
          value={currencyFormatter.format(aov)}
          hint="Excludes cancelled orders"
          icon={Wallet}
        />
        <KpiCard
          label="Customers"
          value={String(customers)}
          hint={`${newThisMonth} joined this month`}
          icon={Users}
        />
        <KpiCard
          label="Catalog SKUs"
          value={String(products.length)}
          hint={
            missingMedia > 0
              ? `${missingMedia} need images or category`
              : `${categories.length} categories`
          }
          icon={Package}
        />
        <KpiCard
          label="SLA exceptions"
          value={String(riskCount)}
          hint="Paid orders older than 48 hours"
          icon={AlertTriangle}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(20rem,1fr)]">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <LayoutDashboard className="text-muted-foreground size-4" />
                Fulfillment pipeline
              </CardTitle>
              <CardDescription>
                Live mix of every order currently in the store.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 pt-4">
              {orders.length === 0 ? (
                <EmptyHint
                  icon={ShoppingBag}
                  title="No orders yet"
                  body="Checkout activity will populate this pipeline automatically."
                />
              ) : (
                PIPELINE_STATUSES.map((status) => {
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
                          className={`h-full rounded-full ${PIPELINE_BAR[status]}`}
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
                Latest six checkouts across all customers.
              </CardDescription>
              <CardAction>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/orders">
                    Order desk
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
                    title="Waiting for the first sale"
                    body="New paid orders will list here with customer and status."
                  />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-4">Order</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Placed</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="pr-4 text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="pl-4">
                          <p className="font-medium">
                            {formatOrderNumber(order.id)}
                          </p>
                          <p className="text-muted-foreground mt-0.5 text-xs tabular-nums">
                            {orderItemCount(order)}{" "}
                            {orderItemCount(order) === 1 ? "item" : "items"}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p className="max-w-40 truncate font-medium">
                            {customerName(order)}
                          </p>
                          <p className="text-muted-foreground mt-0.5 max-w-40 truncate text-xs">
                            {order.address?.city || "—"}
                          </p>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatOrderDate(order.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col items-start gap-1">
                            <OrderStatusBadge status={order.status} />
                            {isSlaRisk(order) ? (
                              <span className="text-xs font-medium text-amber-700">
                                SLA risk
                              </span>
                            ) : null}
                          </div>
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
              <CardTitle>Revenue trend</CardTitle>
              <CardDescription>Last six months, excluding cancelled.</CardDescription>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="flex h-36 items-end gap-2">
                {spendSeries.buckets.map((bucket) => {
                  const height =
                    spendSeries.max === 0
                      ? 8
                      : Math.max(
                          8,
                          Math.round((bucket.total / spendSeries.max) * 100)
                        )
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
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="text-muted-foreground size-4" />
                Attention queue
              </CardTitle>
              <CardDescription>
                Pending payments and paid orders past the 48-hour SLA.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 pt-4">
              {queue.length === 0 ? (
                <EmptyHint
                  icon={Truck}
                  title="Queue is clear"
                  body="No pending or at-risk orders need action right now."
                />
              ) : (
                queue.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-start justify-between gap-3 rounded-xl border p-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">
                        {formatOrderNumber(order.id)}
                      </p>
                      <p className="text-muted-foreground mt-0.5 truncate text-xs">
                        {customerName(order)} · {formatOrderDate(order.created_at)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <OrderStatusBadge status={order.status} />
                      <span className="font-medium tabular-nums">
                        {currencyFormatter.format(order.total)}
                      </span>
                    </div>
                  </div>
                ))
              )}
              <Button asChild variant="outline" size="sm">
                <Link href="/orders">Open order desk</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Top SKUs</CardTitle>
            <CardDescription>
              Highest revenue from non-cancelled orders.
            </CardDescription>
            <CardAction>
              <Button asChild variant="ghost" size="sm">
                <Link href="/products">
                  Catalog
                  <ArrowRight />
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="pt-4">
            {skuLeaders.length === 0 ? (
              <EmptyHint
                icon={Package}
                title="No product sales yet"
                body="Bestsellers will rank here after the first paid order."
              />
            ) : (
              <div className="flex flex-col gap-3">
                {skuLeaders.map((sku, index) => (
                  <div key={sku.id} className="flex items-center gap-3">
                    <span className="text-muted-foreground w-5 text-sm tabular-nums">
                      {index + 1}
                    </span>
                    <div className="bg-muted size-11 overflow-hidden rounded-lg">
                      {sku.image ? (
                        <img
                          src={sku.image}
                          alt={sku.name}
                          className="size-full object-contain p-1"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center">
                          <Package className="text-muted-foreground size-4" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{sku.name}</p>
                      <p className="text-muted-foreground text-xs tabular-nums">
                        {sku.quantity} sold
                      </p>
                    </div>
                    <p className="font-medium tabular-nums">
                      {currencyFormatter.format(sku.revenue)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Shipping destinations</CardTitle>
            <CardDescription>
              Cities generating the most paid volume.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {cityLeaders.length === 0 ? (
              <EmptyHint
                icon={MapPin}
                title="No destination data"
                body="Shipping cities will appear after orders include addresses."
              />
            ) : (
              <div className="flex flex-col gap-4">
                {cityLeaders.map((city) => {
                  const max = cityLeaders[0]?.revenue || 1
                  const pct = Math.round((city.revenue / max) * 100)
                  return (
                    <div key={city.city} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{city.city}</span>
                        <span className="text-muted-foreground tabular-nums">
                          {city.orders} · {currencyFormatter.format(city.revenue)}
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
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Quick actions</CardTitle>
            <CardDescription>
              Jump into the workflows operations uses most.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 pt-4 sm:grid-cols-2">
            <QuickLink
              href="/orders"
              icon={ShoppingBag}
              title="Order desk"
              body="Update fulfillment, export CSVs, and clear SLA risk."
            />
            <QuickLink
              href="/products"
              icon={Package}
              title="Product catalog"
              body={`${products.length} SKUs in inventory.`}
            />
            <QuickLink
              href="/categories"
              icon={Tags}
              title="Categories"
              body={`${categories.length} merchandising groups.`}
            />
            <QuickLink
              href="/users"
              icon={Users}
              title="Customers"
              body={`${customers} shopper accounts on file.`}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Store health</CardTitle>
            <CardDescription>Snapshot of catalog and accounts.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pt-4">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Categories</dt>
                <dd className="mt-0.5 tabular-nums">{categories.length}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Incomplete SKUs</dt>
                <dd className="mt-0.5 tabular-nums">{missingMedia}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Admin seats</dt>
                <dd className="mt-0.5 tabular-nums">
                  {users.filter((row) => row.role === "admin").length || 1}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Active shoppers</dt>
                <dd className="mt-0.5 tabular-nums">
                  {users.filter(
                    (row) => row.role !== "admin" && row.is_active !== false
                  ).length || customers}
                </dd>
              </div>
            </dl>
            <Separator />
            <p className="text-muted-foreground text-xs text-pretty">
              Revenue excludes cancelled orders. SLA risk flags paid orders
              older than 48 hours that have not shipped.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function HeroStat({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
      <p className="text-xs tracking-wide text-white/55 uppercase">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-xs text-white/50">{hint}</p> : null}
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
