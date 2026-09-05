"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2, MapPin, Pencil, Phone, Star, Trash2 } from "lucide-react"
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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { IAddress } from "@/interfaces"
import {
  deleteAddress,
  getUserAddresses,
  setDefaultAddress,
} from "@/services/addresses"

import { AddressForm } from "./address-form"

type AddressesTableProps = {
  refreshKey?: number
}

export function AddressesTable({ refreshKey = 0 }: AddressesTableProps) {
  const [addresses, setAddresses] = useState<IAddress[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingAddress, setEditingAddress] = useState<IAddress | null>(null)
  const [deletingAddress, setDeletingAddress] = useState<IAddress | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [defaultingId, setDefaultingId] = useState<string | null>(null)

  const loadAddresses = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setIsLoading(true)
    }
    try {
      const data = await getUserAddresses()
      setAddresses(data)
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load addresses. Please try again."
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAddresses({ silent: refreshKey > 0 })
  }, [loadAddresses, refreshKey])

  async function handleDelete() {
    if (!deletingAddress) return

    setIsDeleting(true)
    try {
      await deleteAddress(deletingAddress.id)
      toast.success("Address deleted successfully.")
      setDeletingAddress(null)
      await loadAddresses({ silent: true })
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete address. Please try again."
      )
    } finally {
      setIsDeleting(false)
    }
  }

  async function handleSetDefault(address: IAddress) {
    setDefaultingId(address.id)
    try {
      await setDefaultAddress(address.id)
      toast.success("Default address updated.")
      await loadAddresses({ silent: true })
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to set default address. Please try again."
      )
    } finally {
      setDefaultingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-40 w-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (addresses.length === 0) {
    return (
      <div className="flex min-h-40 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-center">
        <MapPin className="size-8 text-muted-foreground" />
        <p className="text-muted-foreground">No addresses found.</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {addresses.map((address) => (
          <Card key={address.id} className="h-full">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                {address.name}
                {address.is_default ? (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    Default
                  </span>
                ) : null}
              </CardTitle>
              <CardDescription className="flex items-center gap-1.5">
                <Phone className="size-3.5" />
                {address.phone}
              </CardDescription>
              <CardAction>
                <div className="flex items-center gap-1">
                  {!address.is_default ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Set ${address.name} as default`}
                      disabled={defaultingId === address.id}
                      onClick={() => handleSetDefault(address)}
                    >
                      {defaultingId === address.id ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <Star />
                      )}
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Edit ${address.name}`}
                    onClick={() => setEditingAddress(address)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Delete ${address.name}`}
                    onClick={() => setDeletingAddress(address)}
                  >
                    <Trash2 className="text-destructive" />
                  </Button>
                </div>
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-1">
              <p className="leading-relaxed">{address.address_line}</p>
              <p className="text-muted-foreground">
                {address.city}, {address.state} {address.postal_code}
              </p>
            </CardContent>
            <CardFooter className="justify-between text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <MapPin className="size-3.5" />
                {address.city}
              </span>
              <span>PIN {address.postal_code}</span>
            </CardFooter>
          </Card>
        ))}
      </div>

      <AddressForm
        address={editingAddress ?? undefined}
        open={Boolean(editingAddress)}
        showTrigger={false}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setEditingAddress(null)
        }}
        onSuccess={() => loadAddresses({ silent: true })}
      />

      <Dialog
        open={Boolean(deletingAddress)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && !isDeleting) {
            setDeletingAddress(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete address</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the address for{" "}
              <span className="font-bold">{deletingAddress?.name}</span>? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isDeleting}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  Deleting
                  <Loader2 className="size-4 animate-spin" />
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
