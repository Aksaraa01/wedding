export function slugifyName(name: string): string {
  return (name || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function slugifyCouple(name1: string, name2: string): string {
  const a = slugifyName(name1)
  const b = slugifyName(name2)
  return a && b ? `${a}-${b}` : a || b
}
