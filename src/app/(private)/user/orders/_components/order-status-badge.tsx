import { OrderStatus } from "@/interfaces"

import { orderStatusStyles } from "./order-utils"

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const style = orderStatusStyles[status] ?? orderStatusStyles.pending

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style.className}`}
    >
      {style.label}
    </span>
  )
}
