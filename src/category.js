import { sumMarkdowns, isDirectoryEmpty } from './utils.js'


/**
 * 
 * @param {string} root walking root
 * @param {string} dir current accessing directory
 * @param {Category} categories 
 */
export function addCategory(root, dir, categories) {
    if (isDirectoryEmpty(dir)) return

    let p = dir
    if (root) {
        let i = root.length
        if (root[root.length - 1] !== '/') i = i + 1
        p = p.slice(i)
    }

    const category = p.split('/')
    const current = category[category.length - 1]

    const total = sumMarkdowns(dir)
    const parent = category.length === 1 ? categories : resolveCategory(category.slice(0, -1), categories)
    parent.children.push(new Category(current, current, total))
    parent.total += total
}

/**
 * 
 * @param {string[]} category 
 * @param {Category} categories 
 * @returns {Category}
 */
function resolveCategory(category, categories) {
    return category.reduce((prev, key) => {
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
    }
}