// Re-embeds engine.js, reports.js, deluxe.js and ui-deluxe.js into public/index.html between their markers.
// Run after editing any of them:  node tools/build-page.mjs        (check only:  node tools/build-page.mjs --check)
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), PAGE = path.join(DIR, 'public', 'index.html');
const before = fs.readFileSync(PAGE, 'utf8'); let html = before;
const strip = s => s.replace(/\r\n/g, '\n').split('\n').filter(l => !/^if \(typeof module !== 'undefined'\) module\.exports/.test(l)).join('\n').trimEnd();
// where: a block that does not exist yet goes right after `after` (end of that text) or right before `before`
function put(name, file, where = {}) {
  const src = strip(fs.readFileSync(path.join(DIR, file), 'utf8')), a = `/*<${name}>*/`, b = `/*</${name}>*/`;
  if (!src.startsWith(a) || !src.endsWith(b)) throw new Error(`${file} must start with ${a} and end with ${b}`);
  const i = html.indexOf(a), j = html.indexOf(b);
  if (i >= 0 && j > i) html = html.slice(0, i) + src + html.slice(j + b.length);
  else if (where.after) { const k = html.indexOf(where.after); if (k < 0) throw new Error(`no anchor for ${name}`); const e = k + where.after.length; html = html.slice(0, e) + '\n' + src + html.slice(e); }
  else if (where.before) { const k = html.lastIndexOf(where.before); if (k < 0) throw new Error(`no anchor for ${name}`); html = html.slice(0, k) + src + '\n' + html.slice(k); }
  else throw new Error(`markers for ${name} missing in index.html`);
  console.log(`${name.padEnd(10)} ${String(src.length).padStart(7)} chars  ${file}`);
}
put('ENGINE', 'engine.js');
put('REPORTS', 'reports.js');
put('DELUXE', 'deluxe.js', { after: '/*</REPORTS>*/' });
put('DELUXE-UI', 'ui-deluxe.js', { before: "applyLook(); showView(pref.get('view', 'TODAY'));" });
if (process.argv.includes('--check')) { console.log(html === before ? 'index.html is up to date' : 'index.html would change'); process.exit(html === before ? 0 : 1); }
fs.writeFileSync(PAGE, html); console.log(`index.html ${html === before ? 'unchanged' : 'written'} (${html.length} chars)`);
