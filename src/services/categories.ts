import { supabaseConfig } from "@/config/supabase-client-config";
import { ICategory } from "@/interfaces";

// Create a new category
export async function addCategory(payload: Pick<ICategory, "name" | "description">) {
  const supabase = supabaseConfig();
  const { data, error } = await supabase
    .from("categories")
    .insert({
      name: payload.name,
      description: payload.description,
    })
    .select()
    .single();
  if (error) throw error;
  return data as ICategory;
}

// Update an existing category by id
export async function editCategoryById(
  id: string,
  payload: Partial<Pick<ICategory, "name" | "description">>
) {
  const supabase = supabaseConfig();
  const { data, error } = await supabase
    .from("categories")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as ICategory;
}

// Get all categories
export async function getAllCategories() {
  const supabase = supabaseConfig();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ICategory[];
}

// Delete a category by id
export async function deleteCategory(id: string) {
  const supabase = supabaseConfig();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}
