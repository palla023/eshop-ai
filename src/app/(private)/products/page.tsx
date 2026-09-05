"use client"

import { useState } from "react"

import PageTitle from "@/components/ui/page-title"
import { ProductForm } from "./_components/product-form"
import { ProductsTable } from "./_components/products-table"

export default function AdminProductsPage() {
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex w-full items-center justify-between">
        <PageTitle title="Products" />
        <ProductForm onSuccess={() => setRefreshKey((key) => key + 1)} />
      </div>
      <ProductsTable refreshKey={refreshKey} />
    </div>
  )
}
