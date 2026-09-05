import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ShoppingBag,
  Star,
  Truck,
  ShieldCheck,
  Headphones,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Home", href: "#home" },
  { label: "Shop", href: "#shop" },
  { label: "Features", href: "#features" },
  { label: "Reviews", href: "#reviews" },
  { label: "Contact", href: "#contact" },
];

const features = [
  {
    icon: ShoppingBag,
    title: "Curated Products",
    description: "Hand-picked items across fashion, tech, and lifestyle.",
  },
  {
    icon: Truck,
    title: "Fast Delivery",
    description: "Track every order with reliable shipping nationwide.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Checkout",
    description: "Protected payments and buyer-friendly return policies.",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Real humans ready to help whenever you need assistance.",
  },
];

const stats = [
  { value: "10K+", label: "Products" },
  { value: "50K+", label: "Happy Customers" },
  { value: "99%", label: "Satisfaction Rate" },
  { value: "24h", label: "Avg. Dispatch" },
];

const testimonials = [
  {
    name: "Sarah Mitchell",
    role: "Frequent Shopper",
    rating: 5,
    review:
      "Eshop makes online shopping effortless. Fast delivery, great prices, and a clean experience from start to finish.",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=face",
  },
  {
    name: "James Carter",
    role: "Small Business Owner",
    rating: 5,
    review:
      "I switched to Eshop for my store supplies and haven't looked back. Reliable inventory and excellent customer support.",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=face",
  },
  {
    name: "Priya Sharma",
    role: "Fashion Enthusiast",
    rating: 5,
    review:
      "The curated collections and smooth checkout keep me coming back. Eshop feels modern, simple, and trustworthy.",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&h=120&fit=crop&crop=face",
  },
];

const HomePage = () => {
  return (
    <div className="flex min-h-full flex-col bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black">
        <div className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-2xl font-bold tracking-tight text-white"
          >
            <ShoppingBag className="size-6" aria-hidden />
            Eshop
          </Link>

          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-sm text-white/80 transition-colors hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <Button
            asChild
            variant="outline"
            className="border-white bg-transparent text-white hover:bg-white hover:text-black"
          >
            <Link href="/login">Login</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section
          id="home"
          className="relative overflow-hidden border-b border-border bg-linear-to-b from-muted/60 to-background"
        >
          <div className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-black/5 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-64 w-64 rounded-full bg-black/5 blur-3xl" />

          <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 md:grid-cols-2 md:py-24">
            <div className="flex flex-col gap-6">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-background px-4 py-1.5 text-xs uppercase tracking-widest text-muted-foreground">
                <span className="size-2 rounded-full bg-black" />
                New season collection live
              </span>
              <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl">
                Shop smarter with{" "}
                <span className="underline decoration-black/20 underline-offset-8">
                  Eshop
                </span>
              </h1>
              <p className="max-w-lg text-lg leading-relaxed text-muted-foreground">
                Discover premium products, exclusive deals, and a seamless
                checkout experience. Eshop brings everything you love about
                shopping into one beautiful, fast platform.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Button asChild size="lg" className="gap-2 px-8">
                  <Link href="/register">
                    Start Shopping
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="px-8">
                  <Link href="/login">Sign In</Link>
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 sm:grid-cols-4">
                {stats.map((stat) => (
                  <div key={stat.label}>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div id="shop" className="relative">
              <div className="absolute -inset-4 rounded-3xl bg-black/5 blur-2xl" />
              <div className="relative overflow-hidden rounded-3xl border border-border bg-background shadow-2xl">
                <Image
                  src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=900&fit=crop"
                  alt="Modern ecommerce store with curated products on display"
                  width={1200}
                  height={900}
                  priority
                  className="h-[320px] w-full object-cover md:h-[480px]"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <p className="text-sm uppercase tracking-widest text-white/80">
                    Featured collection
                  </p>
                  <p className="text-xl font-bold">Summer Essentials 2026</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="border-b border-border py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-12 max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Why shoppers choose Eshop
              </h2>
              <p className="mt-3 text-muted-foreground">
                Built for people who want quality products without the hassle.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <article
                  key={feature.title}
                  className="group rounded-2xl border border-border bg-background p-6 transition-all hover:-translate-y-1 hover:border-black/20 hover:shadow-lg"
                >
                  <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-black text-white transition-transform group-hover:scale-110">
                    <feature.icon className="size-5" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="reviews" className="bg-muted/40 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Loved by thousands
              </h2>
              <p className="mt-3 text-muted-foreground">
                Real reviews from people who shop with Eshop every day.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {testimonials.map((item) => (
                <article
                  key={item.name}
                  className="flex flex-col rounded-2xl border border-border bg-background p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="mb-4 flex gap-1">
                    {Array.from({ length: item.rating }).map((_, i) => (
                      <Star
                        key={i}
                        className="size-4 fill-black text-black"
                      />
                    ))}
                  </div>
                  <p className="mb-6 flex-1 leading-relaxed text-muted-foreground">
                    &ldquo;{item.review}&rdquo;
                  </p>
                  <div className="flex items-center gap-3 border-t border-border pt-4">
                    <Image
                      src={item.avatar}
                      alt={item.name}
                      width={48}
                      height={48}
                      className="size-12 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.role}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer id="contact" className="bg-black text-white">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid gap-10 md:grid-cols-3">
            <div>
              <p className="inline-flex items-center gap-2 text-2xl font-bold">
                <ShoppingBag className="size-6" aria-hidden />
                Eshop
              </p>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/70">
                Your trusted destination for quality products, fast delivery,
                and a shopping experience you will love.
              </p>
            </div>
            <div>
              <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-white/50">
                Quick Links
              </p>
              <ul className="space-y-2 text-sm text-white/80">
                {navItems.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="transition-colors hover:text-white"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-white/50">
                Get in touch
              </p>
              <p className="text-sm text-white/80">hello@eshop.com</p>
              <p className="mt-1 text-sm text-white/80">+1 (800) 555-0199</p>
            </div>
          </div>
          <div className="mt-10 border-t border-white/10 pt-6 text-center text-sm text-white/50">
            &copy; {new Date().getFullYear()} Eshop. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
