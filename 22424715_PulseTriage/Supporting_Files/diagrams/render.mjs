/**
 * Renders every .mmd file in this folder to a PNG under docs/images/ using the
 * public mermaid.ink service, and writes docs/diagrams/diagram-links.md holding
 * an editable mermaid.live link for each diagram.
 *
 * Usage:  node docs/diagrams/render.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const imagesDir = path.resolve(here, '..', 'images');
fs.mkdirSync(imagesDir, { recursive: true });

const encode = (code) => {
  const state = JSON.stringify({ code, mermaid: { theme: 'default' } });
  return zlib
    .deflateSync(Buffer.from(state, 'utf8'), { level: 9 })
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

const files = fs.readdirSync(here).filter((f) => f.endsWith('.mmd')).sort();
const rows = [];

for (const file of files) {
  const code = fs.readFileSync(path.join(here, file), 'utf8');
  const pako = encode(code);
  const imgUrl = `https://mermaid.ink/img/pako:${pako}?type=png&bgColor=FFFFFF&width=1800`;
  const editUrl = `https://mermaid.live/edit#pako:${pako}`;
  const out = path.join(imagesDir, file.replace(/\.mmd$/, '.png'));

  let status = 'FAILED';
  try {
    const res = await fetch(imgUrl);
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(out, buf);
      status = `OK (${(buf.length / 1024).toFixed(1)} KB)`;
    } else {
      status = `HTTP ${res.status}`;
    }
  } catch (err) {
    status = `ERROR ${err.message}`;
  }

  console.log(`${file.padEnd(34)} ${status}`);
  rows.push({ file, editUrl, imgUrl, png: path.relative(path.resolve(here, '..'), out).replace(/\\/g, '/') });
}

const md = [
  '# Diagram Source Links',
  '',
  'Each diagram in this project is authored as Mermaid source (`docs/diagrams/*.mmd`) and',
  'rendered to PNG (`docs/images/*.png`). Use the **Edit / re-render** link to open the',
  'diagram in the Mermaid Live Editor, where it can be modified and exported as PNG or SVG.',
  '',
  '| Diagram source | Rendered image | Edit / re-render link |',
  '| :--- | :--- | :--- |',
  ...rows.map((r) => `| \`${r.file}\` | \`${r.png}\` | [Open in Mermaid Live Editor](${r.editUrl}) |`),
  '',
  '## Direct PNG URLs (mermaid.ink)',
  '',
  ...rows.flatMap((r) => [`- **${r.file}**`, `  <${r.imgUrl}>`, '']),
].join('\n');

fs.writeFileSync(path.join(here, 'diagram-links.md'), md, 'utf8');
console.log('\nWrote docs/diagrams/diagram-links.md');
