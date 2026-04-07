import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://gfabtjqlagpucmbkvryf.supabase.co'
const SUPABASE_KEY = 'sb_publishable_5i0gB88MxfUoatx-iCg9og_qITCE2Ie'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

export async function fetchUserData(accessCode) {
  const { data, error } = await supabase
    .from('user_data')
    .select('data')
    .eq('access_code', accessCode)
    .single()
  if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows found
  return data?.data || null
}

export async function saveUserData(accessCode, payload) {
  const { error } = await supabase
    .from('user_data')
    .upsert({ access_code: accessCode, data: payload, updated_at: new Date().toISOString() })
  if (error) throw error
}
