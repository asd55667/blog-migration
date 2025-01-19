import fs from 'node:fs'

import crypto from 'node:crypto'
import { createRequire } from 'node:module'

import { resolveDate, splitContent } from './utils.js'
import { renderPostMeta } from './ui.js'

const require = createRequire(import.meta.url)
const pkg = require('../package.json')

const algorithm = 'md5'

/**
 * @typedef {import('./type.js').IPost} IPost
 */

/**
 * 
 * @param {string} p path
 * @returns {IPost}
 */
export function md2mdx(p) {
    const markdown = fs.readFileSync(p, 'utf-8')

    const { title, description, date, content } = splitContent(markdown, p)

    const hash = crypto.createHash(algorithm);
    const id = hash.update(markdown, 'utf-8').digest('hex')
    const created = new Date(resolveDate(date)).getTime()
    const updated = new Date(resolveDate(date)).getTime()

    const meta = renderPostMeta({
        title,
        description,
        created
    })

    const mdx = {
        id,
        title,
        description,
        created,
        updated,
        content: meta + content,
        author: pkg.author.name,
        tags: [],
        related: [],
        category: [],
    }
    return mdx
}

