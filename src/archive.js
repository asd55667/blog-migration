/**
 * @typedef {import('./type.js').IArchive} IArchive
 * @typedef {import('./type.js').IPostPreview} IPostPreview
 * @typedef {import('./type.js').IPost} IPost
 */

import { group, insert, preview } from './utils.js';

export class Archive {
    constructor() {
        /** @type {IArchive[]} */
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