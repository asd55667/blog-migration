import fs from 'node:fs/promises'
import path from 'node:path'

import { generatePost, markdown2Html } from './src/content.js'
import { write, preview, getRelativePathArray } from './src/utils.js'
import { walk } from './src/utils-promises.js'
import { Config } from './src/data.js'
import { TopKQueue } from './src/topk-queue.js'
import { addCategory, Category, paginateCategory, resolveCategory } from './src/category.js'

/**
 * @typedef {import('./src/type.js').IPost} IPost
 * @typedef {import('./src/type.js').Context} Context
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
        Config.RECENT_COUNT);

    /**
     * @type {Context}
     */
    const context = {
        queue,
        root,
        categories: new Category(),
        ...Config
    }

    console.log('walking from: ', root)

    await walk(root, async (p) => {
        if ((await fs.lstat(p)).isDirectory()) {
            addCategory(context.root, p, context.categories)
        } else if (p.endsWith('.md')) {
            const post = await generatePost(p)

            const category = resolveCategory(getRelativePathArray(context.root, p), context.categories)
            category.add(post)

            context.queue.enqueue(post)

            post.content = await markdown2Html(post.content)
            write(`${context.POSTS}/${post.id}`, post)
        }
    })

    setTimeout(() => serialize(context))
}

/**
 * 
 * @param {Context} context 
 */
function serialize(context) {
    write(context.RECENT_POSTS, context.queue.toArray().map(v => preview(v)))

    write(context.CATEGORY_LIST, context.categories)

    const map = paginateCategory(context.categories, context.PAGE_SIZE)
    for (const key of map.keys()) {
        const pages = map.get(key)
        if (!pages) continue
        pages.forEach((page, i) => {
            write(path.join(context.CATEGORY, `${key}/${i}`), page)
        })
    }
}
