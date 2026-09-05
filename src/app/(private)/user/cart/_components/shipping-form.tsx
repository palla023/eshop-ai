"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { IAddress } from "@/interfaces"
import { getUserAddresses } from "@/services/addresses"

type ShippingFormProps = {
  selectedAddress?: IAddress
  onSelectAddress: (address: IAddress) => void
  onContinue: () => void
}

export function ShippingForm({
  selectedAddress,
  onSelectAddress,
  onContinue,
}: ShippingFormProps) {
  const [addresses, setAddresses] = useState<IAddress[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadAddresses() {
      setIsLoading(true)
      try {
        const data = await getUserAddresses()
        if (cancelled) return
        setAddresses(data)
        if (!selectedAddress && data.length > 0) {
          const defaultAddress =
            data.find((address) => address.is_default) ?? data[0]
          onSelectAddress(defaultAddress)
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Failed to load addresses. Please try again."
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadAddresses()

    return () => {
      cancelled = true
    }
    // Only load addresses on mount; parent keeps the selected address.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (addresses.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-muted-foreground text-sm">
          Add a shipping address before continuing to payment.
        </p>
        <Button asChild>
          <Link href="/user/address">Add address</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        {addresses.map((address) => {
          const isSelected = selectedAddress?.id === address.id

          return (
            <button
              key={address.id}
              type="button"
              onClick={() => onSelectAddress(address)}
              className={`rounded-lg border p-4 text-left transition-colors ${
                isSelected
                  ? "border-foreground bg-muted/40"
                  : "border-border hover:bg-muted/30"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{address.name}</p>
                {address.is_default ? (
                  <span className="text-muted-foreground text-xs">Default</span>
                ) : null}
              </div>
              <p className="text-muted-foreground mt-1 text-sm">
                {address.address_line}, {address.city}, {address.state}{" "}
                {address.postal_code}
              </p>
              <p className="text-muted-foreground text-sm">{address.phone}</p>
            </button>
          )
        })}
      </div>
      <Button
        type="button"
        className="w-full"
        disabled={!selectedAddress}
        onClick={onContinue}
      >
        Continue
        <ArrowRight />
      </Button>
    </div>
  )
}
