import test from 'ava'
import fs from 'node:fs/promises'
import { Category, addCategory, resolveCategory, paginateCategory, merge } from '../src/category.js'
import { getRelativePathArray } from '../src/utils.js'
import { walk } from '../src/utils-promises.js'
import { generatePost } from '../src/content.js'

const categories = new Category()

const root = 'tests/fixture'
await walk(root, async (p) => {
    if ((await fs.lstat(p)).isDirectory()) addCategory(root, p, categories)
})

test('add category', async t => {
    t.snapshot(categories)
})

test('resolve category', async t => {
    const resolved = resolveCategory(['test', 'temp'], categories)

    t.deepEqual(resolved, new Category('test', 'test', 2,
        [new Category('temp', 'temp', 1,)])
    )

})

test('paginate category', async t => {
    const categories = new Category()
    await walk(root, async (p) => {
        if ((await fs.lstat(p)).isDirectory()) {
            addCategory(root, p, categories)
        } else if (p.endsWith('.md')) {
            const post = await generatePost(p)
            const category = resolveCategory(getRelativePathArray(root, p), categories)
            category.add(post)
        }
    })

    const map = paginateCategory(categories, 5)
    for (const key of map.keys()) {
        t.assert(map.get(key).length === 1);
    }

    t.assert(map.get('/css')[0].length === 1)
    t.assert(map.get('/media')[0].length === 4)
    t.assert(map.get('/test')[0].length === 2)
    t.assert(map.get('/test/temp')[0].length === 1)
    t.assert(map.get('/ui')[0].length === 3)
    t.assert(map.get('/vue')[0].length === 2)
})


test('merge sort', t => {
    const cmp = (a, b) => a - b
    let a = [1, 2, 3]
    let b = [4, 5, 6]
    t.deepEqual(merge(a, b, cmp), [1, 2, 3, 4, 5, 6])

    a = [4, 5, 6]
    b = [1, 2, 3]
    t.deepEqual(merge(a, b, cmp), [1, 2, 3, 4, 5, 6])

    a = [1, 3, 5]
    b = [2, 4, 6]
    t.deepEqual(merge(a, b, cmp), [1, 2, 3, 4, 5, 6])
})