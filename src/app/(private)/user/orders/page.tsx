"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  ChevronRight,
  Loader2,
  Package,
  ShoppingBag,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import PageTitle from "@/components/ui/page-title"
import { IOrder } from "@/interfaces"
import { getUserOrders } from "@/services/orders"

import { OrderStatusBadge } from "./_components/order-status-badge"
import {
  currencyFormatter,
  formatOrderDate,
  formatOrderNumber,
  orderItemCount,
} from "./_components/order-utils"

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<IOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadOrders() {
      setIsLoading(true)
      try {
        const data = await getUserOrders()
        if (!cancelled) setOrders(data)
      } catch (error) {
        if (!cancelled) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Failed to load orders. Please try again."
          )
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadOrders()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-1">
        <PageTitle title="My Orders" />
        <p className="text-muted-foreground text-sm">
          Track purchases, view details, and reorder from your history.
        </p>
      </div>

      {isLoading ? (
        <div className="flex min-h-80 w-full items-center justify-center">
          <Loader2 className="text-muted-foreground size-8 animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col gap-8 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between lg:gap-12 lg:p-10">
            <div className="flex min-w-0 items-start gap-4">
              <div className="bg-muted flex size-14 shrink-0 items-center justify-center rounded-full">
                <ShoppingBag className="text-muted-foreground size-7" />
              </div>
              <div className="flex min-w-0 flex-col items-start gap-4">
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold tracking-tight text-pretty">
                    No orders yet
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    When you complete checkout, your orders will appear here.
                  </p>
                </div>
                <Button asChild>
                  <Link href="/user/products">
                    Start shopping
                    <ArrowRight />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => {
            const itemCount = orderItemCount(order)
            const previewItems = order.items.slice(0, 4)
            const extraCount = Math.max(order.items.length - previewItems.length, 0)

            return (
              <Card key={order.id}>
                <CardHeader className="border-b">
                  <CardTitle className="flex flex-wrap items-center gap-2">
                    <Package className="text-muted-foreground size-4" />
                    Order {formatOrderNumber(order.id)}
                    <OrderStatusBadge status={order.status} />
                  </CardTitle>
                  <CardDescription>
                    Placed on {formatOrderDate(order.created_at)}
                    {order.address?.city ? ` · ${order.address.city}` : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    {previewItems.map((item) => (
                      <div
                        key={item.id}
                        className="bg-muted/40 size-16 overflow-hidden rounded-lg"
                      >
                        {item.images?.[0] ? (
                          <img
                            src={item.images[0]}
                            alt={item.name}
                            className="size-full object-contain p-1.5"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center">
                            <Package className="text-muted-foreground size-5" />
                          </div>
                        )}
                      </div>
                    ))}
                    {extraCount > 0 ? (
                      <div className="bg-muted text-muted-foreground flex size-16 items-center justify-center rounded-lg text-xs font-medium">
                        +{extraCount}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-1 sm:items-end">
                    <p className="text-muted-foreground text-sm">
                      {itemCount} {itemCount === 1 ? "item" : "items"}
                    </p>
                    <p className="text-lg font-semibold tabular-nums">
                      {currencyFormatter.format(order.total)}
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="justify-between">
                  <p className="text-muted-foreground line-clamp-1 text-sm">
                    {order.items.map((item) => item.name).join(", ")}
                  </p>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/user/orders/${order.id}`}>
                      View details
                      <ChevronRight />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
