"use client"

import { FormEvent, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js"
import { Loader2, ShoppingCart } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  hasStripePublishableKey,
  stripePromise,
} from "@/config/stripe-client-config"
import { IAddress } from "@/interfaces"
import { createOrder, PENDING_ORDER_KEY } from "@/services/orders"
import {
  buildExportDescription,
  getStripeClientSecret,
  toStripeShipping,
} from "@/services/payments"
import { useCartStore } from "@/store/cart-store"

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
})

type PaymentFormProps = {
  amount: number
  subtotal: number
  shippingFee: number
  shippingAddress: IAddress
}

function StripeCheckoutForm({
  amount,
  subtotal,
  shippingFee,
  shippingAddress,
}: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const cart = useCartStore((state) => state.cart)
  const clearCart = useCartStore((state) => state.clearCart)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!stripe || !elements) return

    setIsSubmitting(true)
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/user/cart?step=3`,
          shipping: toStripeShipping(shippingAddress),
          payment_method_data: {
            billing_details: {
              name: shippingAddress.name,
              phone: shippingAddress.phone,
              address: {
                line1: shippingAddress.address_line,
                city: shippingAddress.city,
                state: shippingAddress.state,
                postal_code: shippingAddress.postal_code,
                country: "IN",
              },
            },
          },
        },
        redirect: "if_required",
      })

      if (error) {
        toast.error(error.message ?? "Payment failed.")
        return
      }

      if (paymentIntent?.status === "succeeded") {
        await createOrder({
          subtotal,
          shipping_fee: shippingFee,
          total: amount,
          payment_id: paymentIntent.id,
          items: cart,
          address_id: shippingAddress.id,
          status: "paid",
        })
        sessionStorage.removeItem(PENDING_ORDER_KEY)
        clearCart()
        toast.success("Payment successful. Your order has been placed.")
        router.replace("/user/orders")
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Payment failed. Please try again."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      <PaymentElement
        options={{
          fields: {
            billingDetails: {
              name: "never",
              phone: "never",
              address: "never",
            },
          },
        }}
      />
      <Button
        type="submit"
        className="w-full"
        disabled={!stripe || !elements || isSubmitting}
      >
        {isSubmitting ? <Loader2 className="animate-spin" /> : <ShoppingCart />}
        Pay {currencyFormatter.format(amount)}
      </Button>
    </form>
  )
}

export function PaymentForm({
  amount,
  subtotal,
  shippingFee,
  shippingAddress,
}: PaymentFormProps) {
  const cart = useCartStore((state) => state.cart)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const description = buildExportDescription(cart)
  const shipping = toStripeShipping(shippingAddress)

  useEffect(() => {
    sessionStorage.setItem(
      PENDING_ORDER_KEY,
      JSON.stringify({
        subtotal,
        shipping_fee: shippingFee,
        total: amount,
        items: cart,
        address_id: shippingAddress.id,
      })
    )
  }, [amount, cart, shippingAddress.id, shippingFee, subtotal])

  useEffect(() => {
    let cancelled = false

    async function loadClientSecret() {
      if (!hasStripePublishableKey()) {
        setLoadError(
          "Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to your env file, then restart the app."
        )
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setLoadError(null)
      try {
        const secret = await getStripeClientSecret(amount, {
          description,
          shipping,
        })
        if (!cancelled) setClientSecret(secret)
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Could not start Stripe checkout."
          )
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadClientSecret()

    return () => {
      cancelled = true
    }
  }, [amount, description, shippingAddress.id])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="text-muted-foreground size-6 animate-spin" />
      </div>
    )
  }

  if (loadError || !clientSecret) {
    return (
      <p className="text-destructive text-sm">
        {loadError ?? "Could not start Stripe checkout."}
      </p>
    )
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: { theme: "stripe" },
      }}
    >
      <StripeCheckoutForm
        amount={amount}
        subtotal={subtotal}
        shippingFee={shippingFee}
        shippingAddress={shippingAddress}
      />
    </Elements>
  )
}
