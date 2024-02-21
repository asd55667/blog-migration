/**
 * @typedef {import('mdast').Root} Root
 * @typedef {import('mdast-util-toc').Options} Options
 * @typedef {import('unist').Node} Node
 * @typedef {import('unist').Parent} Parent
 */

/**
 * @typedef {Object} Item - creates a new type named 'Item'
 * @property {string} title - a string property of Item
 * @property {string} url - a string property of Item
 * @property {Item[]=} items - an optional property of Item
 */

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { createRequire } from 'node:module';

import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkToc from 'remark-toc'
import remarkGfm from 'remark-gfm'
import remarkStringify from 'remark-stringify'
import remarkSlug from 'remark-slug'
import { toc } from 'mdast-util-toc'
import rehypeDocument from 'rehype-document'
import rehypeStringify from 'rehype-stringify'
import remarkRehype from 'remark-rehype'


const require = createRequire(import.meta.url);
const pkg = require('./package.json')
const algorithm = 'md5'

const root = process.argv[2] || process.cwd()

// console.log('walk from root: ', root)
walk(root)

/**
 * 
 * @param {string} root 
 */
function walk(root) {
    for (let p of fs.readdirSync(root)) {
        p = path.join(root, p)
        if (fs.lstatSync(p).isDirectory()) walk(p)
        else {
            if (p.endsWith('.md')) {
                const post = generatePost(p)
                // console.log(post);
                break;
            }
        }

    }
}

/**
 * 
 * @param {string} p relative path of markdown file
 * @returns IPost
 */
async function generatePost(p) {
    const { mtime } = fs.statSync(p)
    const markdown = fs.readFileSync(p, 'utf-8')

    // id from content hash
    const hash = crypto.createHash(algorithm);
    const id = hash.update(markdown, 'utf-8').digest('hex')

    const [title, markdownWithoutTitle] = splitTitle(markdown, p)

    const toc = generateToc(markdownWithoutTitle)

    return {
        id,
        title,
        date: Date.now(),
        updated: mtime.getTime(),
        // content,
        author: pkg.author.name,
        tags: [],
        category: [],
        related: [],
        toc: []
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
 * @returns {Promise<{items: Item[]} | undefined>}
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
        // .use(remarkGfm)
        // .use(rehypeDocument)
        .use(rehypeStringify)

    await processor.process('## Content\n' + markdown)
    // fs.writeFileSync('a.html', JSON.stringify(node))
    if (!node) return

    /** @type {{items: Item[]}} */
    const _toc = { items: [] }

    return node.children.reduce((toc, val) => {
        toc.items.push(mdNode2Toc(val))
        return toc;
    }, _toc)
}

/**
 * 
 * @param {Node} node
 * @returns {Item}
 */
function mdNode2Toc(node) {

    return {
        title: "",
        url: ""
    }
}