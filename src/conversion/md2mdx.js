import fs from 'node:fs'

import crypto from 'node:crypto'
import { createRequire } from 'node:module'

import { resolveDate, parseContent } from '../utils.js'
import { renderPostMeta } from '../ui.js'

const require = createRequire(import.meta.url)
const pkg = require('../../package.json')

const algorithm = 'md5'

/**
 * @typedef {import('../type.js').IPost} IPost
 */

/**
 *
 * @param {string} p
 */
export function md2mdx(p) {
    const markdown = fs.readFileSync(p, 'utf-8')

    const { title, description, content, ...metadata } = parseContent(markdown, p)

    const postDate = metadata.created || new Date().toISOString().split('T')[0];
    const postModifyDate = metadata.modified || new Date().toISOString().split('T')[0];
    const postAuthor = metadata.author || pkg.author.name;
    const postTags = metadata.tags || [];

    const hash = crypto.createHash(algorithm);
    const id = hash.update(markdown, 'utf-8').digest('hex')
    const created = new Date(resolveDate(postDate)).getTime()
    const updated = new Date(resolveDate(postModifyDate)).getTime()

    const meta = renderPostMeta({
        title,
        description,
        created,
        updated,
        author: postAuthor,
        tags: postTags,
    })

    return {
        id,
        title,
        description,
        created,
        updated,
        content: meta + content,
        author: postAuthor,
        tags: postTags,
        related: [],
        category: [],
    }
}