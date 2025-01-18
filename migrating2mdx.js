import path from 'node:path'

import { md2mdx } from './src/md2mdx.js'
import { write } from './src/utils.js'
import { walk } from './src/utils-promises.js'
import { Archive, archive2mdx } from './src/archive.js'
import { renderYears, renderYear, renderMonth } from './src/ui.js'
import { MONTHS } from './src/data.js'

const root = process.argv[2] || process.cwd()
const output = process.argv[3] || process.cwd()


migrating2mdx(root)

/**
 * migrate from .md to .mdx
 * @param {string} root root path of blogs
 */
async function migrating2mdx(root) {

    const archive = new Archive()

    await walk(root, async (p) => {
        if (path.extname(p) === '.md') {
            const post = md2mdx(p)
            archive.add(post)
            write(path.join(output, 'posts', `${post.id}.mdx`), post.content)
        }
    })

    generateArchive(archive)
}

/**
 * 
 * @param {Archive} archive 
 */
async function generateArchive(archive) {
    const root = path.join(output, 'archive')

    // archive/index.mdx
    const archiveIndex = archive2mdx('Archive', 'What I have been through', () => renderYears(archive.list))
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