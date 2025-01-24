/**
 * @typedef {import('./type.js').IArchive} IArchive
 * @typedef {import('./type.js').IPostPreview} IPostPreview
 * @typedef {import('./type.js').IPost} IPost
 * @typedef {import('./type.js').IDocNav} IDocNav
 */

import { MONTHS } from './data.js';
import { renderPostMeta } from './ui.js';
import { group, insert, preview } from './utils.js';

export class Archive {
    constructor() {
        /** @private @type {IArchive[]} */
        this._list = []

        this.total = 0
        this.start = Date.now()
        this.end = new Date('1970').getTime()
    }

    /**
     *
     * @param {IPost} post
     */
    add(post) {
        const date = new Date(post.created)
        const year = date.getFullYear()
        const month = date.getMonth()

        const archive = this.get(year)
        if (archive) {
            archive.total += 1
            const monthArchive = archive.months[month]
            if (monthArchive) {
                insert(monthArchive.posts, preview(post), (a, b) => a.created - b.created)
            } else {
                archive.months[month] = {
                    month,
                    posts: [preview(post)],
                }
            }
        } else {
            const archive = {
                year,
                total: 1,
                months: Array.from({ length: 12 }, (_, i) => ({ month: i, posts: /** @type {IPostPreview[]} */ ([]) }))
            }

            archive.months[month] = {
                month,
                posts: [preview(post)],
            }

            insert(this._list, archive, (a, b) => a.year - b.year)
        }

        const timestamp = date.getTime()
        if (timestamp > this.end) this.end = timestamp
        if (timestamp < this.start) this.start = timestamp
        this.total += 1
    }

    /**
     *
     * @param {number} year
     * @returns {IArchive=}
     */
    get(year) {
        return this._list.find(archive => archive.year === year)
    }

    get years() {
        return this._list.length
    }

    /**
     * get all months that have posts
     * @returns number
     */
    get months() {
        return this._list.reduce((acc, archive) => {
            return acc + archive.months.filter(month => (month?.posts?.length || 0) > 0).length
        }, 0)
    }

    /**
     * get all posts in the archive
     * @returns IPostPreview[]
     */
    get posts() {
        return this._list.reduce((acc, archive) => {
            return acc.concat(archive.months.reduce((acc, month) => {
                return acc.concat(month?.posts || [])
            }, /** @type {IPostPreview[]} */([])))
        }, /** @type {IPostPreview[]} */([]))
    }

    withoutPosts() {
        return this.list.map(archive => ({
            year: archive.year,
            months: archive.months.map(month => ({
                month: month.month + 1,
                total: month.posts.length
            }))
        }))
    }


    // clean empty month
    get list() {
        const archive = this._list.slice()

        archive.forEach(year => {
            year.months = year.months.filter(month => month?.posts.length)
            year.months.sort((a, b) => b.month - a.month)
        })

        return archive
    }
}

/**
 *
 * @param {IArchive[]} list
 * @param {number} size
 */
export function paginateArchive(list, size) {
    /**
     * @type {Map<string, IPostPreview[][]>}
     */
    const map = new Map()

    list.forEach(year => {
        year.months.forEach(month => {
            group(month, size, `${year.year}/${month.month + 1}`, map)
        })
    })

    return map
}

/**
 *
 * @param {string} title
 * @param {string} description
 * @param {() => string} callback
 * @returns {string}
 */
export function archive2mdx(title, description, callback) {
    let mdx = renderPostMeta({
        title,
        description
    })
    mdx += callback()
    return mdx
}


/**
 *
 * @param {IArchive[]} archives
 * @returns {[IDocNav, IDocNav]}
 */
export function generatePostAndArchiveNav(archives) {
    // get all posts in the archives

    const posts = archives.reduce((acc, archive) => {
        const subNav = archive.months.reduce((acc, month) => {
            return acc.concat(month.posts.map(post => ({
                title: post.title,
                href: `/posts/${post.id}`,
                // items: []
            })))
        }, /** @type {IDocNav[]} */([]))
        return acc.concat(subNav)
    }, /** @type {IDocNav[]} */([]))

    const archive = archives.reduce((acc, archive) => {
        return acc.concat(
            archive.months.reduce((acc, month) => {
                return acc.concat({
                    title: `${MONTHS[month.month]} ${archive.year}`,
                    href: `/archive/${archive.year}/${month.month + 1}`,
                    // items: []
                })
            }, /** @type {IDocNav[]} */([]))
        )
    }, /** @type {IDocNav[]} */([]))


    return [
        {
            title: 'Posts',
            href: '/posts',
            items: posts,
        },
        {
            title: 'Archive',
            href: '/archive',
            items: archive,
        }
    ]
}
