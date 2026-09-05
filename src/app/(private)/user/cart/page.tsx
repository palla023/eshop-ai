"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowRight,
  Loader2,
  Minus,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
} from "lucide-react"
import { toast } from "sonner"

import PageTitle from "@/components/ui/page-title"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { IAddress, IOrderItem } from "@/interfaces"
import { createOrder, getOrderByPaymentId, PENDING_ORDER_KEY } from "@/services/orders"
import { useCartStore } from "@/store/cart-store"

import { PaymentForm } from "./_components/payment-form"
import { ShippingForm } from "./_components/shipping-form"

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
})

const TAX_RATE = 0.18
const SHIPPING_FEE = 99
const FREE_SHIPPING_THRESHOLD = 999

const steps = [
  { id: 1, title: "Shopping Cart" },
  { id: 2, title: "Shipping Address" },
  { id: 3, title: "Payment Method" },
]

export default function CartPage() {
  return (
    <Suspense fallback={null}>
      <CartPageContent />
    </Suspense>
  )
}

function CartPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [shippingAddress, setShippingAddress] = useState<IAddress>()
  const [orderPersistError, setOrderPersistError] = useState<string | null>(null)
  const cart = useCartStore((state) => state.cart)
  const hasHydrated = useCartStore((state) => state.hasHydrated)
  const deleteCartItem = useCartStore((state) => state.deleteCartItem)
  const editCartItem = useCartStore((state) => state.editCartItem)
  const clearCart = useCartStore((state) => state.clearCart)

  const activeStep = Number.parseInt(searchParams.get("step") || "1", 10)
  const paymentRedirectStatus = searchParams.get("redirect_status")
  const paymentIntentId = searchParams.get("payment_intent")
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )
  const shipping =
    cart.length === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE
  const estimatedTax = subtotal * TAX_RATE
  const total = subtotal + shipping + estimatedTax

  function goToStep(step: number) {
    router.push(`/user/cart?step=${step}`, { scroll: false })
  }

  useEffect(() => {
    if (paymentRedirectStatus !== "succeeded") return

    let cancelled = false

    async function persistRedirectedOrder() {
      try {
        const raw = sessionStorage.getItem(PENDING_ORDER_KEY)
        if (paymentIntentId) {
          if (raw) {
            const pending = JSON.parse(raw) as {
              subtotal: number
              shipping_fee: number
              total: number
              items: IOrderItem[]
              address_id: string
            }
            await createOrder({
              ...pending,
              payment_id: paymentIntentId,
              status: "paid",
            })
            sessionStorage.removeItem(PENDING_ORDER_KEY)
          } else {
            const existing = await getOrderByPaymentId(paymentIntentId)
            if (!existing) {
              throw new Error(
                "Payment succeeded, but the order could not be saved."
              )
            }
          }
        }
        if (cancelled) return
        clearCart()
        toast.success("Payment successful. Your order has been placed.")
        router.replace("/user/orders")
      } catch (error) {
        if (cancelled) return
        const message =
          error instanceof Error
            ? error.message
            : "Payment succeeded, but the order could not be saved."
        setOrderPersistError(message)
        toast.error(message)
      }
    }

    persistRedirectedOrder()

    return () => {
      cancelled = true
    }
  }, [clearCart, paymentIntentId, paymentRedirectStatus, router])

  if (!hasHydrated) {
    return null
  }

  if (paymentRedirectStatus === "succeeded" && !orderPersistError) {
    return (
      <div className="flex min-h-80 w-full flex-col items-center justify-center gap-3">
        <Loader2 className="text-muted-foreground size-8 animate-spin" />
        <p className="font-medium">Finalizing your order</p>
        <p className="text-muted-foreground text-sm">
          Payment received. Saving your order and taking you to My Orders.
        </p>
      </div>
    )
  }

  if (orderPersistError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-start gap-4 p-6 sm:p-8">
          <h2 className="text-xl font-semibold">Payment received</h2>
          <p className="text-muted-foreground text-sm">{orderPersistError}</p>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/user/orders">Go to My Orders</Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOrderPersistError(null)
                router.replace("/user/cart?step=3")
              }}
            >
              Back to checkout
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-4">
          <PageTitle title="Shopping Cart" />
          {cart.length > 0 && activeStep === 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                clearCart()
                toast.success("Cart cleared")
              }}
            >
              <Trash2 />
              Clear cart
            </Button>
          ) : null}
        </div>
        <p className="text-muted-foreground text-sm">
          {itemCount} {itemCount === 1 ? "item" : "items"} in your cart
        </p>
      </div>

      {cart.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col gap-8 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between lg:gap-12 lg:p-10">
            <div className="flex min-w-0 items-start gap-4">
              <div className="bg-muted flex size-14 shrink-0 items-center justify-center rounded-full">
                <ShoppingBag className="text-muted-foreground size-7" />
              </div>
              <div className="flex min-w-0 flex-col items-start gap-4">
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold tracking-tight text-pretty">
                    Your cart is empty
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    Browse products and add items to get started.
                  </p>
                </div>
                <Button asChild>
                  <Link href="/user/products">
                    Continue shopping
                    <ArrowRight />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-3 lg:max-w-sm lg:grid-cols-1">
              <div className="bg-muted/40 flex items-start gap-3 rounded-lg p-3">
                <Truck className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                <div>
                  <p className="font-medium">Free shipping</p>
                  <p className="text-muted-foreground text-xs">
                    On orders of {currencyFormatter.format(FREE_SHIPPING_THRESHOLD)}{" "}
                    or more
                  </p>
                </div>
              </div>
              <div className="bg-muted/40 flex items-start gap-3 rounded-lg p-3">
                <ShieldCheck className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                <div>
                  <p className="font-medium">Secure checkout</p>
                  <p className="text-muted-foreground text-xs">
                    Pay safely with Stripe
                  </p>
                </div>
              </div>
              <div className="bg-muted/40 flex items-start gap-3 rounded-lg p-3">
                <RotateCcw className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                <div>
                  <p className="font-medium">Easy returns</p>
                  <p className="text-muted-foreground text-xs">
                    Hassle-free returns on eligible items
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-col items-start gap-4 lg:flex-row lg:items-center lg:gap-10">
            {steps.map((step) => {
              const isActive = step.id === activeStep
              const canGoToStep =
                step.id === 1 ||
                step.id === 2 ||
                (step.id === 3 && Boolean(shippingAddress))

              return (
                <button
                  key={step.id}
                  type="button"
                  aria-current={isActive ? "step" : undefined}
                  disabled={!canGoToStep}
                  onClick={() => goToStep(step.id)}
                  className={`flex items-center gap-2 border-b-2 pb-3 text-left ${
                    isActive ? "border-foreground" : "border-border"
                  } ${
                    canGoToStep && !isActive
                      ? "cursor-pointer hover:opacity-80"
                      : "cursor-default"
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  <span
                    className={`flex size-8 items-center justify-center rounded-full text-sm font-medium ${
                      isActive
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step.id}
                  </span>
                  <p
                    className={`text-sm font-medium ${
                      isActive
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {step.title}
                  </p>
                </button>
              )
            })}
          </div>

          <div className="grid w-full grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <Card>
              <CardHeader className="border-b">
                <CardTitle>
                  {activeStep === 1
                    ? "Cart items"
                    : activeStep === 2
                      ? "Shipping address"
                      : "Payment method"}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col p-0">
                {activeStep === 1 ? (
                  <div className="flex flex-col divide-y">
                    {cart.map((item) => {
                      const lineTotal = item.price * item.quantity

                      return (
                        <div
                          key={item.id}
                          className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center"
                        >
                          <Link
                            href={`/user/products/${item.id}`}
                            className="bg-muted/40 size-24 shrink-0 overflow-hidden rounded-lg sm:size-28"
                          >
                            {item.images?.[0] ? (
                              <img
                                src={item.images[0]}
                                alt={item.name}
                                className="size-full object-contain p-2"
                              />
                            ) : null}
                          </Link>

                          <div className="min-w-0 flex-1 space-y-1">
                            <Link
                              href={`/user/products/${item.id}`}
                              className="font-medium hover:underline"
                            >
                              {item.name}
                            </Link>
                            {item.description ? (
                              <p className="text-muted-foreground line-clamp-2 text-sm">
                                {item.description}
                              </p>
                            ) : null}
                            <p className="text-muted-foreground text-sm">
                              {currencyFormatter.format(item.price)} each
                            </p>
                          </div>

                          <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="icon-sm"
                                aria-label={`Decrease quantity of ${item.name}`}
                                onClick={() =>
                                  editCartItem(item.id, item.quantity - 1)
                                }
                              >
                                <Minus />
                              </Button>
                              <span className="min-w-8 text-center text-sm font-medium tabular-nums">
                                {item.quantity}
                              </span>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon-sm"
                                aria-label={`Increase quantity of ${item.name}`}
                                onClick={() =>
                                  editCartItem(item.id, item.quantity + 1)
                                }
                              >
                                <Plus />
                              </Button>
                            </div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold tabular-nums">
                                {currencyFormatter.format(lineTotal)}
                              </p>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Remove ${item.name}`}
                                onClick={() => deleteCartItem(item.id)}
                              >
                                <Trash2 className="text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="p-4">
                    {activeStep === 2 ? (
                      <ShippingForm
                        selectedAddress={shippingAddress}
                        onSelectAddress={setShippingAddress}
                        onContinue={() => goToStep(3)}
                      />
                    ) : activeStep === 3 && shippingAddress ? (
                      <PaymentForm
                        amount={total}
                        subtotal={subtotal}
                        shippingFee={shipping}
                        shippingAddress={shippingAddress}
                      />
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        Please choose a shipping address to continue.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="lg:sticky lg:top-24">
              <CardHeader className="border-b">
                <CardTitle>Order summary</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium tabular-nums">
                    {currencyFormatter.format(subtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium tabular-nums">
                    {shipping === 0
                      ? "Free"
                      : currencyFormatter.format(shipping)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Estimated tax</span>
                  <span className="font-medium tabular-nums">
                    {currencyFormatter.format(estimatedTax)}
                  </span>
                </div>
                {shippingAddress && activeStep > 1 ? (
                  <p className="text-muted-foreground text-xs">
                    Ship to {shippingAddress.name}, {shippingAddress.city}
                  </p>
                ) : shipping === 0 ? (
                  <p className="text-muted-foreground text-xs">
                    Free shipping on orders of{" "}
                    {currencyFormatter.format(FREE_SHIPPING_THRESHOLD)} or more.
                  </p>
                ) : (
                  <p className="text-muted-foreground text-xs">
                    Add{" "}
                    {currencyFormatter.format(FREE_SHIPPING_THRESHOLD - subtotal)}{" "}
                    more for free shipping.
                  </p>
                )}
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="text-lg font-semibold tabular-nums">
                    {currencyFormatter.format(total)}
                  </span>
                </div>
              </CardContent>
              {activeStep === 1 ? (
                <CardFooter className="flex-col gap-3 border-0 bg-transparent">
                  <Button
                    type="button"
                    className="w-full"
                    onClick={() => goToStep(2)}
                  >
                    Continue
                    <ArrowRight />
                  </Button>
                  <Link
                    href="/user/products"
                    className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
                  >
                    Continue shopping
                  </Link>
                </CardFooter>
              ) : null}
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
