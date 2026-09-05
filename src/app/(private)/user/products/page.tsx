"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import PageTitle from "@/components/ui/page-title"
import { IProduct } from "@/interfaces"
import { cn } from "@/lib/utils"
import { getAllProductsWithFilters } from "@/services/products"

import {
  ALL_CATEGORIES,
  defaultProductFilters,
  ProductFiltersValue,
  ProductsFilters,
} from "./_components/products-filters"
import { ProductCard } from "./_components/products.card"

export default function ProductsPage() {
  const [products, setProducts] = useState<IProduct[]>([])
  const [filters, setFilters] = useState<ProductFiltersValue>(
    defaultProductFilters
  )
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(filters.search.trim())
    }, 300)

    return () => window.clearTimeout(timeoutId)
  }, [filters.search])

  useEffect(() => {
    let cancelled = false

    async function loadProducts() {
      setIsLoading(true)
      try {
        const data = await getAllProductsWithFilters({
          search: debouncedSearch,
          categoryId:
            filters.categoryId === ALL_CATEGORIES
              ? undefined
              : filters.categoryId,
          sort: filters.sort,
        })
        if (!cancelled) {
          setProducts(data)
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Failed to load products. Please try again."
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadProducts()

    return () => {
      cancelled = true
    }
  }, [debouncedSearch, filters.categoryId, filters.sort])

  const isSearchPending = filters.search.trim() !== debouncedSearch
  const isFetching = isLoading || isSearchPending

  return (
    <div className="flex w-full flex-col gap-4">
      <PageTitle title="Products" />
      <ProductsFilters
        value={filters}
        onChange={setFilters}
        isSearching={isSearchPending || (isLoading && Boolean(debouncedSearch))}
      />
      <div className="relative min-h-40" aria-busy={isFetching}>
        {isFetching ? (
          <div className="absolute inset-0 z-10 rounded-xl bg-background/70 backdrop-blur-[1px]">
            <div className="sticky top-24 flex items-center justify-center py-16">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
              <span className="sr-only">Loading products</span>
            </div>
          </div>
        ) : null}
        {products.length === 0 && !isFetching ? (
          <p className="text-muted-foreground py-16 text-center">
            No products match your filters.
          </p>
        ) : products.length === 0 ? (
          <div className="min-h-40" />
        ) : (
          <div
            className={cn(
              "grid w-full grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4",
              isFetching && "pointer-events-none opacity-50"
            )}
          >
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
