import fs from 'node:fs/promises'
import path from 'node:path'

import { md2mdx } from './src/md2mdx.js'
import { generateDocNav, getRelativePathArray, insert, write } from './src/utils.js'
import { walk } from './src/utils-promises.js'
import { Archive, archive2mdx } from './src/archive.js'
import { addCategory, Category, resolveCategory, categories2mdx } from './src/category.js'
import { renderYears, renderYear, renderMonth, renderCategory } from './src/ui.js'
import { MONTHS } from './src/data.js'


/**
 * migrate from .md to .mdx
 * @param {string} root root path of blogs
 * @param {string} output output path of mdx
 */
export async function migrating2mdx(root, output) {

    const archive = new Archive()
    const category = new Category()

    await walk(root, async (p) => {
        if ((await fs.lstat(p)).isDirectory()) {
            addCategory(root, p, category)
        } else if (path.extname(p) === '.md') {
            const post = md2mdx(p)

            const cate = resolveCategory(getRelativePathArray(root, p), category)
            insert(cate.posts, post, (a, b) => a.updated - b.updated)

            archive.add(post)
            write(path.join(output, 'posts', `${post.id}.mdx`), post.content)
        }
    })

    generateArchiveMDX(archive, output)
    generateCategoryMDX(category, output)
    const docNav = generateDocNav(archive.list)
    write(path.join(output, 'doc-nav.json'), JSON.stringify(docNav))
}

/**
 *
 * @param {Archive} archive
 * @param {string} output output path of mdx
 */
async function generateArchiveMDX(archive, output) {
    const root = path.join(output, 'archive')

    // archive/index.mdx
    const archiveIndex = archive2mdx('Archive', 'Things I have been through', () => renderYears(archive.list))
    write(path.join(root, 'index.mdx'), archiveIndex)

    // archive/2020/index.mdx
    archive.list.forEach(year => {
        const yearIndex = archive2mdx(`\"${year.year}\"`, `Posts of ${year.year}`, () => renderYear(year, 2))
        write(path.join(root, `${year.year}/index.mdx`), yearIndex)

        // archive/2020/5.mdx
        year.months.forEach(month => {
            const title = `${year.year} ${MONTHS[month.month]}`
            const monthMdx = archive2mdx(title, `Posts of ${title}`, () => renderMonth(month))
            write(path.join(root, `${year.year}`, `${month.month + 1}.mdx`), monthMdx)
        })
    })
}


/**
 *
 * @param {Category} category
 * @param {string} output
 */
async function generateCategoryMDX(category, output) {
    const root = path.join(output, 'category')

    // category/index.mdx
    const categoriesIndex = categories2mdx('Category', 'There would be many categories', () => renderCategory(category, true))
    write(path.join(root, 'index.mdx'), categoriesIndex)

    generateChildren(category.children)

    /**
     *
     * @param {Category[]} children
     */
    function generateChildren(children) {
        children.forEach(child => {
            const categoryIndex = categories2mdx(child.title, `Posts of ${child.title}`, () => renderCategory(child, false, 1))
            if (!child.children.length) {
                generateChildren(child.children)
                write(path.join(root, `${child.title}.mdx`), categoryIndex)
            } else {
                write(path.join(root, `${child.title}/index.mdx`), categoryIndex)
            }
        })
    }
}
