import fs from 'node:fs'
import path from 'node:path'

import { generatePost, markdown2Html } from './src/content.js'
import { write, preview } from './src/utils.js'
import * as D from './src/data.js'
import { TopKQueue } from './src/topk-queue.js'
import { addCategory, Category } from './src/category.js'

/**
 * @typedef {import('./src/content.js').IPost} IPost
 */

/**
 * @typedef {Object} Context
 * @property {TopKQueue<IPost>} queue
 * @property {string} root
 * @property {Category} categories
 */


const root = process.argv[2] || process.cwd()

generateFrom(root)

/**
 * 
 * @param {string} root root path of blogs
 */
async function generateFrom(root) {
    const queue = new TopKQueue(
        /** @type {(a: IPost, b: IPost) => number} */(a, b) => b.updated - a.updated,
        D.RECENT_COUNT);

    /**
     * @type {Context}
     */
    const context = {
        queue,
        root,
        categories: new Category(),
    }

    console.log('walking from: ', root)
    await walk(root, context)

    setTimeout(() => write(D.RECENT_POSTS, queue.toArray().map(v => preview(v))))

    write(D.CATEGORY_LIST, context.categories)
}

/**
 * 
 * @param {string} root 
 * @param {Context} context
 */
async function walk(root, context) {
    for (let p of fs.readdirSync(root)) {
        p = path.join(root, p)
        if (fs.lstatSync(p).isDirectory()) {
            addCategory(context.root, p, context.categories)

            walk(p, context)
        } else if (p.endsWith('.md')) {
            const post = await generatePost(p)

            context.queue.enqueue(post)

            post.content = await markdown2Html(post.content)
            write(`${D.POSTS}/${post.id}`, post)
        }
    }
}
