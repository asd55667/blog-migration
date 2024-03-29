import fs from 'node:fs'
import path from 'node:path'

import { previewOfMarkdown } from './content.js'

/**
 * @typedef {import('./type.js').IPost} IPost
 * @typedef {import('./type.js').IPostPreview} IPostPreview
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
        created: post.created,
        author: post.author,
        tags: post.tags,
        content: previewOfMarkdown(post.content),
    }
}

/**
 * 
 * @param {string} dir 
 * @returns {number}
 */
export function sumMarkdowns(dir) {
    const files = fs.readdirSync(dir)
    let n = files.filter(f => f.endsWith('md')).length

    const subDirs = files.filter(f => fs.lstatSync(path.join(dir, f)).isDirectory())
    if (subDirs.length) {
        subDirs.forEach(subDir => n += sumMarkdowns(path.join(dir, subDir)))
    }

    return n
}

/**
 * 
 * @param {string} dir
 * @returns {boolean}
 */
export function isDirectoryEmpty(dir) {
    const files = fs.readdirSync(dir)
    if (!files.length) return true

    const subDirs = files.filter(f => fs.lstatSync(path.join(dir, f)).isDirectory())
    if (!subDirs.length) {
        return !files.filter(f => f.endsWith('md')).length
    }

    return !subDirs.map(subDir => !isDirectoryEmpty(path.join(dir, subDir))).filter(Boolean).length
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