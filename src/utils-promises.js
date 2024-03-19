import path from 'node:path'
import fs from 'node:fs/promises'

import { previewOfMarkdown } from './content.js'


/**
 * @typedef {import('./type.js').IPost} IPost
 * @typedef {import('./type.js').Context} Context
 * @typedef {import('./type.js').IPostPreview} IPostPreview
 */

/**
 * 
 * @param {string} root
 * @param {(p: string) => void} callback
 */
export async function walk(root, callback) {
    for (let p of await fs.readdir(root)) {
        p = path.join(root, p)
        callback(p)
        if ((await fs.lstat(p)).isDirectory()) await walk(p, callback)
    }
}

/**
 * 
 * @param {string} root 
 * @param {string} f 
 * @returns {string[]}
 */
export function getRelativePathArray(root, f) {
    let p = f
    if (root) {
        let i = root.length
        if (root[root.length - 1] !== '/') i = i + 1
        p = p.slice(i)
    }

    return p.split('/')
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
