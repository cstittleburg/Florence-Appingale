/**
 * GitHub-based data persistence.
 * Reads/writes a single JSON file in the repo to sync across devices.
 */

const REPO = 'cstittleburg/Florence-Appingale'
const FILE_PATH = 'data/user-data.json'
const BRANCH = 'main'
const TOKEN = import.meta.env.VITE_GITHUB_TOKEN

const API = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`

const headers = {
  Authorization: `token ${TOKEN}`,
  Accept: 'application/vnd.github.v3+json',
}

/**
 * Load user data from GitHub. Returns null if file doesn't exist yet.
 */
export async function loadData() {
  try {
    const res = await fetch(`${API}?ref=${BRANCH}&t=${Date.now()}`, { headers })
    if (res.status === 404) return { data: null, sha: null }
    if (!res.ok) throw new Error(`GitHub API error ${res.status}`)
    const json = await res.json()
    const content = JSON.parse(atob(json.content))
    return { data: content, sha: json.sha }
  } catch (err) {
    console.error('Failed to load from GitHub:', err)
    return { data: null, sha: null }
  }
}

/**
 * Save user data to GitHub. Creates or updates the file.
 * `sha` is required for updates (prevents conflicts).
 */
export async function saveData(data, sha) {
  try {
    const body = {
      message: `Update user data — ${new Date().toISOString()}`,
      content: btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2)))),
      branch: BRANCH,
    }
    if (sha) body.sha = sha

    const res = await fetch(API, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || `GitHub API error ${res.status}`)
    }
    const json = await res.json()
    return json.content.sha // new sha for next update
  } catch (err) {
    console.error('Failed to save to GitHub:', err)
    throw err
  }
}
