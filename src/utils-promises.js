import path from 'node:path'
import fs from 'node:fs/promises'

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