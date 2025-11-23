import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from './types';
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://aidftnnusaeckhfambep.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpZGZ0bm51c2FlY2toZmFtYmVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MTI4NTAsImV4cCI6MjA3OTQ4ODg1MH0.h36eId0EW49Z8zz3CNsE_bTwW1pdS98jf0KD2oQRqDU";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
