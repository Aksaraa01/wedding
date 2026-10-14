async function check() {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const H = {apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, Authorization: 'Bearer ' + process.env.SUPABASE_SERVICE_ROLE_KEY};
  const res = await fetch(base + '/rest/v1/wedding_profiles?select=slug,city,province,estimated_wedding_date&limit=50', {headers: H});
  console.log('status:', res.status);
  const text = await res.text();
  console.log('raw:', text.slice(0, 500));
  const rows = JSON.parse(text);
  console.log('profiles:', rows?.length || 0);
  if (Array.isArray(rows)) {
    rows.forEach(r => console.log(r.slug, r.city, r.province, r.estimated_wedding_date));
    const cities = new Set();
    rows.forEach(r => { if (r.city) cities.add(r.city.trim()); });
    console.log('unique cities:', Array.from(cities).sort());
  }
}
check();