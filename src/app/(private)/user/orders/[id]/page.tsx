"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ArrowLeft,
  CreditCard,
  Loader2,
  MapPin,
  Package,
  Phone,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import PageTitle from "@/components/ui/page-title"
import { Separator } from "@/components/ui/separator"
import { IOrder } from "@/interfaces"
import { getOrderById } from "@/services/orders"

import { OrderStatusBadge } from "../_components/order-status-badge"
import {
  currencyFormatter,
  formatOrderDate,
  formatOrderNumber,
  orderItemCount,
  orderTax,
} from "../_components/order-utils"

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>()
  const orderId = params.id
  const [order, setOrder] = useState<IOrder | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadOrder() {
      setIsLoading(true)
      try {
        const data = await getOrderById(orderId)
        if (!cancelled) setOrder(data)
      } catch (error) {
        if (!cancelled) {
          setOrder(null)
          toast.error(
            error instanceof Error
              ? error.message
              : "Failed to load this order."
          )
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    if (orderId) {
      loadOrder()
    }

    return () => {
      cancelled = true
    }
  }, [orderId])

  if (isLoading) {
    return (
      <div className="flex min-h-80 w-full items-center justify-center">
        <Loader2 className="text-muted-foreground size-8 animate-spin" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex w-full flex-col items-start gap-4">
        <PageTitle title="Order not found" />
        <p className="text-muted-foreground text-sm">
          This order does not exist or you do not have access to it.
        </p>
        <Button asChild variant="outline">
          <Link href="/user/orders">
            <ArrowLeft />
            Back to orders
          </Link>
        </Button>
      </div>
    )
  }

  const itemCount = orderItemCount(order)
  const tax = orderTax(order)

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Button asChild variant="ghost" size="sm" className="w-fit px-0">
          <Link href="/user/orders">
            <ArrowLeft />
            Back to orders
          </Link>
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <PageTitle title={`Order ${formatOrderNumber(order.id)}`} />
            <p className="text-muted-foreground text-sm">
              Placed on {formatOrderDate(order.created_at)} · {itemCount}{" "}
              {itemCount === 1 ? "item" : "items"}
            </p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>
      </div>

      <div className="grid w-full grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Items</CardTitle>
              <CardDescription>
                Products included in this order
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col divide-y p-0">
              {order.items.map((item) => {
                const lineTotal = item.price * item.quantity

                return (
                  <div
                    key={item.id}
                    className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center"
                  >
                    <Link
                      href={`/user/products/${item.id}`}
                      className="bg-muted/40 size-20 shrink-0 overflow-hidden rounded-lg"
                    >
                      {item.images?.[0] ? (
                        <img
                          src={item.images[0]}
                          alt={item.name}
                          className="size-full object-contain p-2"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center">
                          <Package className="text-muted-foreground size-5" />
                        </div>
                      )}
                    </Link>
                    <div className="min-w-0 flex-1 space-y-1">
                      <Link
                        href={`/user/products/${item.id}`}
                        className="font-medium hover:underline"
                      >
                        {item.name}
                      </Link>
                      <p className="text-muted-foreground text-sm">
                        {currencyFormatter.format(item.price)} × {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold tabular-nums">
                      {currencyFormatter.format(lineTotal)}
                    </p>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle>Shipping address</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {order.address ? (
                <>
                  <p className="font-medium">{order.address.name}</p>
                  <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
                    <Phone className="size-3.5" />
                    {order.address.phone}
                  </p>
                  <p className="leading-relaxed">{order.address.address_line}</p>
                  <p className="text-muted-foreground flex items-start gap-1.5">
                    <MapPin className="mt-0.5 size-3.5 shrink-0" />
                    {order.address.city}, {order.address.state}{" "}
                    {order.address.postal_code}
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Shipping address is no longer available.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="lg:sticky lg:top-24">
          <CardHeader className="border-b">
            <CardTitle>Order summary</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium tabular-nums">
                {currencyFormatter.format(order.subtotal)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Shipping</span>
              <span className="font-medium tabular-nums">
                {order.shipping_fee === 0
                  ? "Free"
                  : currencyFormatter.format(order.shipping_fee)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tax</span>
              <span className="font-medium tabular-nums">
                {currencyFormatter.format(tax)}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="font-semibold">Total</span>
              <span className="text-lg font-semibold tabular-nums">
                {currencyFormatter.format(order.total)}
              </span>
            </div>
            {order.payment_id ? (
              <p className="text-muted-foreground flex items-start gap-1.5 text-xs">
                <CreditCard className="mt-0.5 size-3.5 shrink-0" />
                Payment {order.payment_id}
              </p>
            ) : null}
            <Button asChild className="mt-2 w-full">
              <Link href="/user/products">Continue shopping</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
