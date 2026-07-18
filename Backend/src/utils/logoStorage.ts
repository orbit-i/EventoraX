import { supabase } from "./supabase";

const BUCKET = "org-logos";

export async function uploadOrgLogo(orgId: string, file: Express.Multer.File): Promise<string> {
  const ext = file.originalname.split(".").pop();
  const filePath = `${orgId}/logo.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}