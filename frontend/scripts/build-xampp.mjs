/**
 * Build the site straight into XAMPP's htdocs so it opens at
 * http://localhost/<folder>/ in a browser, with no dev server running.
 *
 *   npm run build:xampp              -> http://localhost/gurukela/
 *   npm run build:xampp -- my-folder -> http://localhost/my-folder/
 *
 * Two things differ from the production build:
 *   - `base` is the sub-folder, so asset URLs resolve under it rather than at
 *     the domain root (and main.jsx feeds the same value to the router).
 *   - the SPA fallback .htaccess is rewritten for that sub-folder, so a deep
 *     link like /gurukela/lecturers still serves index.html on refresh.
 *
 * The script refuses to write into a folder that already holds another site.
 */

import { build } from 'vite'
import { existsSync, readdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const HTDOCS = 'C:/xampp/htdocs'
const folder = (process.argv[2] || 'gurukela').replace(/^[/\\]+|[/\\]+$/g, '')
const outDir = resolve(HTDOCS, folder)
const base = `/${folder}/`

/** A folder we did not build is somebody else's site — never overwrite it. */
function assertSafe() {
  if (!existsSync(outDir)) return
  const entries = readdirSync(outDir)
  if (entries.length === 0) return
  const ours = entries.includes('.gurukela-build')
  if (!ours) {
    console.error(
      `\nRefusing to write to ${outDir}\n` +
        `It already contains: ${entries.slice(0, 8).join(', ')}${entries.length > 8 ? ', …' : ''}\n` +
        `That is not a build this script made. Pick another folder:\n` +
        `  npm run build:xampp -- some-other-folder\n`
    )
    process.exit(1)
  }
}

const htaccess = `# SPA fallback for a build served from ${base}
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase ${base}
  RewriteRule ^index\\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . ${base}index.html [L]
</IfModule>

<IfModule mod_headers.c>
  <FilesMatch "\\.(js|css|woff2?|png|jpg|jpeg|svg|gif|ico)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
  <FilesMatch "index\\.html$">
    Header set Cache-Control "no-cache, no-store, must-revalidate"
  </FilesMatch>
</IfModule>
`

assertSafe()

await build({ base, build: { outDir, emptyOutDir: true } })

writeFileSync(join(outDir, '.htaccess'), htaccess)
writeFileSync(join(outDir, '.gurukela-build'), 'Written by frontend/scripts/build-xampp.mjs — safe to overwrite.\n')

console.log(`\n  Built to  ${outDir}`)
console.log(`  Open      http://localhost/${folder}/\n`)
