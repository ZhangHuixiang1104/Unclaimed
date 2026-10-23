// Rebuild PNG artwork from the project's original layers, without changing hit areas.
// Requires sharp; run from the repository root with node scripts/render-object-art.cjs.
const fs = require('node:fs')
const path = require('node:path')
const sharp = require('sharp')
const layers = require('./object-art-layers.json')
const root = path.resolve(__dirname, '..')
const output = path.join(root, 'frontend/src/assets/objects')
fs.mkdirSync(output, { recursive: true })
const uri = file => `data:image/${file.endsWith('.svg') ? 'svg+xml' : 'png'};base64,${fs.readFileSync(path.join(root, file)).toString('base64')}`
const image = (href, attrs = '') => `<image href="${href}" ${attrs}/>`
const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`
const render = async (name, markup) => {
  const buffer = await sharp(Buffer.from(markup)).png().toBuffer()
  await fs.promises.writeFile(path.join(output, name + '.png'), buffer)
  return buffer
}
const thumbnail = async (name, buffer) => sharp(buffer).trim().resize({ width: 1000, height: 800, fit: 'inside', withoutEnlargement: true }).png().toFile(path.join(output, name + '.png'))

async function main() {
  const list = layers.list
  for (const side of ['front', 'back']) {
    const ink = list[side + 'Ink'].map(i => image(uri(list.files[i.src]), `x="${i.x}" y="${i.y}" width="${i.width}" height="${i.height}"`)).join('')
    const marks = side === 'front'
      ? '<path d="M257 292 H1158 M457 879 H800" fill="none" stroke="#493c2b" stroke-opacity=".58" stroke-width="2"/><g fill="none" stroke="#493b2f" stroke-width="4"><rect x="1095" y="360" width="54" height="54"/><rect x="1095" y="485" width="54" height="54"/><path d="M1095 625 H1112 M1133 625 H1149 V679 H1095 V625"/></g><g fill="#493b2f"><circle cx="1122" cy="387" r="6"/><circle cx="1122" cy="512" r="6"/></g>'
      : '<path d="M257 288 H1158 M257 638 H1158" fill="none" stroke="#493c2b" stroke-opacity=".58" stroke-width="2"/><g fill="none" stroke="#493b2f" stroke-width="4"><path d="M255 379 H272 M293 379 H309 V433 H255 V379"/><rect x="255" y="495" width="54" height="54"/></g><circle cx="282" cy="522" r="6" fill="#493b2f"/>'
    const paper = image(uri(list.files[side + 'Paper']), `width="1448" height="1086" ${side === 'back' ? 'transform="translate(1448 0) scale(-1 1)"' : ''}`)
    const buffer = await render(`list-${side}`, svg(1448, 1086, `<defs><clipPath id="clip"><path d="${list.clip}"/></clipPath><mask id="missing">${list.mask}</mask></defs><g clip-path="url(#clip)" mask="url(#missing)">${paper}${ink}${marks}</g>`))
    if (side === 'front') await thumbnail('preview-list', buffer)
  }
  const map = layers.map
  const full = key => image(uri(map.files[key]), 'width="1600" height="1000"')
  const ink = side => map[side + 'Ink'].map(i => `<svg x="${i.x}" y="${i.y}" width="${i.w}" height="${i.h}" viewBox="${i.crop}">${image(uri(map.files[i.src]), `width="${i.iw || 2172}" height="${i.ih || 724}"`)}</svg>`).join('')
  for (let phase = 1; phase <= 4; phase++) {
    const routes = ['routeA', 'routeB', 'routeC', 'routeD'].slice(0, phase).map(full).join('')
    const buffer = await render(`map-front-${phase}`, svg(1600, 1000, `<defs><clipPath id="clip"><path d="${map.clip}"/></clipPath></defs><g clip-path="url(#clip)">${full('frontPaper')}${full('terrain')}${routes}${ink('front')}</g>${full('fold')}`))
    if (phase === 4) await thumbnail('preview-map', buffer)
  }
  await render('map-back', svg(1600, 1000, `<defs><clipPath id="clip"><path d="${map.clip}"/></clipPath></defs><g clip-path="url(#clip)">${full('backPaper')}<g fill="none" stroke-width="7" opacity=".72"><path d="M174 323 h28" stroke="#68665d"/><path d="M174 448 h28" stroke="#8a7962"/><path d="M174 573 h28" stroke="#9c5946"/><path d="M174 698 h28" stroke="#3b3831"/></g>${ink('back')}</g>${full('fold')}`))
  await sharp(path.join(root, map.files.rulerImage)).png().toFile(path.join(output, 'map-ruler.png'))
  const art = (chapter, file) => uri(`stuffs/${chapter}/美术母版/${file}.png`)
  const battery = await sharp(Buffer.from(svg(1600, 1000,
    image(art('电池盒', 'battery_box_closed_blank'), 'width="1600" height="1000"') +
    image(art('电池盒', 'battery_old_band'), 'x="304" y="180" width="736" height="630" transform="rotate(-7 672 495)"') +
    image(art('电池盒', 'battery_dry_liner'), 'x="656" y="250" width="512" height="520" opacity=".89" transform="rotate(-7 912 510)"') +
    image(art('电池盒', 'battery_outer_band'), 'x="432" y="180" width="912" height="650" transform="rotate(-1 1234 700)"')))).png().toBuffer()
  await thumbnail('preview-battery', battery)
  const shoes = await sharp(Buffer.from(svg(1200, 1000,
    image(art('草鞋', 'shoe_large_top'), 'x="70" y="40" width="540" height="900" transform="rotate(-8 340 490)"') +
    image(art('草鞋', 'shoe_small_top'), 'x="650" y="140" width="440" height="740" transform="rotate(8 870 510)"')))).png().toBuffer()
  await thumbnail('preview-shoes', shoes)
  await thumbnail('preview-bowl', fs.readFileSync(path.join(root, 'stuffs/饭碗/美术母版/bowl_oblique_blank.png')))
  console.log('Rendered 13 PNGs, including five consistently cropped chapter previews.')
}
main().catch(error => { console.error(error); process.exitCode = 1 })
