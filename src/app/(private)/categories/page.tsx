"use client"

import { useState } from "react"

import PageTitle from "@/components/ui/page-title"
import { CategoriesTable } from "./_components/categories-table"
import { CategoryForm } from "./_components/category-form"

export default function AdminCategoriesPage() {
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex w-full items-center justify-between">
        <PageTitle title="Categories" />
        <CategoryForm onSuccess={() => setRefreshKey((key) => key + 1)} />
      </div>
      <CategoriesTable refreshKey={refreshKey} />
    </div>
  )
}
