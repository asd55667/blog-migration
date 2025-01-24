import { renderPostMeta } from './ui.js'
import { group, sumMarkdowns, isDirectoryEmpty, getRelativePathArray } from './utils.js'

/**
 * @typedef {import('./content.js').IPost} IPost
 * @typedef {import('./content.js').IPostPreview} IPostPreview
 * @typedef {import('./type.js').IDocNav} IDocNav
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
     * @returns {Category}
     */
    withoutPosts() {
        return new Category(
            this.title,
            this.key,
            this.total,
            this.children.map(v => v.withoutPosts())
        )
    }
}


/**
 *
 * @param {Category} categories
 * @param {number} size
 */
export function paginateCategory(categories, size) {
    /**
     * @type {Map<string, (IPost|IPostPreview)[][]>}
     */
    const map = new Map()

    /**
     *
     * @param {Category} categories
     * @param {number} size
     * @param {string} scope
     */
    function paginate(categories, size, scope = '') {
        categories.children.forEach(category => {
            const currentScope = `${scope}/${category.key}`
            paginate(category, size, currentScope)

            categories.posts = merge(categories.posts, category.posts, (a, b) => a.updated - b.updated)
            if (!category.children.length) group(category, size, currentScope, map)
        })

        if (scope && categories.children.length) group(categories, size, scope, map)
    }

    paginate(categories, size)

    return map
}

/**
 * @template T
 * @param {T[]} l1
 * @param {T[]} l2
 * @param {(a:T,b:T)=>number} comparator
 */
export function merge(l1, l2, comparator) {
    /**
     * @type {T[]}
     */
    const l3 = []

    let i = 0, j = 0
    while (i < l1.length && j < l2.length) {
        if (comparator(l1[i], l2[j]) < 0) {
            l3.push(l1[i])
            i++
        } else {
            l3.push(l2[j])
            j++
        }
    }

    while (i < l1.length) {
        l3.push(l1[i])
        i++
    }

    while (j < l2.length) {
        l3.push(l2[j])
        j++
    }

    return l3
}


/**
 *
 * @param {string} title
 * @param {string} description
 * @param {() => string} callback
 * @returns {string}
 */
export function categories2mdx(title, description, callback) {
    let mdx = renderPostMeta({
        title,
        description
    })
    mdx += callback()
    return mdx
}


/**
 * TODO: handle nested category
 * @param {Category[]} categories
 * @returns {IDocNav[]}
 */
export function generateCategoryNav(categories) {
    if (!categories.length) return []

    /**
     * @type {IDocNav[]}
     */
    const nav = categories.map(category => ({
        title: category.title,
        href: `/category/${category.key}`,
    }))

    return [
        {
            title: 'Category',
            href: '/category',
            items: nav
        }
    ]
}
