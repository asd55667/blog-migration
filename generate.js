import fs from 'node:fs'
import path from 'node:path'

import { generatePost, markdown2Html } from './src/content.js'
import { write, preview } from './src/utils.js'
import * as D from './src/data.js'
import { TopKQueue } from './src/topk-queue.js'


/**
 * @typedef {import('./src/content.js').IPost} IPost
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

    console.log('walking from: ', root)
    await walk(root, queue)

    setTimeout(() => write(D.RECENT_POSTS, queue.toArray().map(v => preview(v))))
}

/**
 * 
 * @param {string} root 
 * @param {TopKQueue<IPost>} queue
 */
async function walk(root, queue) {
    for (let p of fs.readdirSync(root)) {
        p = path.join(root, p)
        if (fs.lstatSync(p).isDirectory()) walk(p, queue)
        else if (p.endsWith('.md')) {
            const post = await generatePost(p)

            queue.enqueue(post)

            post.content = await markdown2Html(post.content)
            write(`${D.POSTS}/${post.id}`, post)
        }
    }
}
