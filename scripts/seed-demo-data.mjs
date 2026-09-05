import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv(filePath) {
  const contents = readFileSync(filePath, "utf8");
  for (const line of contents.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv(resolve(process.cwd(), ".env"));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase env values.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

const categories = [
  {
    name: "Electronics",
    description:
      "Headphones, wearables, and everyday gadgets for work and play.",
  },
  {
    name: "Fashion",
    description: "Apparel and footwear with a clean, modern look.",
  },
  {
    name: "Home & Living",
    description: "Decor and lighting to make living spaces feel finished.",
  },
  {
    name: "Sports & Outdoors",
    description: "Gear for training, running, and staying active.",
  },
  {
    name: "Beauty & Care",
    description: "Skincare and fragrance essentials for a daily routine.",
  },
];

const productsByCategory = {
  Electronics: [
    {
      name: "Noise-Canceling Headphones",
      description:
        "Over-ear wireless headphones with deep bass and all-day comfort.",
      price: 7999,
      images: [
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    {
      name: "Minimal Smart Watch",
      description:
        "A slim smartwatch for workouts, notifications, and sleep tracking.",
      price: 12999,
      images: [
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?auto=format&fit=crop&w=1200&q=80",
      ],
    },
  ],
  Fashion: [
    {
      name: "Classic White Tee",
      description:
        "Soft cotton crew-neck t-shirt with a relaxed everyday fit.",
      price: 1499,
      images: [
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    {
      name: "Retro Running Sneakers",
      description:
        "Lightweight sneakers with a cushioned sole and bold colorway.",
      price: 5499,
      images: [
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=1200&q=80",
      ],
    },
  ],
  "Home & Living": [
    {
      name: "Ceramic Table Vase",
      description:
        "Hand-finished ceramic vase for dried flowers or a standalone accent.",
      price: 2199,
      images: [
        "https://images.unsplash.com/photo-1581783898377-1c85bf937427?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    {
      name: "Warm Glow Table Lamp",
      description:
        "Compact lamp with a soft warm light for desks and nightstands.",
      price: 3299,
      images: [
        "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=1200&q=80",
      ],
    },
  ],
  "Sports & Outdoors": [
    {
      name: "Cushioned Yoga Mat",
      description:
        "Non-slip yoga mat with extra padding for studio and home practice.",
      price: 1899,
      images: [
        "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    {
      name: "Trail Water Bottle",
      description:
        "Insulated stainless steel bottle that keeps drinks cold for hours.",
      price: 999,
      images: [
        "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1523362628745-0c23205cf59b?auto=format&fit=crop&w=1200&q=80",
      ],
    },
  ],
  "Beauty & Care": [
    {
      name: "Daily Skincare Set",
      description:
        "A simple cleanser and moisturizer pair for morning and night.",
      price: 2499,
      images: [
        "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1571781926291-c477ebcc150c?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    {
      name: "Signature Eau de Parfum",
      description:
        "A warm floral fragrance in a glass bottle made for daily wear.",
      price: 4599,
      images: [
        "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=1200&q=80",
      ],
    },
  ],
};

const { data: insertedCategories, error: categoryError } = await supabase
  .from("categories")
  .insert(categories)
  .select();

if (categoryError) {
  console.error(categoryError);
  process.exit(1);
}

const products = insertedCategories.flatMap((category) =>
  productsByCategory[category.name].map((product) => ({
    ...product,
    category_id: category.id,
  }))
);

const { data: insertedProducts, error: productError } = await supabase
  .from("products")
  .insert(products)
  .select("id, name");

if (productError) {
  console.error(productError);
  process.exit(1);
}

console.log(
  `Seeded ${insertedCategories.length} categories and ${insertedProducts.length} products.`
);
