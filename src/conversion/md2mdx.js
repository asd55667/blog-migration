import fs from 'node:fs'

import crypto from 'node:crypto'
import { createRequire } from 'node:module'

import { resolveDate, parseContent } from '../utils.js'
import { renderPostMeta } from '../ui.js'

const require = createRequire(import.meta.url)

/**
 * @typedef {object} PackageJson
 * @property {{name: string}} author
 * @property {string} [name]
 * @property {string} [version]
 */

/** @type {PackageJson} */
let pkg;

try {
    // Attempt path expected for bundled output (e.g., if output is in a 'dist' folder at root)
    pkg = require('../package.json');
} catch (e1) {
    try {
        // Attempt path for source/development environment
        pkg = require('../../package.json');
    } catch (e2) {
        console.error('Failed to load package.json. Please check paths. Error 1 (bundled attempt):', /** @type {Error} */ (e1).message, 'Error 2 (source attempt):', /** @type {Error} */ (e2).message);
        // Provide a safe fallback or re-throw, depending on desired error handling
        pkg = { author: { name: 'Default Author' } }; // Fallback to prevent crash
    }
}

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

    const postDate = metadata.created || metadata.updated || new Date().toISOString().split('T')[0];
    const postModifyDate = metadata.updated || new Date().toISOString().split('T')[0];
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