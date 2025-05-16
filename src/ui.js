/**
 * @typedef {import('./type.js').IPost} IPost
 * @typedef {import('./type.js').IPostPreview} IPostPreview
 * @typedef {import('./type.js').IArchive} IArchive
 */

import { MONTHS } from './data.js'

/**
 *
 * @param {IPost|IPostPreview} post
 */
function normalizeDate(post) {
    // 2020-08-22
    let date = new Date(post.created).toISOString().split('T')[0]
    // August 22, 2020
    const dateArray = date.split('-')
    return `${MONTHS[parseInt(dateArray[1]) - 1]} ${dateArray[2]}, ${dateArray[0]}`
}

/**
 *
 * @param {Partial<IPost> & {title: string, description: string}} post
 */
export function renderPostMeta(post) {
    let mdx = ''
    mdx += `---\n`
    mdx += `title: ${post.title ?? 'title'}\n`
    mdx += `description: ${post.description ?? 'description'}\n`
    if (post.updated) {
        // format date to yyyy-mm-dd
        mdx += `date: ${new Date(post.updated).toISOString().split('T')[0]}\n`
    }

    if (post.created) {
        mdx += `created: ${new Date(post.created).toISOString().split('T')[0]}\n`
    }

    if (post.tags) {
        mdx += `tags: [${post.tags.join(', ')}]\n`
    }
    mdx += `---\n\n`
    return mdx
}

/**
 *
 * @param {IPost|IPostPreview} post
 */
export function renderArchivePost(post) {
    const date = `***${normalizeDate(post)}***`

    let mdx = `> ${date} <br /> [${post.title}](/posts/${post.id}) <br />\n`
    mdx += `<span className="text-muted-foreground text-sm">${post.description}</span>\n`
    mdx += `<hr />\n`

    return mdx
}

/**
 * @param {IArchive[]} years
 * @returns {string}
 */
export function renderYears(years) {
    let mdx = ''
    years.forEach(year => {
        mdx += `## ${year.year} (${year.total})\n`
        mdx += renderYear(year, 3)
    })
    return mdx
}

/**
 *
 * @param {IArchive} year
 * @returns {string}
 */
export function renderYear(year, level = 2) {
    const h = '#'.repeat(level)
    let mdx = ''
    year.months.forEach(month => {
        mdx += `\n${h} ${MONTHS[month.month]} (${month.posts.length})\n\n`
        mdx += `<div className="p-4">\n\n`
        mdx += month.posts.map(renderArchivePost).join('\n')
        mdx += `</div>\n\n`
    })
    return mdx
}

/**
 *
 * @param {IArchive['months'][0]} month
 * @returns {string}
 */
export function renderMonth(month) {
    let mdx = ''
    mdx += month.posts.map(renderArchivePost).join('\n')
    return mdx
}


/**
 *
 * @param {IPost|IPostPreview} post
 * @param {number} level
 * @returns {string}
 */
export function renderCategoryPost(post, level = 2) {
    const h = '#'.repeat(level)
    const date = normalizeDate(post)
    let mdx = `${h} [${post.title}](posts/${post.id})\n`
    mdx += `<span className="text-muted-foreground text-sm inline-flex w-full items-center justify-between gap-2">\
${post.description} <em className="text-xs" style={{flex: "none"}}>${date}</em></span>\n`
    if (level > 2) mdx += `<hr />\n`

    return mdx
}

/**
 *
 * @param {import('./category.js').Category} category
 * @param {boolean} renderTitle
 * @param {number} level
 * @returns {string}
 */
export function renderCategory(category, renderTitle, level = 2) {
    const h = '#'.repeat(level % 4)

    let mdx = ''

    if (category.total && renderTitle) mdx += `\n${h} ${category.title} (${category.total})\n`
    if (category.posts.length && renderTitle) mdx += `<div className="p-2">\n\n`
    mdx += category.posts.map((post) => renderCategoryPost(post, level + 1)).join('\n')
    if (category.posts.length && renderTitle) mdx += `</div>\n`

    category.children.forEach(child => {
        mdx += renderCategory(child, true, level + (category.total ? 1 : 0))
    })
    return mdx
}
