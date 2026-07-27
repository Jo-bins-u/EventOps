const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const useSupabase = 
  supabaseUrl && 
  supabaseUrl !== 'your_supabase_url' &&
  supabaseKey &&
  supabaseKey !== 'your_supabase_key';

const supabase = useSupabase ? createClient(supabaseUrl, supabaseKey) : null;

module.exports = { supabase, useSupabase };
