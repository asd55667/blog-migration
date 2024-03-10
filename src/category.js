import { sumMarkdowns, isDirectoryEmpty } from './utils.js'

/**
 * @typedef {import('./type.d.ts').ICategory} ICategory
 */

/**
 * 
 * @param {string} root walking root
 * @param {string} dir current accessing directory
 * @param {ICategory} categories 
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
    parent.children.push({
        title: current,
        key: current,
        total,
        children: []
    })
    parent.total += total
}

/**
 * 
 * @param {string[]} category 
 * @param {ICategory} categories 
 * @returns {ICategory}
 */
function resolveCategory(category, categories) {
    return category.reduce((prev, key) => {
        let parent = prev.children.find(v => v.key === key)
        if (parent) return parent
        parent = {
            title: key,
            key,
            total: 0,
            children: []
        }
        prev.children.push(parent)
        return parent
    }, categories)
}

