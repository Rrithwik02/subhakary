import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { isApprovedMediaUrl, safeMediaUrls } from "./security.ts";

Deno.test("media URLs require HTTPS and the configured Supabase host", () => {
  Deno.env.set("SUPABASE_URL", "https://project.supabase.co");
  Deno.env.delete("WHATSAPP_ALLOWED_MEDIA_HOSTS");

  assert(isApprovedMediaUrl("https://project.supabase.co/storage/v1/object/public/portfolio/image.jpg"));
  assert(!isApprovedMediaUrl("http://project.supabase.co/storage/v1/object/public/portfolio/image.jpg"));
  assert(!isApprovedMediaUrl("https://example.com/image.jpg"));
  assertEquals(safeMediaUrls([
    "https://example.com/image.jpg",
    "https://project.supabase.co/image.jpg",
  ]), ["https://project.supabase.co/image.jpg"]);
});
