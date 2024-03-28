/**
 * @typedef {import('./type.d.ts').IArchive} IArchive
 * @typedef {import('./type.d.ts').IPostPreview} IPostPreview
 */

export class Archive {
    constructor() {
        /**
         * @type {Map<number, IArchive>}
         */
        this.map = new Map();

        this.total = 0
        this.start = Date.now()
        this.end = new Date('1970').getTime()
    }

    /**
     * 
     * @param {IPostPreview} post 
     */
    add(post) {
        const date = new Date(post.date)
        const year = date.getFullYear()
        const month = date.getMonth()

        const archive = this.map.get(year)
        if (archive) {
            archive.total += 1
            const monthArchive = archive.months[month]
            if (monthArchive) {
                monthArchive.total += 1
                monthArchive.posts.push(post)
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

            this.map.set(year, archive)
        }

        const timestamp = date.getTime()
        if (timestamp > this.end) this.end = timestamp
        if (timestamp < this.start) this.start = timestamp
        this.total += 1
    }

    /**
     * 
     * @param {number} year 
     * @returns IArchive
     */
    get(year) {
        return this.map.get(year)
    }

    get years() {
        return this.map.size
    }

    /**
     * get all months that have posts
     * @returns number
     */
    get months() {
        return Array.from(this.map.values()).reduce((acc, archive) => {
            return acc + archive.months.filter(month => (month?.total || 0) > 0).length
        }, 0)
    }

    /**
     * get all posts in the archive
     * @returns IPostPreview[]
     */
    get posts() {
        return Array.from(this.map.values()).reduce((acc, archive) => {
            return acc.concat(archive.months.reduce((acc, month) => {
                return acc.concat(month?.posts || [])
            }, /** @type {IPostPreview[]} */([])))
        }, /** @type {IPostPreview[]} */([]))
    }
}
