# Dark Reader

Vendored from the official npm package `darkreader@4.9.133` (MIT).
Source: https://github.com/darkreader/darkreader
License: `darkreader-LICENSE.txt`.

Run `npm ci` and `npm run vendor` to reproduce `darkreader.js` from the pinned
package. The wrapper keeps the embedded API's simulated `chrome.runtime`
private and guards repeated injection. The upstream implementation is intact.
All executable code ships locally; no scripts are loaded from a CDN.
