const sharp = require('sharp')
const fs = require('fs')
const path = require('path')
const OUT = '/Users/delanataliamalau/development/Wedding Experience/public/templates/traditional-bugis-pinishi'
const missing = [
 ["bngquote.png","decor-bngquote.webp"],
 ["63TIDWPLG3LuhndehEdlb3__bungaQuote3.png","decor-bunga-quote-3.webp"],
 ["4rdE6fFTQbzc5lkyFz0IeU__puunbugis.png","decor-puunbugis.webp"],
 ["IMG_0543.png","decor-ship.webp"],
 ["IMG_0551.png","decor-img-0551.webp"],
 ["IMG_0631.PNG","decor-rundown-frame.webp"],
 ["IMG_0651.png","decor-img-0651.webp"],
 ["IMG_0652.png","decor-img-0652.webp"],
 ["IMG_0692.png","decor-img-0692.webp"],
 ["merak.png","decor-merak.webp"],
 ["mitos__1I400___1600_px___1080___1900_px___1_.png","decor-mitos-1.webp"],
 ["mitos__1I400___1600_px___1080___1900_px___2_.png","decor-mitos-2.webp"],
 ["mitos__1I400___1600_px___1080___1900_px___3_.png","decor-mitos-3.webp"],
 ["mitos__1I400___1600_px___1080___1900_px___47_.png","decor-mitos-4.webp"],
 ["gll1.png","decor-gll-1.webp"],
 ["gll2.png","decor-gll-2.webp"],
 ["gll3.png","decor-gll-3.webp"],
 ["rundown1.png","decor-rundown-1.webp"],
 ["rundown2.png","decor-rundown-2.webp"],
 ["rundown3.png","decor-rundown-3.webp"],
 ["rundown4.png","decor-rundown-4.webp"],
 ["rundown5.png","decor-rundown-5.webp"],
 ["dup1.png","decor-dup-1.webp"],
 ["dup2.png","decor-dup-2.webp"],
 ["dfafda.png","decor-dfafda.webp"],
 ["dsdasfdas.png","decor-dsdasfdas.webp"],
 ["Untitled__13__2.png","decor-untitled-13-2.webp"],
 ["bngarsvp1.png","decor-bngarsvp-1.webp"],
 ["bngarsvp3.png","decor-bngarsvp-3.webp"],
 ["bnggg.png","decor-bnggg.webp"],
 ["fdsfsd.png","decor-fdsfsd.webp"],
]
async function main() {
  for (const [src,dest] of missing) {
    const out = path.join(OUT, dest)
    if (fs.existsSync(out)) { console.log('skip', dest); continue }
    const tmp = '/tmp/' + src
    if (!fs.existsSync(tmp)) { console.log('MISSING TMP', src); continue }
    const meta = await sharp(tmp).metadata()
    const w = Math.min(600, meta.width)
    const info = await sharp(tmp).resize({ width: w }).webp({ quality: 84 }).toFile(out)
    console.log(dest, info.width + 'x' + info.height, Math.round(info.size/1024) + 'KB')
  }
}
main().catch(e => { console.error(e); process.exit(1) })
