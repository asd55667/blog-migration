import fs from 'node:fs'
import path from 'node:path'

/**
 * 
 * @param {string} dir output path
 * @param {unknown} data 
 */
export function write(dir, data) {
    if (!fs.existsSync(path.dirname(dir))) fs.mkdirSync(path.dirname(dir), { recursive: true });

    console.log('write file into:', dir);
    fs.writeFileSync(dir, JSON.stringify(data, null, 2));
}