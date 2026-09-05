"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import dayjs from "dayjs"
import { Loader2, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ICategory, IProduct } from "@/interfaces"
import { getAllCategories } from "@/services/categories"
import { deleteProduct, getAllProducts } from "@/services/products"

import { ProductForm } from "./product-form"

type ProductsTableProps = {
  refreshKey?: number
}

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
})

export function ProductsTable({ refreshKey = 0 }: ProductsTableProps) {
  const [products, setProducts] = useState<IProduct[]>([])
  const [categories, setCategories] = useState<ICategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingProduct, setEditingProduct] = useState<IProduct | null>(null)
  const [deletingProduct, setDeletingProduct] = useState<IProduct | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const categoryNamesById = useMemo(() => {
    return new Map(
      categories.map((category) => [String(category.id), category.name])
    )
  }, [categories])

  const loadProducts = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setIsLoading(true)
    }
    try {
      const [productData, categoryData] = await Promise.all([
        getAllProducts(),
        getAllCategories(),
      ])
      setProducts(productData)
      setCategories(categoryData)
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load products. Please try again."
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProducts({ silent: refreshKey > 0 })
  }, [loadProducts, refreshKey])

  async function handleDelete() {
    if (!deletingProduct) return

    setIsDeleting(true)
    try {
      await deleteProduct(deletingProduct.id)
      toast.success("Product deleted successfully.")
      setDeletingProduct(null)
      await loadProducts({ silent: true })
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete product. Please try again."
      )
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-40 w-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      <Table>
        <TableHeader className="bg-muted">
          <TableRow className="hover:bg-muted">
            <TableHead className="font-bold">Image</TableHead>
            <TableHead className="font-bold">Name</TableHead>
            <TableHead className="font-bold">Category</TableHead>
            <TableHead className="font-bold">Price</TableHead>
            <TableHead className="font-bold">Created at</TableHead>
            <TableHead className="text-right font-bold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="h-24 text-center text-muted-foreground"
              >
                No products found.
              </TableCell>
            </TableRow>
          ) : (
            products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  {product.images?.[0] ? (
                    <div className="size-12 overflow-hidden rounded-md ring-1 ring-transparent transition-[box-shadow,ring-color] duration-200 hover:ring-foreground/20 hover:shadow-md">
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="size-12 object-cover transition-transform duration-300 ease-out motion-safe:hover:scale-110"
                      />
                    </div>
                  ) : (
                    <div className="bg-muted size-12 rounded-md" />
                  )}
                </TableCell>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>
                  {categoryNamesById.get(String(product.category_id)) ?? "—"}
                </TableCell>
                <TableCell>{currencyFormatter.format(product.price)}</TableCell>
                <TableCell>
                  {dayjs(product.created_at).format("DD MMM YYYY, hh:mm A")}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Edit ${product.name}`}
                      onClick={() => setEditingProduct(product)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Delete ${product.name}`}
                      onClick={() => setDeletingProduct(product)}
                    >
                      <Trash2 className="text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <ProductForm
        product={editingProduct ?? undefined}
        open={Boolean(editingProduct)}
        showTrigger={false}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setEditingProduct(null)
        }}
        onSuccess={() => loadProducts({ silent: true })}
      />

      <Dialog
        open={Boolean(deletingProduct)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && !isDeleting) {
            setDeletingProduct(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-bold">{deletingProduct?.name}</span>? This
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
