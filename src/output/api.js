import fs from 'node:fs/promises'
import path from 'node:path'

import { generatePost, markdown2Html } from '../content.js'
import { write, preview, getRelativePathArray, insert } from '../utils.js'
import { walk } from '../utils-promises.js'
import { PAGE_SIZE, RECENT_COUNT } from '../data.js'
import { TopKQueue } from '../topk-queue.js'
import { addCategory, Category, paginateCategory, resolveCategory } from '../category.js'
import { Archive, paginateArchive } from '../archive.js'

/**
 * @typedef {import('../type.js').IPost} IPost
 * @typedef {import('../type.js').IPostPreview} IPostPreview
 * @typedef {import('../type.js').Context} Context
 */


/**
 *
 * @param {string} root root path of blogs
 * @param {string} output output path
 */
export async function generateFrom(root, output) {
    const queue = new TopKQueue(
        /** @type {(a: IPost, b: IPost) => number} */(a, b) => b.updated - a.updated,
        RECENT_COUNT);

    /**
     * @type {Context}
     */
    const context = {
        queue,
        root,
        categories: new Category(),
        archive: new Archive(),
    }

    console.log('walking from: ', root)

    await walk(root, async (p) => {
        if ((await fs.lstat(p)).isDirectory()) {
            addCategory(context.root, p, context.categories)
        } else if (p.endsWith('.md')) {
            if (path.basename(p) === 'README.md') {
                return
            }

            const post = await generatePost(p)

            const category = resolveCategory(getRelativePathArray(context.root, p), context.categories)
            insert(category.posts, post, (a, b) => a.updated - b.updated)

            context.archive.add(post)

            context.queue.enqueue(post)

            // const content = await markdown2Html(post.content)
            // write(path.join(output, 'content/post', post.id), post)
        }
    })

    setTimeout(() => serialize(context, output))
}

/**
 *
 * @param {Context} context
 * @param {string} output
 */
async function serialize(context, output) {
    const recent = await Promise.all(context.queue.toArray().map(async v => {
        return preview(v)
        // const post = preview(v)
        // post.content = await markdown2Html(post.content)
        // return post
    }))
    write(path.join(output, '/content/recent-posts'), recent)

    write(path.join(output, '/category/list'), context.categories.withoutPosts())

    // serializePagination(path.join(output, 'category'), paginateCategory(context.categories, PAGE_SIZE))

    // const archive = context.archive.list
    write(path.join(output, '/archive/list'), context.archive.withoutPosts())
    // serializePagination(path.join(output, '/archive'), paginateArchive(archive, PAGE_SIZE))
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
