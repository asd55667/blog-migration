import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module';
import crypto from 'node:crypto'

import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import remarkSlug from 'remark-slug'
import { toc } from 'mdast-util-toc'
import rehypeStringify from 'rehype-stringify'
import remarkRehype from 'remark-rehype'
import remarkGfm from 'remark-gfm'

/**
 * @typedef {import('mdast').Root} Root
 * @typedef {import('mdast-util-toc').Options} Options
 * @typedef {import('unist').Node} Node
 * @typedef {import('unist').Parent} Parent
 * @typedef {import('./type.js').Item} Item
 * @typedef {import('./type.js').IPost} IPost
 * @typedef {import('./type.js').IPostPreview} IPostPreview
 */


const require = createRequire(import.meta.url);
const pkg = require('../package.json')
const algorithm = 'md5'

/**
 * 
 * @param {string} p relative path of markdown file
 * @returns {Promise<IPost>}
 */
export async function generatePost(p) {
    const { mtime } = fs.statSync(p)
    const markdown = fs.readFileSync(p, 'utf-8')

    // id from content hash
    const hash = crypto.createHash(algorithm);
    const id = hash.update(markdown, 'utf-8').digest('hex')

    const [title, markdownWithoutTitle] = splitTitle(markdown, p)

    const toc = await generateToc(markdownWithoutTitle)
    const content = markdownWithoutTitle

    return {
        id,
        title,
        created: Date.now(),
        updated: mtime.getTime(),
        content,
        author: pkg.author.name,
        tags: [],
        category: [],
        related: [],
        toc
    }
}

/**
 * 
 * @param {string} markdown 
 * @param {string} p
 */
function splitTitle(markdown, p) {
    const processor = unified()
        .use(remarkParse)
        .use(remarkStringify)

    const ast = processor.parse(markdown)

    // title extract from first h1, otherwise use the filename
    let title = '';

    const h1s = ast.children.filter(node => node.type === 'heading' && node.depth === 1)
    while (!title && h1s.length) {
        const h1 = h1s.shift()
        if (h1 && 'children' in h1 && h1.children?.[0]?.type === 'text') {
            title = h1?.children?.[0].value
            // remove h1 node in first line
            const idx = ast.children.findIndex(node => Object.is(node, h1))
            if (idx !== -1) ast.children.splice(idx, 1)
        }
    }
    if (!title) title = path.basename(p).split('.md')[0]
    const content = processor.stringify(ast)
    return [title, content]
}



/**
 * 
 * @param {string} markdown 
 * @returns {Promise<Item>}
 */
async function generateToc(markdown) {
    /**
     * @type {undefined | Parent}
     */
    let node;

    /**
     * 
     * @param {Readonly<Options> | null | undefined} [options]
     * @returns 
     */
    function extractToc(options) {
        const settings = {
            heading: (options && options.heading) || '(table[ -]of[ -])?contents?|toc',
            tight: options && typeof options.tight === 'boolean' ? options.tight : true
        }
        /**
         * @param {Root} tree
         */
        return function (tree) {
            const result = toc(tree, settings)
            node = result.map
        }
    }
    const processor = unified()
        .use(remarkParse)
        // @ts-ignore
        .use(remarkSlug)
        .use(extractToc)
        .use(remarkRehype)
        .use(rehypeStringify)

    await processor.process('## Content\n' + markdown)
    if (!node) return { title: '', url: '', items: /** @type {Item[]} */[] }

    return ast2Toc(node)
}



/**
 * @param {Node} node
 * @returns { Item }
 * 
*/
export function ast2Toc(node) {
    if (node.type === "list") {
        const items = /** @type {Parent} */ (node).children.map(ast2Toc)
        return {
            title: '',
            url: '',
            items
        }
    } else if (node.type === "listItem") {
        const list = /** @type {Parent} */ (node).children.map(ast2Toc)
        if (list.length === 1) {
            return {
                title: list[0].title,
                url: list[0].url,
                items: []
            }
        }
        return {
            title: list[0].title,
            url: list[0].url,
            items: /** @type {Item[]} */ (list[1].items)
        }
    } else if (node.type === 'paragraph') {
        return ast2Toc(/** @type {Parent} */(node).children[0])
    } else if (node.type === 'link') {
        return {
            title: /** @type {any} */ (/** @type {Parent} */ (node).children[0]).value,
            url: /** @type {any} */ (node).url,
            items: [],
        }
    }
    return {
        title: '',
        url: '',
        items: []
    }
}



/**
 * TODO: customize the style of markdown
 * @param {string} markdown 
 * @returns {Promise<string>}
 */
export async function markdown2Html(markdown) {
    const processor = unified()
        .use(remarkParse)
        // @ts-ignore
        .use(remarkSlug)
        .use(remarkRehype)
        .use(remarkGfm)
        // .use(rehypeDocument)
        .use(rehypeStringify)

    const result = await processor.process(markdown)

    return /** @type {string} */ (result.value)
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