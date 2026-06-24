import type { Database } from "@/types/supabase";
export type InventoryItem = Database["public"]["Tables"]["products"]["Row"];
