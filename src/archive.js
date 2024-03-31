/**
 * @typedef {import('./type.js').IArchive} IArchive
 * @typedef {import('./type.js').IPostPreview} IPostPreview
 */

import { insert } from './utils.js';

export class Archive {
    constructor() {
        /** @type {IArchive[]} */
        this.list = []

        this.total = 0
        this.start = Date.now()
        this.end = new Date('1970').getTime()
    }

    /**
     * 
     * @param {IPostPreview} post 
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
                monthArchive.total += 1
                insert(monthArchive.posts, post, (a, b) => a.created - b.created)
            } else {
                archive.months[month] = {
                    month,
                    total: 1,
                    posts: [post],
                }
            }
        } else {
            const archive = {
                year,
                total: 1,
                months: Array.from({ length: 12 }, (_, i) => ({ month: i, total: 0, posts: /** @type {IPostPreview[]} */ ([]) }))
            }

            archive.months[month] = {
                month,
                total: 1,
                posts: [post],
            }

            insert(this.list, archive, (a, b) => a.year - b.year)
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
        return this.list.find(archive => archive.year === year)
    }

    get years() {
        return this.list.length
    }

    /**
     * get all months that have posts
     * @returns number
     */
    get months() {
        return this.list.reduce((acc, archive) => {
            return acc + archive.months.filter(month => (month?.total || 0) > 0).length
        }, 0)
    }

    /**
     * get all posts in the archive
     * @returns IPostPreview[]
     */
    get posts() {
        return this.list.reduce((acc, archive) => {
            return acc.concat(archive.months.reduce((acc, month) => {
                return acc.concat(month?.posts || [])
            }, /** @type {IPostPreview[]} */([])))
        }, /** @type {IPostPreview[]} */([]))
    }
}
