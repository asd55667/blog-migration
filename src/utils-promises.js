import path from 'node:path'
import fs from 'node:fs/promises'

/**
 * @typedef {import('./type.js').IPost} IPost
 * @typedef {import('./type.js').Context} Context
 * @typedef {import('./type.js').IPostPreview} IPostPreview
 */

/**
 * 
 * @param {string} root
 * @param {(p: string) => void} callback
 */
export async function walk(root, callback) {
    for (let p of await fs.readdir(root)) {
        p = path.join(root, p)
        callback(p)
        if ((await fs.lstat(p)).isDirectory()) await walk(p, callback)
    }
}

/**
 * 
 * @param {string} dir output path
 * @param {unknown} data 
 */
export async function write(dir, data) {
    try {
        await fs.access(path.dirname(dir))
    } catch (err) {
        fs.mkdir(path.dirname(dir), { recursive: true });
    }

    console.log('write file into:', dir);
    fs.writeFile(dir, JSON.stringify(data, null, 2));
}
