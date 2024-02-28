/**
 * @typedef {import('mdast').Root} Root
 * @typedef {import('mdast-util-toc').Options} Options
 * @typedef {import('unist').Node} Node
 * @typedef {import('unist').Parent} Parent
 */

import fs from 'node:fs'
import path from 'node:path'
import { generatePost } from './src/content.js'

const root = process.argv[2] || process.cwd()

// console.log('walk from root: ', root)
walk(root)

/**
 * 
 * @param {string} root 
 */
async function walk(root) {
    for (let p of fs.readdirSync(root)) {
        p = path.join(root, p)
        if (fs.lstatSync(p).isDirectory()) walk(p)
        else {
            if (p.endsWith('.md')) {
                const post = await generatePost(p)
                // console.log(post);
                const dir = 'api/content/post'
                if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
                fs.writeFileSync(`${dir}/${post.id}`, JSON.stringify(post, null, 2));
                // break;
            }
        }

    }
}
