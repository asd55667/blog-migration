import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module';
import crypto from 'node:crypto'

import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkSlug from 'remark-slug'
import { toc } from 'mdast-util-toc'
import rehypeStringify from 'rehype-stringify'
import remarkRehype from 'remark-rehype'
import remarkGfm from 'remark-gfm'
import rehypeSlug from "rehype-slug"
import { visit } from "unist-util-visit"
// @ts-ignore
import rehypePrettyCode from "rehype-pretty-code"
import rehypeAutolinkHeadings from "rehype-autolink-headings"
import { getHighlighter, loadTheme } from "@shikijs/compat"
import rehypeRaw from 'rehype-raw'

import { resolveDate, parseContent, getRelativePathArray } from './utils.js';


/**
 * @typedef {import('mdast').Root} Root
 * @typedef {import('mdast-util-toc').Options} Options
 * @typedef {import('unist').Node} Node
 * @typedef {import('unist').Parent} Parent
 * @typedef {import('shiki').Highlighter} Highlighter
 * @typedef {import('shiki').ThemeInput} ThemeInput
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
 */
function getPostWithoutToc(p) {
    const markdown = fs.readFileSync(p, 'utf-8')

    // id from content hash
    const hash = crypto.createHash(algorithm);
    const id = hash.update(markdown, 'utf-8').digest('hex')

    const { title, description, content, ...metadata } = parseContent(markdown, p)

    /** @type {string[]} */
    const tags = (metadata && metadata.tags) ? metadata.tags : []

    /** @type {string[]} */
    const category = getRelativePathArray('', path.dirname(p))

    /** @type {string[]} */
    const related = []

    return {
        id,
        title,
        description,
        created: resolveDate(metadata.created || metadata.updated),
        updated: resolveDate(metadata.updated || metadata.created),
        content,
        author: (metadata && metadata.author) ? metadata.author : pkg.author.name,
        tags,
        category,
        related,
    }
}

/**
 *
 * @param {string} p relative path of markdown file
 * @returns {Promise<IPost>}
 */
export async function generatePost(p) {
    const post = getPostWithoutToc(p)
    const toc = await generateToc(post.content)

    return {
        ...post,
        toc
    }
}

/**
 *
 * @param {string} p relative path of markdown file
 * @returns {IPost}
 */
export function generatePostSync(p) {
    const post = getPostWithoutToc(p)
    const toc = generateTocSync(post.content)

    return {
        ...post,
        toc
    }
}

/**
 *
 * @param {string} markdown
 * @returns {Promise<Item>}
 */
async function generateToc(markdown) {
    /** @type {Parent=} */
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
 *
 * @param {string} markdown
 * @returns {Item}
 */
function generateTocSync(markdown) {
    /** @type {Parent=} */
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

    processor.processSync('## Content\n' + markdown)
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
        .use(remarkGfm)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeRaw)
        .use(rehypeSlug)
        .use(() => (tree) => {
            visit(tree, (/** @type {any} */ node) => {
                if (node?.type === "element" && node?.tagName === "pre") {
                    const [codeEl] = node.children
                    if (codeEl.tagName !== "code") {
                        return
                    }

                    if (codeEl.data?.meta) {
                        // Extract event from meta and pass it down the tree.
                        const regex = /event="([^"]*)"/
                        const match = codeEl.data?.meta.match(regex)
                        if (match) {
                            node.__event__ = match ? match[1] : null
                            codeEl.data.meta = codeEl.data.meta.replace(regex, "")
                        }
                    }

                    node.__rawString__ = codeEl.children?.[0].value
                    node.__src__ = node.properties?.__src__
                    node.__style__ = node.properties?.__style__
                }
            })
        })
        // @ts-ignore
        .use(rehypePrettyCode, {
            getHighlighter: async function () {
                const theme = await loadTheme(/** @type {ThemeInput} */(path.join(process.cwd(), "themes/dark.json")))
                return /** @type {any} */  (await getHighlighter(/** @type {any} */({ theme })))
            },
            onVisitLine(/** @type {any} */ node) {
                // Prevent lines from collapsing in `display: grid` mode, and allow empty
                // lines to be copy/pasted
                if (node.children.length === 0) {
                    node.children = [{ type: "text", value: " " }]
                }
            },
            onVisitHighlightedLine(/** @type {any} */node) {
                node.properties.className.push("line--highlighted")
            },
            onVisitHighlightedWord(/** @type {any} */node) {
                node.properties.className = ["word--highlighted"]
            },
        })
        .use(() => (tree) => {
            visit(tree, (/** @type {any} */ node) => {
                if (node?.type === "element" && node?.tagName === "div") {
                    if (!("data-rehype-pretty-code-fragment" in node.properties)) {
                        return
                    }

                    const preElement = node.children.at(-1)
                    if (preElement.tagName !== "pre") {
                        return
                    }

                    preElement.properties["__withMeta__"] =
                        node.children.at(0).tagName === "div"
                    preElement.properties["__rawString__"] = node.__rawString__

                    if (node.__src__) {
                        preElement.properties["__src__"] = node.__src__
                    }

                    if (node.__event__) {
                        preElement.properties["__event__"] = node.__event__
                    }

                    if (node.__style__) {
                        preElement.properties["__style__"] = node.__style__
                    }
                }
            })
        })
        .use(rehypeAutolinkHeadings, {
            properties: {
                className: ["subheading-anchor"],
                ariaLabel: "Link to section",
            },
        })
        .use(rehypeStringify)

    const result = await processor.process(markdown)

    return /** @type {string} */ (result.value)
}

