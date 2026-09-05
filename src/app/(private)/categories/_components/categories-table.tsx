"use client"

import { useCallback, useEffect, useState } from "react"
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
import { ICategory } from "@/interfaces"
import { deleteCategory, getAllCategories } from "@/services/categories"

import { CategoryForm } from "./category-form"

type CategoriesTableProps = {
  refreshKey?: number
}

export function CategoriesTable({ refreshKey = 0 }: CategoriesTableProps) {
  const [categories, setCategories] = useState<ICategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingCategory, setEditingCategory] = useState<ICategory | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<ICategory | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadCategories = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setIsLoading(true)
    }
    try {
      const data = await getAllCategories()
      setCategories(data)
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load categories. Please try again."
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCategories({ silent: refreshKey > 0 })
  }, [loadCategories, refreshKey])

  async function handleDelete() {
    if (!deletingCategory) return

    setIsDeleting(true)
    try {
      await deleteCategory(deletingCategory.id)
      toast.success("Category deleted successfully.")
      setDeletingCategory(null)
      await loadCategories({ silent: true })
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete category. Please try again."
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
            <TableHead className="font-bold">Name</TableHead>
            <TableHead className="font-bold">Description</TableHead>
            <TableHead className="font-bold">Created at</TableHead>
            <TableHead className="text-right font-bold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={4}
                className="h-24 text-center text-muted-foreground"
              >
                No categories found.
              </TableCell>
            </TableRow>
          ) : (
            categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell className="max-w-md truncate whitespace-normal">
                  {category.description}
                </TableCell>
                <TableCell>
                  {dayjs(category.created_at).format("DD MMM YYYY, hh:mm A")}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Edit ${category.name}`}
                      onClick={() => setEditingCategory(category)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Delete ${category.name}`}
                      onClick={() => setDeletingCategory(category)}
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

      <CategoryForm
        category={editingCategory ?? undefined}
        open={Boolean(editingCategory)}
        showTrigger={false}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setEditingCategory(null)
        }}
        onSuccess={() => loadCategories({ silent: true })}
      />

      <Dialog
        open={Boolean(deletingCategory)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && !isDeleting) {
            setDeletingCategory(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-bold">{deletingCategory?.name}</span>? This
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
