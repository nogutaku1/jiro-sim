// ===== SUPABASE CLIENT =====
const SUPABASE_URL = 'https://llzojjyykppftzmazqav.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_-fffb5ysF_a0t8B1-PtZwg_YXbry4DK';

export async function supabasePost(table, data) {
  try {
    const res = await fetch(SUPABASE_URL + '/rest/v1/' + table, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(data)
    });
    return res.ok;
  } catch(e) { return null; }
}

export async function supabaseGet(table, query) {
  try {
    const res = await fetch(SUPABASE_URL + '/rest/v1/' + table + '?' + query, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
      }
    });
    if (!res.ok) return [];
    return await res.json();
  } catch(e) { return []; }
}
