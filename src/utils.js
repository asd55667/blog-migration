import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter';

import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'

/**
 * @typedef {import('./type.js').IPost} IPost
 * @typedef {import('./type.js').IPostPreview} IPostPreview
 * @typedef {import('./type.js').IArchive} IArchive
 * @typedef {import('./type.js').IDocNav} IDocNav
 * @typedef {import('./type.js').IMetadata} IMetadata

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
 * @returns {IMetadata & {content: string}}
 */
export function parseContent(markdown, p) {
    const { data: metadata, content: rawContent } = matter(markdown, { delimiters: ['<!--', '-->'] });

    const processor = unified()
        .use(remarkParse)
        .use(remarkStringify)

    const ast = processor.parse(rawContent)

    // Remove HTML comments from the AST
    ast.children = ast.children.filter(node => {
        if (node.type === 'html' && node.value.startsWith('<!--')) {
            return false;
        }
        return true;
    });

    let title = '';
    let description = '';

    const h1Index = ast.children.findIndex(node => node.type === 'heading' && node.depth === 1);

    if (h1Index !== -1) {
        const h1Node = ast.children[h1Index];
        if (h1Node && 'children' in h1Node && h1Node.children?.[0]?.type === 'text') {
            title = h1Node.children[0].value;
            // Remove H1 node
            ast.children.splice(h1Index, 1);

            // Check for blockquote immediately after H1 for description
            // Need to adjust index since H1 is removed
            const potentialBlockquoteNode = ast.children[h1Index];
            if (potentialBlockquoteNode?.type === 'blockquote' &&
                potentialBlockquoteNode.children?.[0]?.type === 'paragraph' &&
                potentialBlockquoteNode.children[0].children?.[0]?.type === 'text') {
                description = potentialBlockquoteNode.children[0].children[0].value;
                // Remove blockquote node
                ast.children.splice(h1Index, 1);
            }
        }
    }

    if (!title) {
        title = path.basename(p).split('.md')[0];
        description = ''; // No title, no description
    }


    const content = processor.stringify(ast);
    return { ...(/** @type {IMetadata} */ (metadata)), content, title, description };
}

/**
 * get content ahead of first paragraph of markdown
 * @param {string} markdown
 * @returns {string}
 */
export function previewOfMarkdown(markdown) {
    const processor = unified().use(remarkParse).use(remarkStringify)

    const ast = processor.parse(markdown)

    const idx = ast.children.findIndex(node => node.type === 'paragraph')

    if (idx !== -1) ast.children = ast.children.slice(0, idx + 1)

    return processor.stringify(ast)
}
