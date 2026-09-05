"use client"

import { useEffect, useMemo, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, X } from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ICategory, IProduct } from "@/interfaces"
import { getAllCategories } from "@/services/categories"
import { addProduct, editProductById } from "@/services/products"
import { uploadFileAndReturnUrl } from "@/services/uploads"

const formSchema = z.object({
  name: z.string().min(1, "Name is required."),
  description: z.string().min(1, "Description is required."),
  price: z.coerce.number().positive("Price must be greater than 0."),
  category_id: z.string().min(1, "Category is required."),
})

type ProductFormValues = z.infer<typeof formSchema>

type ProductFormProps = {
  product?: IProduct
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
  showTrigger?: boolean
}

export function ProductForm({
  product,
  open: openProp,
  onOpenChange,
  onSuccess,
  showTrigger,
}: ProductFormProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const [categories, setCategories] = useState<ICategory[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [imageError, setImageError] = useState("")
  const isControlled = openProp !== undefined
  const open = isControlled ? openProp : uncontrolledOpen
  const isEdit = Boolean(product)
  const shouldShowTrigger = showTrigger ?? !isEdit
  const formId = shouldShowTrigger ? "add-product-form" : "edit-product-form"

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      category_id: "",
    },
  })

  const isSubmitting = form.formState.isSubmitting
  const newFilePreviews = useMemo(
    () =>
      newFiles.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      })),
    [newFiles]
  )

  function setOpen(nextOpen: boolean) {
    if (!isControlled) {
      setUncontrolledOpen(nextOpen)
    }
    onOpenChange?.(nextOpen)
  }

  function resetImages(nextProduct?: IProduct) {
    setExistingImages(nextProduct?.images ?? [])
    setNewFiles([])
    setImageError("")
  }

  useEffect(() => {
    if (!open) return

    form.reset({
      name: product?.name ?? "",
      description: product?.description ?? "",
      price: product?.price ?? 0,
      category_id: product?.category_id ? String(product.category_id) : "",
    })
    resetImages(product)

    let cancelled = false

    async function loadCategories() {
      setIsLoadingCategories(true)
      try {
        const data = await getAllCategories()
        if (!cancelled) {
          setCategories(data)
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Failed to load categories. Please try again."
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoadingCategories(false)
        }
      }
    }

    loadCategories()

    return () => {
      cancelled = true
    }
  }, [open, product, form])

  useEffect(() => {
    return () => {
      newFilePreviews.forEach((preview) => URL.revokeObjectURL(preview.url))
    }
  }, [newFiles, newFilePreviews])

  async function onSubmit(data: ProductFormValues) {
    if (existingImages.length + newFiles.length === 0) {
      setImageError("At least one image is required.")
      return
    }

    try {
      const uploadedUrls = await Promise.all(
        newFiles.map((file) => uploadFileAndReturnUrl(file))
      )
      const payload = {
        name: data.name,
        description: data.description,
        price: data.price,
        category_id: data.category_id,
        images: [...existingImages, ...uploadedUrls],
      }

      if (product) {
        await editProductById(product.id, payload)
        toast.success("Product updated successfully.")
      } else {
        await addProduct(payload)
        toast.success("Product added successfully.")
      }
      form.reset()
      resetImages()
      setOpen(false)
      onSuccess?.()
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : product
            ? "Failed to update product. Please try again."
            : "Failed to add product. Please try again."
      )
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) {
          form.reset()
          resetImages()
        }
      }}
    >
      {shouldShowTrigger && (
        <DialogTrigger asChild>
          <Button>Add Product</Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Product" : "Add Product"}</DialogTitle>
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
            <Controller
              name="price"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`${formId}-price`}>Price</FieldLabel>
                  <Input
                    {...field}
                    id={`${formId}-price`}
                    type="number"
                    min="0"
                    step="0.01"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="category_id"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`${formId}-category`}>
                    Category
                  </FieldLabel>
                  <Select
                    value={field.value || undefined}
                    onValueChange={field.onChange}
                    disabled={isLoadingCategories}
                  >
                    <SelectTrigger
                      id={`${formId}-category`}
                      className="w-full"
                      aria-invalid={fieldState.invalid}
                    >
                      <SelectValue
                        placeholder={
                          isLoadingCategories
                            ? "Loading categories..."
                            : "Select a category"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={String(category.id)}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Field data-invalid={Boolean(imageError)}>
              <FieldLabel htmlFor={`${formId}-images`}>Images</FieldLabel>
              <Input
                id={`${formId}-images`}
                type="file"
                accept="image/*"
                multiple
                aria-invalid={Boolean(imageError)}
                onChange={(event) => {
                  const files = Array.from(event.target.files ?? [])
                  if (files.length === 0) return
                  setNewFiles((current) => [...current, ...files])
                  setImageError("")
                  event.target.value = ""
                }}
              />
              {(existingImages.length > 0 || newFilePreviews.length > 0) && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {existingImages.map((url) => (
                    <div key={url} className="group/preview relative size-16 overflow-hidden rounded-md border transition-shadow duration-200 hover:shadow-md">
                      <img
                        src={url}
                        alt="Product"
                        className="size-full object-cover transition-transform duration-300 ease-out motion-safe:group-hover/preview:scale-110"
                      />
                      <button
                        type="button"
                        className="absolute top-0.5 right-0.5 rounded-full bg-black/70 p-0.5 text-white"
                        aria-label="Remove image"
                        onClick={() =>
                          setExistingImages((current) =>
                            current.filter((image) => image !== url)
                          )
                        }
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                  {newFilePreviews.map((preview) => (
                    <div
                      key={preview.url}
                      className="group/preview relative size-16 overflow-hidden rounded-md border transition-shadow duration-200 hover:shadow-md"
                    >
                      <img
                        src={preview.url}
                        alt={preview.file.name}
                        className="size-full object-cover transition-transform duration-300 ease-out motion-safe:group-hover/preview:scale-110"
                      />
                      <button
                        type="button"
                        className="absolute top-0.5 right-0.5 rounded-full bg-black/70 p-0.5 text-white"
                        aria-label={`Remove ${preview.file.name}`}
                        onClick={() =>
                          setNewFiles((current) =>
                            current.filter((file) => file !== preview.file)
                          )
                        }
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {imageError && <FieldError errors={[{ message: imageError }]} />}
            </Field>
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
                {isEdit ? "Saving product" : "Adding product"}
                <Loader2 className="size-4 animate-spin" />
              </>
            ) : isEdit ? (
              "Save changes"
            ) : (
              "Add product"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
