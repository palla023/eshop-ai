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
import { Textarea } from "@/components/ui/textarea"
import { ICategory } from "@/interfaces"
import { addCategory, editCategoryById } from "@/services/categories"

const formSchema = z.object({
  name: z.string().min(1, "Name is required."),
  description: z.string().min(1, "Description is required."),
})

type CategoryFormValues = z.infer<typeof formSchema>

type CategoryFormProps = {
  category?: ICategory
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
  showTrigger?: boolean
}

export function CategoryForm({
  category,
  open: openProp,
  onOpenChange,
  onSuccess,
  showTrigger,
}: CategoryFormProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const isControlled = openProp !== undefined
  const open = isControlled ? openProp : uncontrolledOpen
  const isEdit = Boolean(category)
  const shouldShowTrigger = showTrigger ?? !isEdit
  const formId = shouldShowTrigger ? "add-category-form" : "edit-category-form"

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
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
      name: category?.name ?? "",
      description: category?.description ?? "",
    })
  }, [open, category, form])

  async function onSubmit(data: CategoryFormValues) {
    try {
      if (category) {
        await editCategoryById(category.id, data)
        toast.success("Category updated successfully.")
      } else {
        await addCategory(data)
        toast.success("Category added successfully.")
      }
      form.reset()
      setOpen(false)
      onSuccess?.()
    } catch (error) {
      const message =
        error &&
        typeof error === "object" &&
        "message" in error &&
        typeof error.message === "string"
          ? error.message
          : category
            ? "Failed to update category. Please try again."
            : "Failed to add category. Please try again."
      toast.error(message)
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
          <Button>Add Category</Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Category" : "Add Category"}</DialogTitle>
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
                  <FieldLabel htmlFor={`${formId}-name`}>Name</FieldLabel>
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
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`${formId}-description`}>
                    Description
                  </FieldLabel>
                  <Textarea
                    {...field}
                    id={`${formId}-description`}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
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
                {isEdit ? "Saving category" : "Adding category"}
                <Loader2 className="size-4 animate-spin" />
              </>
            ) : isEdit ? (
              "Save changes"
            ) : (
              "Add category"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
