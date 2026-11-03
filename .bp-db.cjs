const fs = require("fs")
const { Client } = require("pg")
const env = {}
for (const l of fs.readFileSync(".env.local.prod", "utf8").split("\n")) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "")
}
const c = new Client({
  host: "aws-0-ap-northeast-1.pooler.supabase.com", port: 5432,
  user: "postgres.ylmfgorryxzpdckkebnr", password: env.SUPABASE_DB_PASSWORD,
  database: "postgres", ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000,
})
;(async () => {
  await c.connect()
  if (process.argv[2] === "write") {
    const sql = fs.readFileSync("supabase/migrations/20261043000000_boarding_pass.sql", "utf8")
    await c.query("begin")
    await c.query(sql)
    await c.query("insert into supabase_migrations.schema_migrations (version,name) values ('20261043000000','boarding_pass') on conflict (version) do nothing")
    await c.query("commit")
    const r = await c.query("select code,name,sort_order,category,tier,is_active,no_photo from web_templates where code='boarding-pass'")
    console.log(JSON.stringify(r.rows, null, 1))
  } else {
    const a = await c.query("select coalesce(max(sort_order),0) m, count(*)::int n from web_templates")
    const b = await c.query("select count(*)::int c from web_templates where code='boarding-pass'")
    const h = await c.query("select coalesce(max(version),'none') v from supabase_migrations.schema_migrations")
    console.log(JSON.stringify({ totals: a.rows[0], exists: b.rows[0].c, topVersion: h.rows[0].v }))
  }
  await c.end()
})().catch((e) => { console.error("FAILED:", e.message); process.exit(1) })
