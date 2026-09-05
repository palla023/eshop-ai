"use client"

import { useEffect, useState } from "react"
import { Loader2, Search, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ICategory } from "@/interfaces"
import { getAllCategories } from "@/services/categories"
import { ProductSort } from "@/services/products"

export const ALL_CATEGORIES = "all"

export type ProductFiltersValue = {
  search: string
  categoryId: string
  sort: ProductSort
}

export const defaultProductFilters: ProductFiltersValue = {
  search: "",
  categoryId: ALL_CATEGORIES,
  sort: "name_asc",
}

type ProductsFiltersProps = {
  value: ProductFiltersValue
  onChange: (value: ProductFiltersValue) => void
  isSearching?: boolean
}

export function ProductsFilters({
  value,
  onChange,
  isSearching = false,
}: ProductsFiltersProps) {
  const [categories, setCategories] = useState<ICategory[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const hasActiveFilters =
    value.search.trim() !== "" ||
    value.categoryId !== ALL_CATEGORIES ||
    value.sort !== defaultProductFilters.sort

  useEffect(() => {
    async function loadCategories() {
      setIsLoadingCategories(true)
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
        setIsLoadingCategories(false)
      }
    }

    loadCategories()
  }, [])

  return (
    <div className="flex w-full min-w-0 items-end gap-3">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Label htmlFor="product-search">Search</Label>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="product-search"
            value={value.search}
            onChange={(event) =>
              onChange({ ...value, search: event.target.value })
            }
            placeholder="Search by name"
            className="pr-8 pl-8"
            aria-busy={isSearching}
          />
          {isSearching ? (
            <Loader2 className="absolute top-1/2 right-2.5 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          ) : null}
        </div>
      </div>

      <div className="flex w-[200px] shrink-0 flex-col gap-1.5">
        <Label htmlFor="product-category">Category</Label>
        <Select
          value={value.categoryId}
          onValueChange={(categoryId) => onChange({ ...value, categoryId })}
          disabled={isLoadingCategories}
        >
          <SelectTrigger
            id="product-category"
            className="h-10 w-full min-h-10 py-0 data-[size=default]:h-10"
            aria-busy={isLoadingCategories}
          >
            {isLoadingCategories ? (
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            ) : null}
            <SelectValue
              placeholder={
                isLoadingCategories ? "Loading categories..." : "All categories"
              }
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_CATEGORIES}>All categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={String(category.id)}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex w-[220px] shrink-0 flex-col gap-1.5">
        <Label htmlFor="product-sort">Sort by</Label>
        <Select
          value={value.sort}
          onValueChange={(sort) =>
            onChange({ ...value, sort: sort as ProductSort })
          }
        >
          <SelectTrigger
            id="product-sort"
            className="h-10 w-full min-h-10 py-0 data-[size=default]:h-10"
          >
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name_asc">Name (A–Z)</SelectItem>
            <SelectItem value="price_asc">Price: Low to High</SelectItem>
            <SelectItem value="price_desc">Price: High to Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="shrink-0">
        <Button
          type="button"
          variant="outline"
          className="h-10"
          disabled={!hasActiveFilters}
          onClick={() => onChange(defaultProductFilters)}
        >
          <X />
          Clear
        </Button>
      </div>
    </div>
  )
}
