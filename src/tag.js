import { renderPostMeta } from './ui.js'

/**
 * @typedef {import('./type.js').IPost} IPost
 */

export class Tag {
    /** @type {Set<string>} */
    tags;
    /** @type {Map<string, IPost[]>} */
    map;

    constructor() {
        this.tags = new Set()
        this.map = new Map()
    }

    get list() {
        return Array.from(this.tags).map(t => {
            return {
                name: t,
                count: this.map.get(t)?.length ?? 0
            }
        })
    }

    /**
     * @returns {Map<string, import('./type.js').IPost[]>}
     */
    get combined() {
        /** @type {Map<string, IPost[]>} */
        const combined = new Map()

        for (const tag of this.tags) {
        }
        return combined
    }

    /**
     *
     * @param {string} tag
     * @param {IPost} post
     */
    add(tag, post) {
        this.tags.add(tag)
        if (!this.map.has(tag)) {
            this.map.set(tag, [])
        }

        const list = this.map.get(tag)
        if (list?.findIndex(p => p.id === post.id) !== -1) {
            return
        }
        list.push(post)
    }

    /**
     *
     * @param {string} tag
     * @returns {import('./type.js').IPost[]}
     */
    get(tag) {
        return this.map.get(tag) ?? []
    }
}


/**
 *
 * @param {string} title
 * @param {string} description
 * @param {() => string} callback
 * @returns {string}
 */
export function tag2mdx(title, description, callback) {
    let mdx = renderPostMeta({
        title,
        description
    })
    mdx += callback()
    return mdx
}