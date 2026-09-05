"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Minus, Plus, ShoppingCart } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { IProduct } from "@/interfaces"
import { useCartStore } from "@/store/cart-store"

type ProductInteractionProps = {
  product: IProduct
}

export function ProductInteraction({ product }: ProductInteractionProps) {
  const router = useRouter()
  const [quantity, setQuantity] = useState(1)
  const addCartItem = useCartStore((state) => state.addCartItem)

  function handleQuantityChange(type: "increment" | "decrement") {
    setQuantity((current) => {
      if (type === "increment") return current + 1
      return current > 1 ? current - 1 : 1
    })
  }

  function handleAddToCart() {
    addCartItem(product, quantity)
    toast.success(`${product.name} added to cart`)
  }

  function handleBuyNow() {
    addCartItem(product, quantity)
    router.push("/user/cart")
  }

  return (
    <div className="mt-4 flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <span className="text-muted-foreground text-sm">Quantity</span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Decrease quantity"
            onClick={() => handleQuantityChange("decrement")}
          >
            <Minus />
          </Button>
          <span className="min-w-8 text-center text-sm font-medium tabular-nums">
            {quantity}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Increase quantity"
            onClick={() => handleQuantityChange("increment")}
          >
            <Plus />
          </Button>
        </div>
      </div>

      <Button type="button" onClick={handleAddToCart}>
        <Plus />
        Add to cart
      </Button>
      <Button type="button" variant="outline" onClick={handleBuyNow}>
        <ShoppingCart />
        Buy this item
      </Button>
    </div>
  )
}
