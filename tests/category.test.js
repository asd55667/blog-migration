import test from 'ava'
import fs from 'node:fs'
import { Category, addCategory, resolveCategory, paginateCategory, merge } from '../src/category.js'
import { getRelativePathArray, insert, walk } from '../src/utils.js'
import { generatePostSync } from '../src/content.js'

const categories = new Category()

const root = 'tests/fixture'
walk(root, (p) => {
    if (fs.lstatSync(p).isDirectory()) addCategory(root, p, categories)
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

test('paginate category', t => {
    const categories = new Category()
    walk(root, (p) => {
        if (fs.lstatSync(p).isDirectory()) {
            addCategory(root, p, categories)
        } else if (p.endsWith('.md')) {
            const post = generatePostSync(p)
            const category = resolveCategory(getRelativePathArray(root, p), categories)
            insert(category.posts, post, (a, b) => a.updated - b.updated)
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


test('insert sort', t => {
    const cmp = (a, b) => a - b
    const list = []

    insert(list, 1, cmp)
    insert(list, 3, cmp)
    insert(list, 2, cmp)

    t.deepEqual(list, [3, 2, 1])

    insert(list, 4, cmp)
    insert(list, 7, cmp)
    insert(list, 9, cmp)

    t.deepEqual(list, [9, 7, 4, 3, 2, 1])

    insert(list, 5, cmp)
    insert(list, 6, cmp)
    insert(list, 8, cmp)

    t.deepEqual(list, [9, 8, 7, 6, 5, 4, 3, 2, 1])

})