/**
 * @typedef {import('./content.js').IPost} IPost
 */

/**
 * @template T
 */
export class TopKQueue {
    /**
     * 
     * @param {(a:T, b:T) => number} comparator 
     * @param {number} capacity // capacity of queue size
     */
    constructor(comparator, capacity) {
        /**
         * @type {(a:T, b:T) => number}
         */
        this.comparator = comparator

        /**
         * @type {T[]}
         */
        this.list = []

        /**
         * @type {number}
         */
        this.capacity = capacity

        console.assert(this.capacity > 1);
    }

    get size() {
        return this.list.length;
    }

    isEmpty() {
        return !this.size
    }

    /**
     * 
     * @param {T} val 
     */
    enqueue(val) {
        if (this.list.length < this.capacity) {
            this.list.push(val)
            const size = this.list.length
            if (size === 1) return;

            this.update(this.list, size);
        } else if (this.comparator(val, this.list[0]) < 0) {
            this.list[0] = val
            this.heapify(this.list)
        }
    }

    /**
     * 
     * @param {T[]} array 
     * @param {number} n 
     */
    update(array, n) {
        // parent index count from 1
        const idx = n % 2 ? (n - 1) / 2 : n / 2
        if (this.comparator(array[n - 1], array[idx - 1]) > 0) {
            swap(array, n - 1, idx - 1)
            idx > 1 && this.update(array, idx)
        }
    }

    /**
     * 
     * @param {T[]} array 
     */
    heapify(array) {
        const n = array.length - 1
        let i = n % 2 ? (n - 1) / 2 : n / 2
        if (i === 0) this.#heapify(array, 1)

        for (; i >= 1; i--) {
            this.#heapify(array, i);
        }
    }

    /**
     * 
     * @param {T[]} array 
     * @param {number} i
     */
    #heapify(array, i) {
        const n = array.length;
        let largest = i
        let l = 2 * i
        let r = 2 * i + 1

        if (l <= n && this.comparator(array[l - 1], array[i - 1]) > 0) {
            largest = l
        }

        if (r <= n && this.comparator(array[r - 1], array[largest - 1]) > 0) {
            largest = r
        }

        if (largest !== i) {
            swap(array, i - 1, largest - 1)
            this.#heapify(array, largest)
        }
    }

    front() {
        return this.list[0]
    }

    dequeue() {
        const val = this.list.shift()
        this.heapify(this.list)
        return val
    }

    toArray() {
        return this.list.slice().sort(this.comparator)
    }
}

/**
 * @template T
 * @param {T[]} list 
 * @param {number} i 
 * @param {number} j 
 */
function swap(list, i, j) {
    const tmp = list[i]
    list[i] = list[j]
    list[j] = tmp
}