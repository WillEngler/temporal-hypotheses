import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';

const supabase = createClient(env.supabase.url, env.supabase.anonKey);

export default supabase; 