"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"

import PageTitle from "@/components/ui/page-title"
import { Button } from "@/components/ui/button"
import { IProduct } from "@/interfaces"
import { cn } from "@/lib/utils"
import { getProductById } from "@/services/products"

import { ProductInteraction } from "./_components/product-interaction"

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
})

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>()
  const [product, setProduct] = useState<IProduct | null>(null)
  const [selectedImage, setSelectedImage] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadProduct() {
      if (!params.id) return
      setIsLoading(true)
      try {
        const data = await getProductById(params.id)
        if (!cancelled) {
          setProduct(data)
          setSelectedImage(data.images?.[0] ?? "")
        }
      } catch (error) {
        if (!cancelled) {
          setProduct(null)
          toast.error(
            error instanceof Error
              ? error.message
              : "Failed to load product. Please try again."
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadProduct()

    return () => {
      cancelled = true
    }
  }, [params.id])

  if (isLoading) {
    return (
      <div className="flex min-h-40 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <span className="sr-only">Loading product</span>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex flex-col items-start gap-4">
        <PageTitle title="Product not found" />
        <Button asChild variant="outline">
          <Link href="/user/products">
            <ArrowLeft />
            Back to products
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <Button asChild variant="ghost" className="w-fit px-0 hover:bg-transparent">
        <Link href="/user/products">
          <ArrowLeft />
          Back to products
        </Link>
      </Button>

      <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="flex flex-col gap-3">
          <div className="bg-muted/40 relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-xl">
            {selectedImage ? (
              <img
                src={selectedImage}
                alt={product.name}
                className="max-h-full max-w-full object-contain p-4"
              />
            ) : (
              <div className="bg-muted h-full w-full" />
            )}
          </div>
          {product.images?.length > 1 ? (
            <div className="flex flex-wrap gap-2">
              {product.images.map((image) => (
                <button
                  key={image}
                  type="button"
                  onClick={() => setSelectedImage(image)}
                  className={cn(
                    "size-16 overflow-hidden rounded-md ring-1 ring-border",
                    selectedImage === image && "ring-2 ring-foreground"
                  )}
                >
                  <img
                    src={image}
                    alt=""
                    className="size-full object-contain p-1"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-4">
          <PageTitle title={product.name} />
          <p className="text-muted-foreground">{product.description}</p>
          <p className="text-2xl font-semibold">
            {currencyFormatter.format(product.price)}
          </p>
          <ProductInteraction product={product} />
        </div>
      </div>
    </div>
  )
}
