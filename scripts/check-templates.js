async function check() {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const H = {apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, Authorization: 'Bearer ' + process.env.SUPABASE_SERVICE_ROLE_KEY};
  const res = await fetch(base + '/rest/v1/web_templates?select=id,code,name,category,tier,preview_image_url&is_active=eq.true', {headers: H});
  const rows = await res.json();
  const cats = {};
  rows.forEach(r => { const c = (r.category || '').trim() || 'Lainnya'; cats[c] = (cats[c] || 0) + 1; });
  console.log('categories:', JSON.stringify(cats, null, 1));
  const adat = rows.filter(r => (r.category || '').toLowerCase().includes('adat'));
  console.log('adat count:', adat.length);
  const uniq = Array.from(new Set(adat.map(r => (r.category || '').trim())));
  console.log('unique adat cats:', uniq);
  console.log('sample codes:', rows.slice(0, 5).map(r => r.code));
}
check();