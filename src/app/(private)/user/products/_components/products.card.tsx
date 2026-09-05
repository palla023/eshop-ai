import Link from "next/link"
import { Minus, Plus, ShoppingCart } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { IProduct } from "@/interfaces"
import { cn } from "@/lib/utils"
import { useCartStore } from "@/store/cart-store"

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
})

type ProductCardProps = {
  product: IProduct
}

export function ProductCard({ product }: ProductCardProps) {
  const addCartItem = useCartStore((state) => state.addCartItem)
  const editCartItem = useCartStore((state) => state.editCartItem)
  const quantity = useCartStore(
    (state) =>
      state.cart.find((item) => item.id === product.id)?.quantity ?? 0
  )
  const hasHydrated = useCartStore((state) => state.hasHydrated)
  const primaryImage = product.images?.[0]
  const hoverImage = product.images?.[1]
  const extraImageCount = Math.max((product.images?.length ?? 0) - 1, 0)
  const isInCart = hasHydrated && quantity > 0

  function handleAddToCart() {
    addCartItem(product)
    toast.success(`${product.name} added to cart`)
  }

  function handleIncrement() {
    editCartItem(product.id, quantity + 1)
  }

  function handleDecrement() {
    editCartItem(product.id, quantity - 1)
  }

  return (
    <Card className="group h-full gap-0 overflow-hidden py-0 transition-[box-shadow,transform] duration-300 ease-out hover:-translate-y-1 hover:shadow-xl">
      <Link
        href={`/user/products/${product.id}`}
        className="relative flex h-72 w-full items-center justify-center overflow-hidden bg-muted/40 sm:h-80"
      >
        {primaryImage ? (
          <>
            <img
              src={primaryImage}
              alt={product.name}
              className={cn(
                "relative z-10 max-h-full max-w-full object-contain p-4 transition-[transform,opacity] duration-500 ease-out",
                hoverImage
                  ? "group-hover:opacity-0"
                  : "motion-safe:group-hover:scale-110"
              )}
            />
            {hoverImage ? (
              <img
                src={hoverImage}
                alt=""
                aria-hidden
                className="absolute inset-0 z-10 m-auto max-h-full max-w-full object-contain p-4 opacity-0 transition-[transform,opacity] duration-500 ease-out group-hover:opacity-100 motion-safe:group-hover:scale-105"
              />
            ) : null}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-t from-black/20 via-transparent to-white/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            />
            {extraImageCount > 0 ? (
              <span className="pointer-events-none absolute right-3 bottom-3 z-30 rounded-full bg-background/90 px-2 py-0.5 text-xs text-muted-foreground opacity-0 shadow-sm transition-opacity duration-300 group-hover:opacity-100">
                +{extraImageCount} more
              </span>
            ) : null}
          </>
        ) : (
          <div className="bg-muted h-full w-full" />
        )}
      </Link>
      <CardHeader className="pt-5">
        <CardTitle className="line-clamp-1 text-lg transition-colors duration-200 group-hover:text-primary">
          <Link href={`/user/products/${product.id}`}>{product.name}</Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 pb-5">
        <p className="text-muted-foreground line-clamp-2 text-sm">
          {product.description}
        </p>
        <div className="mt-auto flex items-center justify-between gap-3">
          <p className="text-lg font-semibold">
            {currencyFormatter.format(product.price)}
          </p>
          {isInCart ? (
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label={`Decrease quantity of ${product.name}`}
                onClick={handleDecrement}
              >
                <Minus />
              </Button>
              <span className="min-w-6 text-center text-sm font-medium tabular-nums">
                {quantity}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label={`Increase quantity of ${product.name}`}
                onClick={handleIncrement}
              >
                <Plus />
              </Button>
            </div>
          ) : (
            <Button type="button" size="sm" onClick={handleAddToCart}>
              <ShoppingCart />
              Add
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
