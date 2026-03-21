import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase URL or Anon Key is missing. Check your environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function createUserProfileIfNotExists(data: {
  id: string;
  email: string;
  name: string;
  avatar_url: string;
  oauth_provider: string;
}) {
  if (!supabaseUrl) return; // fail gracefully during local testing without keys

  try {
    const { data: existing, error: checkError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', data.id)
      .single();

    if (!existing) {
      const { error: insertError } = await supabase.from('user_profiles').insert({
        id: data.id,
        display_name: data.name,
        avatar_url: data.avatar_url,
        oauth_provider: data.oauth_provider,
        interests: [], 
        dislikes: [],
        weather_preference: 'any',
        min_temp_comfort: 10,
      });
      
      if (insertError) {
        console.error("Failed to extract user profile:", insertError);
      }
    }
  } catch (err) {
    console.error("Error creating user profile:", err);
  }
}
