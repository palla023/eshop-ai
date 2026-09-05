"use client"

import { CreditCard, MapPin, Package, Phone } from "lucide-react"

import { OrderStatusBadge } from "@/app/(private)/user/orders/_components/order-status-badge"
import {
  currencyFormatter,
  formatOrderDate,
  formatOrderNumber,
  orderItemCount,
  orderTax,
} from "@/app/(private)/user/orders/_components/order-utils"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { IOrder, OrderStatus } from "@/interfaces"

import { customerEmail, customerName } from "./admin-order-utils"
import { OrderStatusSelect } from "./order-status-select"

type OrderDetailSheetProps = {
  order: IOrder | null
  isUpdating: boolean
  onOpenChange: (open: boolean) => void
  onStatusChange: (status: OrderStatus) => void
}

export function OrderDetailSheet({
  order,
  isUpdating,
  onOpenChange,
  onStatusChange,
}: OrderDetailSheetProps) {
  const itemCount = order ? orderItemCount(order) : 0
  const tax = order ? orderTax(order) : 0

  return (
    <Sheet open={Boolean(order)} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-lg"
      >
        {order ? (
          <>
            <SheetHeader className="border-b">
              <SheetTitle className="flex flex-wrap items-center gap-2">
                Order {formatOrderNumber(order.id)}
                <OrderStatusBadge status={order.status} />
              </SheetTitle>
              <SheetDescription>
                Placed on {formatOrderDate(order.created_at)} · {itemCount}{" "}
                {itemCount === 1 ? "item" : "items"}
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-6 px-4 pb-6">
              <div className="flex flex-col gap-2">
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Fulfillment status
                </p>
                <OrderStatusSelect
                  value={order.status}
                  disabled={isUpdating}
                  onChange={onStatusChange}
                />
              </div>

              <div className="space-y-1">
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Customer
                </p>
                <p className="font-medium">{customerName(order)}</p>
                {customerEmail(order) ? (
                  <p className="text-muted-foreground text-sm">
                    {customerEmail(order)}
                  </p>
                ) : null}
              </div>

              <div className="space-y-3">
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Items
                </p>
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="bg-muted/40 size-14 shrink-0 overflow-hidden rounded-lg">
                      {item.images?.[0] ? (
                        <img
                          src={item.images[0]}
                          alt={item.name}
                          className="size-full object-contain p-1.5"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center">
                          <Package className="text-muted-foreground size-4" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{item.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {currencyFormatter.format(item.price)} × {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-semibold tabular-nums">
                      {currencyFormatter.format(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Shipping address
                </p>
                {order.address ? (
                  <>
                    <p className="font-medium">{order.address.name}</p>
                    <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
                      <Phone className="size-3.5" />
                      {order.address.phone}
                    </p>
                    <p className="text-sm leading-relaxed">
                      {order.address.address_line}
                    </p>
                    <p className="text-muted-foreground flex items-start gap-1.5 text-sm">
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
              </div>

              <div className="space-y-2">
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Payment
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="tabular-nums">
                    {currencyFormatter.format(order.subtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="tabular-nums">
                    {order.shipping_fee === 0
                      ? "Free"
                      : currencyFormatter.format(order.shipping_fee)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="tabular-nums">
                    {currencyFormatter.format(tax)}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="font-semibold tabular-nums">
                    {currencyFormatter.format(order.total)}
                  </span>
                </div>
                {order.payment_id ? (
                  <p className="text-muted-foreground flex items-start gap-1.5 text-xs">
                    <CreditCard className="mt-0.5 size-3.5 shrink-0" />
                    {order.payment_id}
                  </p>
                ) : null}
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
