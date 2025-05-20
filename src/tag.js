import { renderPostMeta } from './ui.js'

/**
 * @typedef {import('./type.js').IPost} IPost
 */

export class Tag {
    /** @type {Set<string>} */
    tags;
    /** @type {Map<string, IPost[]>} */
    map;
    /** @type {number} */
    maximum_tags;

    /**
     *
     * @param {Set<string>} tags
     * @param {Map<string, IPost[]>} map
     */
    constructor(tags, map) {
        this.tags = tags
        this.map = map
        this.maximum_tags = 0 // As per original file structure
    }

    get list() {
        return Array.from(this.tags).map(t => {
            return {
                name: t,
                count: this.map.get(t)?.length ?? 0
            }
        })
    }

    get route() {
        const list = Array.from(this.tags)
        return list
    }

    /**
     *
     * @param {string} tag
     * @param {IPost} post
     * @param {number} length
     */
    add(tag, post, length) {
        this.tags.add(tag)
        if (!this.map.has(tag)) {
            this.map.set(tag, [])
        }
        this.map.get(tag)?.push(post)
        this.maximum_tags = Math.max(this.maximum_tags, length)
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