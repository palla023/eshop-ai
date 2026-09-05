import { supabaseConfig } from "@/config/supabase-client-config";

export async function uploadFileAndReturnUrl(file: File) {
  const supabase = supabaseConfig();
  const filePath = `${Date.now()}-${file.name}`;

  const { data, error } = await supabase.storage
    .from("main")
    .upload(filePath, file);

  if (error) throw error;

  const { data: publicUrlData } = supabase.storage
    .from("main")
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl;
}
