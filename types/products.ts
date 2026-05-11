import type { Database } from "@/types/supabase";

export type ProductRow = Database["public"]["Tables"]["products"]["Row"];
