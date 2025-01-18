import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { createRequire } from 'node:module'

import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'


import { resolveDate } from './utils.js'
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

/**
 * if no h1 heading, use the filename
 * @param {string} markdown 
 * @param {string} p
 */
export function splitContent(markdown, p) {
    const processor = unified()
        .use(remarkParse)
        .use(remarkStringify)

    const ast = processor.parse(markdown)

    // title extract from first h1, otherwise use the filename
    let title = '';
    let description = '';
    let date = '';

    const h1s = ast.children.filter(node => node.type === 'heading' && node.depth === 1)
    while (!title && h1s.length) {
        const h1 = h1s.shift()
        if (h1 && 'children' in h1 && h1.children?.[0]?.type === 'text') {
            title = h1?.children?.[0].value
            // remove h1 node in first line
            const idx = ast.children.findIndex(node => Object.is(node, h1))

            if (idx !== -1) {
                // treat the first blockquote behind h1 as description 
                const blockquote = ast.children[idx + 1]
                if (blockquote?.type === 'blockquote' && blockquote.children?.[0]?.type === 'paragraph') {
                    const paragraph = blockquote?.children?.[0]
                    if (paragraph?.children?.[0]?.type === 'text') {
                        description = paragraph?.children?.[0]?.value
                        ast.children.splice(idx, 2)
                    } else ast.children.splice(idx, 1)
                } else ast.children.splice(idx, 1)
            }
        }
    }

    const comments = ast.children.filter(node => node.type === 'html')
    while (comments.length) {
        const comment = comments.pop()
        let html = comment?.value?.trim?.()
        if (html && html.startsWith('<!--') && html.endsWith('-->')) {
            html = html.substring(4, html.length - 3)
            date = html

            // remove comment node
            const idx = ast.children.findIndex(node => Object.is(node, comment))
            if (idx !== -1) ast.children.splice(idx, 1)
        }
    }

    if (!title) title = path.basename(p).split('.md')[0]
    const content = processor.stringify(ast)
    return { title, description, date, content }
}
