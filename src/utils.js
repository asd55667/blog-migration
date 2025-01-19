import fs from 'node:fs'
import path from 'node:path'

import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'

/**
 * @typedef {import('./type.js').IPost} IPost
 * @typedef {import('./type.js').IPostPreview} IPostPreview
 * @typedef {import('./type.js').IArchive} IArchive
 * @typedef {import('./type.js').IDocNav} IDocNav
 */

/**
 *
 * @param {string} root
 * @param {(p: string) => void} callback
 */
export function walk(root, callback) {
    for (let p of fs.readdirSync(root)) {
        p = path.join(root, p)
        callback(p)
        if ((fs.lstatSync(p)).isDirectory()) walk(p, callback)
    }
}

/**
 *
 * @param {string} dir output path
 * @param {unknown} data
 */
export function write(dir, data) {
    if (!fs.existsSync(path.dirname(dir))) fs.mkdirSync(path.dirname(dir), { recursive: true });

    console.log('write file into:', dir);
    if (typeof data === 'string') {
        fs.writeFileSync(dir, data);
        return
    }

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
        description: post.description,
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
 * strip root from path
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
 *
 * @template T
 * @param {T[]} array
 * @param {T} item
 * @param {(a:T,b:T)=>number} comparator
 */
export function insert(array, item, comparator) {
    let l = 0
    let r = array.length - 1
    while (l <= r) {
        const mid = l + Math.floor((r - l) / 2)
        if (comparator(item, array[mid]) > 0) {
            r = mid - 1
        } else l = mid + 1
    }

    array.splice(l, 0, item)
}

/**
 * @param {{posts: (IPost|IPostPreview)[]}} category
 * @param {number} size
 * @param {string} scope
 * @param {Map<string, (IPost|IPostPreview)[][]>} map
 */
export function group(category, size, scope, map) {
    for (let i = 1; i <= Math.ceil((category.posts?.length || 0) / size); i++) {
        const group = category.posts?.slice((i - 1) * size, i * size)
        if (!map.get(scope)) map.set(scope, [])
        map.get(scope)?.push(group)
    }
}

/**
 *
 * @param {Date|string} date
 * @returns {number}
 */
export function resolveDate(date) {
    if (typeof date === 'string') {
        date = date.replace('年', '-').replace('月', '-').replace('日', '')
    }

    const time = new Date(date).getTime()
    return time ? time : new Date().getTime()
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

/**
 * get first paragraph of blog
 * @param {string} markdown
 * @returns ${IPostPreview}
 */
export function previewOfMarkdown(markdown) {
    const processor = unified().use(remarkParse).use(remarkStringify)

    const ast = processor.parse(markdown)

    const idx = ast.children.findIndex(node => node.type === 'paragraph')

    if (idx !== -1) ast.children = ast.children.slice(0, idx + 1)

    return processor.stringify(ast)
}

/**
 *
 * @param {IArchive[]} archives
 * @returns {IDocNav[]}
 */
export function generateDocNav(archives) {
    // get all posts in the archives

    /** @type {IDocNav[]} */
    const initNav = []
    return archives.reduce((acc, archive) => {
        /** @type {IDocNav[]} */
        const initSubNav = []
        const subNav = archive.months.reduce((acc, month) => {
            return acc.concat(month.posts.map(post => ({
                title: post.title,
                href: `/posts/${post.id}`,
                // items: []
            })))
        }, initSubNav)
        return acc.concat(subNav)
    }, initNav)

}
