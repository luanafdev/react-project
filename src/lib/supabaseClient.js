import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://elifyprnubgsanbedfkw.supabase.co";
// Usando a chave anônima (anon) para operações do lado do cliente
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsaWZ5cHJudWJnc2FuYmVkZmt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMjA1NzIsImV4cCI6MjA3NzU5NjU3Mn0.RMhAAsYaFzaXMFkrL7iYp81xYAdP6k5xzWHCqGiOceg";

export const supabase = createClient(
  supabaseUrl.trim(),
  supabaseAnonKey.trim(),
);
