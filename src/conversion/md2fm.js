import { parseContent } from "../utils.js"

import fs from 'node:fs'

/**
 * @typedef {import('../type.js').IPost} IPost
 */

/**
 * Convert markdown to front matter
 * @param {string} p
 * @returns {string}
 */
export function md2fm(p) {
    const markdown = fs.readFileSync(p, 'utf-8')

    const { title, description, content, ...metadata } = parseContent(markdown, p)

    // wrap title and description into metadata
    const meta = {
        title,
        description,
        ...metadata
    }

    // convert metadata to front matter, delimiter is ---
    const fm = Object.entries(meta)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n')

    // add front matter to content
    const newContent = `---
${fm}
---

${content}`

    return newContent
}