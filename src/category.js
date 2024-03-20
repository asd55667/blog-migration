import { sumMarkdowns, isDirectoryEmpty, getRelativePathArray } from './utils.js'

/**
 * @typedef {import('./content.js').IPost} IPost
 */

/**
 * 
 * @param {string} root walking root
 * @param {string} dir current accessing directory
 * @param {Category} categories 
 */
export function addCategory(root, dir, categories) {
    if (isDirectoryEmpty(dir)) return

    const category = getRelativePathArray(root, dir)
    const current = category[category.length - 1]

    const total = sumMarkdowns(dir)
    const parent = category.length === 1 ? categories : resolveCategory(category, categories)
    parent.children.push(new Category(current, current, total))
}

/**
 * 
 * @param {string[]} category 
 * @param {Category} categories 
 * @returns {Category} parent category of current directory
 */
export function resolveCategory(category, categories) {
    return category.slice(0, -1).reduce((prev, key) => {
        let parent = prev.children.find(v => v.key === key)
        if (parent) return parent
        parent = new Category(key, key)
        prev.children.push(parent)
        return parent
    }, categories)
}

export class Category {
    /**
     * 
     * @param {string=} title 
     * @param {string=} key 
     * @param {number=} total 
     * @param {Category[]=} children 
     */
    constructor(title, key, total, children) {
        this.title = title ?? ''
        this.key = key ?? ''
        this.total = total ?? 0
        this.children = children ?? []

        /**
         * @type {IPost[]}
         */
        this.posts = []
    }

    /**
     * 
     * @param {IPost} post
     */
    add(post) {
        if (!this.posts) this.posts = []
        // TODO: heap sort
        this.posts.push(post)
        this.posts.sort((a, b) => b.updated - a.updated)
    }
}


/**
 * 
 * @param {Category} categories 
 * @param {number} size
 */
export function paginateCategory(categories, size) {
    /**
     * @type {Map<string, IPost[][]>}
     */
    const map = new Map()

    /**
     * 
     * @param {Category} categories 
     * @param {number} size
     * @param {string} scope
     */
    function paginate(categories, size, scope = '') {
        categories.children.map(category => {
            const currentScope = `${scope}/${category.key}`
            for (let i = 1; i <= Math.ceil((category.posts?.length || 0) / size); i++) {
                const group = category.posts?.slice((i - 1) * size, i * size)
                if (map.get(currentScope)) map.get(currentScope)?.push(group)
                else map.set(currentScope, [])
            }
            paginate(category, size, currentScope)
        })
    }
    // TODO: paginate parent category with merge sort
    paginate(categories, size)

    return map
}