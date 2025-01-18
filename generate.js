import fs from 'node:fs/promises'
import path from 'node:path'

import { generatePost, markdown2Html } from './src/content.js'
import { write, preview, getRelativePathArray, insert } from './src/utils.js'
import { walk } from './src/utils-promises.js'
import { Config } from './src/data.js'
import { TopKQueue } from './src/topk-queue.js'
import { addCategory, Category, paginateCategory, resolveCategory } from './src/category.js'
import { Archive, paginateArchive } from './src/archive.js'

/**
 * @typedef {import('./src/type.js').IPost} IPost
 * @typedef {import('./src/type.js').IPostPreview} IPostPreview
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
        archive: new Archive(),
        ...Config
    }

    console.log('walking from: ', root)

    await walk(root, async (p) => {
        if ((await fs.lstat(p)).isDirectory()) {
            addCategory(context.root, p, context.categories)
        } else if (p.endsWith('.md')) {
            const post = await generatePost(p)

            const category = resolveCategory(getRelativePathArray(context.root, p), context.categories)
            insert(category.posts, post, (a, b) => a.updated - b.updated)

            context.archive.add(post)

            context.queue.enqueue(post)

            // const content = await markdown2Html(post.content)
            // write(`${context.POSTS}/${post.id}`, { ...post, content })
        }
    })

    setTimeout(() => serialize(context))
}

/**
 * 
 * @param {Context} context 
 */
async function serialize(context) {
    const recent = await Promise.all(context.queue.toArray().map(async v => {
        const post = preview(v)
        post.content = await markdown2Html(post.content)
        return post
    }))
    write(context.RECENT_POSTS, recent)

    write(context.CATEGORY_LIST, context.categories)

    serializePagination(context.CATEGORY, paginateCategory(context.categories, context.PAGE_SIZE))

    const archive = context.archive.list
    write(context.ARCHIVE_LIST, context.archive.list)
    serializePagination(context.ARCHIVE, paginateArchive(archive, context.PAGE_SIZE))
}

/**
 * 
 * @param {string} dir
 * @param {Map<string, IPostPreview[][]>} map 
 */
function serializePagination(dir, map) {
    for (const key of map.keys()) {
        const pages = map.get(key)
        if (!pages) continue
        pages.forEach((posts, i) => {
            write(path.join(dir, `${key}/${i + 1}`), { posts, pages: pages.length })
        })
    }
}