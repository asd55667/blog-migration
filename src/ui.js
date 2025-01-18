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
export function renderPostItem(post) {
    // 2020-08-22
    let date = new Date(post.created).toISOString().split('T')[0]
    // August 22, 2020
    const dateArray = date.split('-')
    date = `${MONTHS[parseInt(dateArray[1]) - 1]} ${dateArray[2]}, ${dateArray[0]}`
    date = `***${date}***`

    let mdx = ''
    // link: > ***date*** <br /> [This is a Blog](/posts/post-id) <br />
    // desc: <span className="text-muted-foreground text-sm">this is a description</span>
    // border-b: <hr />
    mdx += `> ${date} <br /> [${post.title}](posts/${post.id}) <br />\n`
    mdx += `<span className="text-muted-foreground text-sm">${post.description}</span>\n`
    mdx += `<hr />\n`

    return mdx
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
    if (post.created) {
        // format date to yyyy-mm-dd
        mdx += `date: ${new Date(post.created).toISOString().split('T')[0]}\n`
    }
    mdx += `---\n\n`
    return mdx
}

/**
 * @param {IArchive[]} years
 * @returns {string}
 */
export function renderYears(years) {
    let mdx = ''
    years.forEach(year => {
        mdx += `## ${year.year}\n`
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
        mdx += `${h} ${MONTHS[month.month]}\n`
        mdx += `<div className="p-4">\n`
        mdx += month.posts.map(renderPostItem).join('\n')
        mdx += `</div>\n`
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
    mdx += month.posts.map(renderPostItem).join('\n')
    return mdx
}