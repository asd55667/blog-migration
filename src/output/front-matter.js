import { walk } from "../utils-promises.js"
import fs from "node:fs/promises"
import { write } from "../utils.js"
import path from "node:path"
import { md2fm } from "../conversion/md2fm.js"

/**
 *
 * @param {string} root
 * @param {string} output
 */
export async function migrating2fm(root, output) {
    await walk(root, async (p) => {
        if ((await fs.lstat(p)).isDirectory()) {

        } else if (path.extname(p) === '.md') {
            if (path.basename(p) === 'README.md') {
                return
            }

            const post = md2fm(p)
            write(path.join(output, `${path.basename(p, '.md')}.md`), post)
        }
    })
}