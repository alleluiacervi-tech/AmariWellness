#!/usr/bin/env node
/**
 * Pushes the working tree to GitHub through the Git Data API.
 *
 * This exists because this machine has no working git (no Xcode Command Line
 * Tools). Once `xcode-select --install` has been run, use git directly and
 * delete this file.
 *
 *   node scripts/push.mjs "commit message"
 *
 * The token is read from the macOS Keychain, never from a file:
 *   security add-generic-password -a "$USER" -s amari-github-pat -w '<token>' -U
 */

import { readFile, readdir } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { join, relative, sep, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const OWNER = 'alleluiacervi-tech'
const REPO = 'AmariWellness'
const BRANCH = 'main'
const KEYCHAIN_SERVICE = 'amari-github-pat'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

const SKIP_DIRS = new Set(['node_modules', '.git', '.next', 'logs', '.vite', 'dist', 'build', '.claude'])
const SKIP_FILES = new Set(['.DS_Store'])

function token() {
  if (process.env.GH_TOKEN) return process.env.GH_TOKEN
  try {
    return execFileSync(
      'security',
      ['find-generic-password', '-a', process.env.USER, '-s', KEYCHAIN_SERVICE, '-w'],
      { encoding: 'utf8' },
    ).trim()
  } catch {
    console.error(
      `No token. Either set GH_TOKEN, or store one:\n` +
        `  security add-generic-password -a "$USER" -s ${KEYCHAIN_SERVICE} -w '<token>' -U`,
    )
    process.exit(1)
  }
}

const TOKEN = token()

async function api(path, opts = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  })
  const body = await res.text()
  if (!res.ok) throw new Error(`${opts.method || 'GET'} ${path} → ${res.status}\n${body}`)
  return body ? JSON.parse(body) : null
}

async function walk(dir, acc = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue
      await walk(join(dir, entry.name), acc)
    } else if (entry.isFile()) {
      if (SKIP_FILES.has(entry.name) || entry.name.endsWith('.log')) continue
      acc.push(join(dir, entry.name))
    }
  }
  return acc
}

const message = process.argv[2]
if (!message) {
  console.error('Usage: node scripts/push.mjs "commit message"')
  process.exit(1)
}

let parents = []
try {
  const ref = await api(`/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`)
  parents = [ref.object.sha]
} catch {
  console.log(`no ${BRANCH} ref — creating it`)
}

const files = await walk(ROOT)
console.log(`uploading ${files.length} files…`)

const tree = []
for (const abs of files) {
  const path = relative(ROOT, abs).split(sep).join('/')
  const blob = await api(`/repos/${OWNER}/${REPO}/git/blobs`, {
    method: 'POST',
    body: JSON.stringify({
      content: (await readFile(abs)).toString('base64'),
      encoding: 'base64',
    }),
  })
  tree.push({ path, mode: '100644', type: 'blob', sha: blob.sha })
  process.stdout.write('.')
}
console.log('')

const newTree = await api(`/repos/${OWNER}/${REPO}/git/trees`, {
  method: 'POST',
  body: JSON.stringify({ tree }),
})

if (parents.length) {
  const head = await api(`/repos/${OWNER}/${REPO}/git/commits/${parents[0]}`)
  if (head.tree.sha === newTree.sha) {
    console.log('nothing changed since last push')
    process.exit(0)
  }
}

const commit = await api(`/repos/${OWNER}/${REPO}/git/commits`, {
  method: 'POST',
  body: JSON.stringify({ message, tree: newTree.sha, parents }),
})

await api(
  parents.length
    ? `/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`
    : `/repos/${OWNER}/${REPO}/git/refs`,
  {
    method: parents.length ? 'PATCH' : 'POST',
    body: JSON.stringify(
      parents.length ? { sha: commit.sha } : { ref: `refs/heads/${BRANCH}`, sha: commit.sha },
    ),
  },
)

console.log(`\n✔ ${tree.length} files → ${commit.sha.slice(0, 7)}`)
console.log(`  https://github.com/${OWNER}/${REPO}/tree/${BRANCH}`)
