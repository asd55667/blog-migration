import fs from 'node:fs/promises'
import path from 'node:path'

import { md2mdx } from '../conversion/md2mdx.js'
import { getRelativePathArray, insert, write } from '../utils.js'
import { walk } from '../utils-promises.js'
import { Archive, archive2mdx, generatePostAndArchiveNav } from '../archive.js'
import { addCategory, Category, resolveCategory, categories2mdx, generateCategoryNav } from '../category.js'
import { Tag, tag2mdx } from '../tag.js'
import { renderYears, renderYear, renderMonth, renderCategory, renderTagIndex, renderTagPost } from '../ui.js'
import { MONTHS } from '../data.js'

/**
 * migrate from .md to .mdx
 * @param {string} root root path of blogs
 * @param {string} output output path of mdx
 */
export async function migrating2mdx(root, output) {

    const archive = new Archive()
    const category = new Category()
    /** @type {Map<string, import('../type.js').IPost[]>} */

    /** @type {Tag} */
    const tagInstance = new Tag()

    await walk(root, async (p) => {
        if ((await fs.lstat(p)).isDirectory()) {
            addCategory(root, p, category)
        } else if (path.extname(p) === '.md') {
            if (path.basename(p) === 'README.md') {
                return
            }

            const post = md2mdx(p)

            if (post.tags && Array.isArray(post.tags)) {
                for (const tag of post.tags) {
                    tagInstance.add(tag, post)
                }
            }

            const cate = resolveCategory(getRelativePathArray(root, p), category)
            insert(cate.posts, post, (a, b) => a.updated - b.updated)

            archive.add(post)
            write(path.join(output, 'posts', `${post.id}.mdx`), post.content)
        }
    })

    generateArchiveMDX(archive, output)
    generateCategoryMDX(category, output)
    generateTagMDX(archive, tagInstance, output)
    const postsAndArchiveNav = generatePostAndArchiveNav(archive.list)
    const categoriesNav = generateCategoryNav(category.children)
    write(path.join(output, 'doc-nav.json'), JSON.stringify([...postsAndArchiveNav, ...categoriesNav]))
    write(path.join(output, 'all-tags.json'), JSON.stringify(Array.from(tagInstance.tags)))
    const tagGraph = Object.fromEntries(
        Array.from(tagInstance.graph.entries()).map(([key, value]) => [
            key,
            { tags: value.tags }
        ])
    )
    write(path.join(output, 'tag-graph.json'), JSON.stringify(tagGraph))

    // console.log('All tags:', allTags);
    // console.log('Tag map:', tagMap);
    // console.log('Tag Graph', JSON.stringify(tagGraph, null, 2));
}

/**
 *
 * @param {Archive} archive
 * @param {string} output output path of mdx
 */
async function generateArchiveMDX(archive, output) {
    const root = path.join(output, 'archive')

    // archive/index.mdx
    const archiveIndex = archive2mdx(
        'Archive', // title
        // description
        'Welcome to the Archive Page of my blog! Here, you can browse through a chronological collection of all my posts since I embarked on this writing journey',
        () => renderYears(archive.list))
    write(path.join(root, 'index.mdx'), archiveIndex)

    // archive/2020/index.mdx
    archive.list.forEach(year => {
        const yearIndex = archive2mdx(
            `\"${year.year}\"`, // title
            // description
            ` I hope you find joy in exploring these pages as much as I found in writing them. Thank you for being part of this journey with me!`,
            () => renderYear(year, 2))
        write(path.join(root, `${year.year}/index.mdx`), yearIndex)

        // archive/2020/5.mdx
        year.months.forEach(month => {
            const title = `${year.year} ${MONTHS[month.month]}`
            const monthMdx = archive2mdx(
                title, // title
                `Each entry is a snapshot of my life at that moment—filled with lessons learned, memories made, and the evolution of my thoughts.`, // description
                () => renderMonth(month))
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
    const categoriesIndex = categories2mdx(
        'Category',
        'This is where you can navigate through the various themes and topics that make up my journey. Each category represents a unique aspect of my life, filled with stories, insights, and reflections that I hope will resonate with you.',
        () => renderCategory(category, true))
    write(path.join(root, 'index.mdx'), categoriesIndex)

    generateChildren(category.children)

    /**
     *
     * @param {Category[]} children
     */
    function generateChildren(children) {
        children.forEach(child => {
            const categoryIndex = categories2mdx(
                child.title,
                `Welcome to the ${child.title} section of my blog, Here, you'll find a collection of posts that reflect my thoughts, experiences, and insights on personal growth`,
                () => renderCategory(child, false, 1))
            if (!child.children.length) {
                generateChildren(child.children)
                write(path.join(root, `${child.title}.mdx`), categoryIndex)
            } else {
                write(path.join(root, `${child.title}/index.mdx`), categoryIndex)
            }
        })
    }
}

/**
 *
 * @param {Archive} archive
 * @param {Tag} tagInstance
 * @param {string} output
 */
async function generateTagMDX(archive, tagInstance, output) {
    const root = path.join(output, 'tag')

    // tag/index.mdx
    const tagIndex = tag2mdx('All Tags', 'This is Tag Page', () => renderTagIndex(archive.list))
    write(path.join(root, 'index.mdx'), tagIndex)

    // tag/tag-name.mdx
    tagInstance.list.forEach(({ name }) => {
        const tagMdx = tag2mdx(name, '', () => renderTagPost(tagInstance.get(name), 2))
        write(path.join(root, `${name.replace(/\s+/g, '-')}.mdx`), tagMdx)
    })

    // tag/tag-combined.mdx
    tagInstance.graph.forEach(({ posts }, name) => {
        const tagMdx = tag2mdx(name, '', () => renderTagPost(posts, 2))
        write(path.join(root, `${name}.mdx`), tagMdx)
    })

}