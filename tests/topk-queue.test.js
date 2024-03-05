// https://github.com/datastructures-js/priority-queue/blob/master/test/TopKQueue.test.js

import test from 'ava';
import { TopKQueue } from '../src/topk-queue.js';

/** @type {(a: {id:number}, b: {id:number}) => number} */
const numComparator = (a, b) => a.id - b.id;
const numValues = [
    { id: 50 },
    { id: 80 },
    { id: 30 },
    { id: 90 },
    { id: 60 },
    { id: 40 },
    { id: 20 }
];

const charComparator = (a, b) => (
    a.id < b.id ? 1 : -1
);
const charValues = [
    { id: 'm' },
    { id: 'x' },
    { id: 'f' },
    { id: 'b' },
    { id: 'z' },
    { id: 'k' },
    { id: 'c' }
];


test('TopKQueue with min logic', t => {
    const capacity = 3
    const minQ = new TopKQueue(numComparator, capacity);
    numValues.forEach((value) => minQ.enqueue(value));

    t.deepEqual(minQ.list[0], numValues.slice().sort(numComparator)[capacity - 1])

    t.deepEqual(minQ.front(), { id: 40 })

    t.deepEqual(minQ.size, capacity)

    t.deepEqual(minQ.isEmpty(), false)

    t.deepEqual(minQ.dequeue(), { id: 40 })
    t.deepEqual(minQ.dequeue(), { id: 30 })
    t.deepEqual(minQ.dequeue(), { id: 20 })
    t.deepEqual(minQ.isEmpty(), true)
});
