"use client"

import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { IAddress } from "@/interfaces"
import { addAddress, editAddressById } from "@/services/addresses"

const formSchema = z.object({
  name: z.string().min(1, "Name is required."),
  phone: z
    .string()
    .min(10, "Phone number must be 10 digits.")
    .max(10, "Phone number must be 10 digits.")
    .regex(/^\d+$/, "Phone number must contain only numbers."),
  address_line: z.string().min(1, "Address is required."),
  city: z.string().min(1, "City is required."),
  state: z.string().min(1, "State is required."),
  postal_code: z
    .string()
    .min(6, "PIN code must be 6 digits.")
    .max(6, "PIN code must be 6 digits.")
    .regex(/^\d+$/, "PIN code must contain only numbers."),
  is_default: z.boolean(),
})

type AddressFormValues = z.infer<typeof formSchema>

type AddressFormProps = {
  address?: IAddress
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
  showTrigger?: boolean
}

export function AddressForm({
  address,
  open: openProp,
  onOpenChange,
  onSuccess,
  showTrigger,
}: AddressFormProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const isControlled = openProp !== undefined
  const open = isControlled ? openProp : uncontrolledOpen
  const isEdit = Boolean(address)
  const shouldShowTrigger = showTrigger ?? !isEdit
  const formId = shouldShowTrigger ? "add-address-form" : "edit-address-form"

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      address_line: "",
      city: "",
      state: "",
      postal_code: "",
      is_default: false,
    },
  })

  const isSubmitting = form.formState.isSubmitting

  function setOpen(nextOpen: boolean) {
    if (!isControlled) {
      setUncontrolledOpen(nextOpen)
    }
    onOpenChange?.(nextOpen)
  }

  useEffect(() => {
    if (!open) return
    form.reset({
      name: address?.name ?? "",
      phone: address?.phone ?? "",
      address_line: address?.address_line ?? "",
      city: address?.city ?? "",
      state: address?.state ?? "",
      postal_code: address?.postal_code ?? "",
      is_default: address?.is_default ?? false,
    })
  }, [open, address, form])

  async function onSubmit(data: AddressFormValues) {
    try {
      if (address) {
        await editAddressById(address.id, data)
        toast.success("Address updated successfully.")
      } else {
        await addAddress(data)
        toast.success("Address added successfully.")
      }
      form.reset()
      setOpen(false)
      onSuccess?.()
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : address
            ? "Failed to update address. Please try again."
            : "Failed to add address. Please try again."
      )
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) form.reset()
      }}
    >
      {shouldShowTrigger && (
        <DialogTrigger asChild>
          <Button>Add Address</Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Address" : "Add Address"}</DialogTitle>
        </DialogHeader>
        <form
          id={formId}
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <FieldGroup className="gap-4">
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`${formId}-name`}>Full name</FieldLabel>
                  <Input
                    {...field}
                    id={`${formId}-name`}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="phone"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`${formId}-phone`}>Phone</FieldLabel>
                  <Input
                    {...field}
                    id={`${formId}-phone`}
                    inputMode="numeric"
                    maxLength={10}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="address_line"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`${formId}-address_line`}>
                    Address
                  </FieldLabel>
                  <Input
                    {...field}
                    id={`${formId}-address_line`}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Controller
                name="city"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={`${formId}-city`}>City</FieldLabel>
                    <Input
                      {...field}
                      id={`${formId}-city`}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="state"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={`${formId}-state`}>State</FieldLabel>
                    <Input
                      {...field}
                      id={`${formId}-state`}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>
            <Controller
              name="postal_code"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`${formId}-postal_code`}>
                    PIN code
                  </FieldLabel>
                  <Input
                    {...field}
                    id={`${formId}-postal_code`}
                    inputMode="numeric"
                    maxLength={6}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="is_default"
              control={form.control}
              render={({ field }) => (
                <Field orientation="horizontal">
                  <input
                    id={`${formId}-is_default`}
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={field.value}
                    onChange={(event) => field.onChange(event.target.checked)}
                  />
                  <FieldLabel htmlFor={`${formId}-is_default`}>
                    Set as default address
                  </FieldLabel>
                </Field>
              )}
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" form={formId} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                {isEdit ? "Saving address" : "Adding address"}
                <Loader2 className="size-4 animate-spin" />
              </>
            ) : isEdit ? (
              "Save changes"
            ) : (
              "Add address"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
