import { supabaseConfig } from "@/config/supabase-client-config";
import { IProduct } from "@/interfaces";

type ProductWritableFields = Pick<
  IProduct,
  "name" | "description" | "price" | "category_id" | "images"
>;

// Create a new product
export async function addProduct(payload: ProductWritableFields) {
  const supabase = supabaseConfig();
  const { data, error } = await supabase
    .from("products")
    .insert({
      name: payload.name,
      description: payload.description,
      price: payload.price,
      category_id: payload.category_id,
      images: payload.images,
    })
    .select()
    .single();
  if (error) throw error;
  return data as IProduct;
}

// Update an existing product by id
export async function editProductById(
  id: string,
  payload: Partial<ProductWritableFields>
) {
  const supabase = supabaseConfig();
  const { data, error } = await supabase
    .from("products")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as IProduct;
}

// Get all products
export async function getAllProducts() {
  const supabase = supabaseConfig();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as IProduct[];
}

export async function getProductById(id: string) {
  const supabase = supabaseConfig();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as IProduct;
}

// Delete a product by id
export async function deleteProduct(id: string) {
  const supabase = supabaseConfig();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}

export type ProductSort = "name_asc" | "price_asc" | "price_desc"

export type ProductListFilters = {
  categoryId?: string
  search?: string
  sort?: ProductSort
}

export async function getAllProductsWithFilters(
  filters: ProductListFilters = {}
) {
  const supabase = supabaseConfig()
  let query = supabase.from("products").select("*")

  if (filters.categoryId) {
    query = query.eq("category_id", filters.categoryId)
  }

  const search = filters.search?.trim()
  if (search) {
    query = query.ilike("name", `%${search}%`)
  }

  switch (filters.sort) {
    case "price_asc":
      query = query.order("price", { ascending: true })
      break
    case "price_desc":
      query = query.order("price", { ascending: false })
      break
    case "name_asc":
    default:
      query = query.order("name", { ascending: true })
      break
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as IProduct[]
}
