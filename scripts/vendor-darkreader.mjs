import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const source = await readFile(new URL('node_modules/darkreader/darkreader.js', root), 'utf8');
await mkdir(new URL('src/vendor/', root), { recursive: true });
// The embedded API simulates chrome.runtime messaging. Keep that shim private,
// so it cannot wrap our extension's real sendMessage/onMessage APIs.
await writeFile(new URL('src/vendor/darkreader.js', root),
  `/* Vendored Dark Reader 4.9.133, MIT. See darkreader-LICENSE.txt. */\n` +
  `if (!globalThis.DarkReader) { (() => { const chrome = { runtime: {} };\n${source}\n})(); }\n`);
await copyFile(new URL('node_modules/darkreader/LICENSE', root), new URL('src/vendor/darkreader-LICENSE.txt', root));
