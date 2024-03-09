import fs from 'node:fs'
import path from 'node:path'

import { previewOfMarkdown } from './content.js'

/**
 * @typedef {import('./content.js').IPost} IPost
 * @typedef {import('./content.js').IPostPreview} IPostPreview
 */

/**
 * 
 * @param {string} dir output path
 * @param {unknown} data 
 */
export function write(dir, data) {
    if (!fs.existsSync(path.dirname(dir))) fs.mkdirSync(path.dirname(dir), { recursive: true });

    console.log('write file into:', dir);
    fs.writeFileSync(dir, JSON.stringify(data, null, 2));
}

/**
 * simplify post date for preview
 * @param {IPost} post 
 * @returns {IPostPreview}
 */
export function preview(post) {
    return {
        id: post.id,
        title: post.title,
        date: post.date,
        author: post.author,
        tags: post.tags,
        content: previewOfMarkdown(post.content),
    }
}