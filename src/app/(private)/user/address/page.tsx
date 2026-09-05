"use client"

import { useState } from "react"

import PageTitle from "@/components/ui/page-title"

import { AddressForm } from "./_components/address-form"
import { AddressesTable } from "./_components/addresses-table"

export default function UserAddressPage() {
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex w-full items-center justify-between">
        <PageTitle title="Address" />
        <AddressForm onSuccess={() => setRefreshKey((key) => key + 1)} />
      </div>
      <AddressesTable refreshKey={refreshKey} />
    </div>
  )
}
