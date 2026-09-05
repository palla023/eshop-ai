"use client"

import { OrderStatus } from "@/interfaces"
import { orderStatusStyles } from "@/app/(private)/user/orders/_components/order-utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { ORDER_STATUSES } from "./admin-order-utils"

type OrderStatusSelectProps = {
  value: OrderStatus
  disabled?: boolean
  onChange: (status: OrderStatus) => void
}

export function OrderStatusSelect({
  value,
  disabled,
  onChange,
}: OrderStatusSelectProps) {
  return (
    <Select
      value={value}
      onValueChange={(next) => onChange(next as OrderStatus)}
      disabled={disabled}
    >
      <SelectTrigger size="sm" className="min-w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ORDER_STATUSES.map((status) => (
          <SelectItem key={status} value={status}>
            {orderStatusStyles[status].label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
