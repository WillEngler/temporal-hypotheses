interface EnvironmentConfig {
  supabase: {
    url: string;
    anonKey: string;
  };
}

function getEnvironmentConfig(): EnvironmentConfig {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error('VITE_SUPABASE_URL is not defined in environment variables');
  }

  if (!supabaseAnonKey) {
    throw new Error('VITE_SUPABASE_ANON_KEY is not defined in environment variables');
  }

  return {
    supabase: {
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
    },
  };
}

export const env = getEnvironmentConfig(); 