// Resolver khusus test: Node ESM mewajibkan ekstensi, sedangkan kode app
// memakai import tanpa ekstensi (gaya bundler Next). Hook ini menambahkan
// `.ts` hanya ketika file-nya benar-benar ada.
import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith(".") && !/\.[a-z0-9]+$/i.test(specifier) && context.parentURL) {
    try {
      const candidate = new URL(`${specifier}.ts`, context.parentURL)
      if (existsSync(fileURLToPath(candidate))) {
        return nextResolve(`${specifier}.ts`, context)
      }
    } catch {
      // jatuh ke resolver default
    }
  }
  return nextResolve(specifier, context)
}
