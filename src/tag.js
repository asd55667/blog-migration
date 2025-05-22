import { renderPostMeta } from './ui.js'

/**
 * @typedef {import('./type.js').IPost} IPost
 */

export class Tag {
    /** @type {Set<string>} */
    tags;
    /** @type {Map<string, IPost[]>} */
    map;

    constructor() {
        this.tags = new Set()
        this.map = new Map()
    }

    get list() {
        return Array.from(this.tags).map(t => {
            return {
                name: t,
                count: this.map.get(t)?.length ?? 0
            }
        })
    }

    /**
     * Generates a navigation graph for tags.
     * Keys in the map are hyphen-separated tag paths, representing a sequence of selected tags.
     * Tags within a path key are alphabetically sorted (e.g., "tag1-tag2" where "tag1" < "tag2" alphabetically),
     * and spaces within individual tags are replaced by hyphens (e.g., "web dev" becomes "web-dev" in the key "book-web-dev").
     * Values are objects of the shape `{ tags: string[], posts: IPost[] }`, where:
     *  - `tags` is a sorted array of further original tag names available for selection from posts that match the current tag path.
     *    These further tags are not part of the current path itself.
     *  - `posts` is an array of post objects that match all original tags in the current path key.
     *
     * For example:
     * If posts exist with tags:
     *   Post1: ["book", "c", "javascript"]
     *   Post2: ["book", "c", "algorithms", "javascript"]
     *   Post3: ["book", "javascript"]
     *   Post4: ["news", "tech"]
     *
     * The graph might contain entries like:
     *   "book" -> { tags: ["algorithms", "c", "javascript"], posts: [Post1, Post2, Post3] }
     *   "c"    -> { tags: ["algorithms", "book", "javascript"], posts: [Post1, Post2] }
     *   "book-c" -> { tags: ["algorithms", "javascript"], posts: [Post1, Post2] }
     *   "algorithms-book-c" -> { tags: ["javascript"], posts: [Post2] }
     *   If a path leads to no further unique tags, its entry would be { tags: [], posts: [...] } (posts matching the path).
     *
     * @returns {Map<string, {tags: string[], posts: IPost[]}>}
     */
    get graph() {
        /** @type {Map<string, {tags: string[], posts: IPost[]}>} */
        const navigationGraph = new Map();
        /** @type {string[][]} */ // Queue stores arrays of original tag names, sorted.
        const queue = [];

        // Helper to create a canonical key from an array of original tag names
        /**
         * @param {string[]} tagArray
         * @returns {string}
         */
        const getCanonicalKey = (tagArray) => {
            if (!tagArray || tagArray.length === 0) return '';
            return [...tagArray] // Create a new array
                .sort() // Sort original tag names alphabetically
                .map(tag => tag.replace(/ /g, '-')) // Replace spaces with hyphens in each tag
                .join('-'); // Join them with hyphens
        };

        // Step 1: Initialize with single-tag paths
        for (const initialTag of this.tags) { // initialTag is an original tag name
            const pathArray = [initialTag]; // Array of original tags for this path (already sorted as it's single)
            const pathKey = getCanonicalKey(pathArray); // Canonical key

            const postsForPath = this.get(initialTag) || []; // Get posts for the original tag name

            const relatedTagsSet = new Set();
            if (postsForPath.length > 0) {
                for (const post of postsForPath) {
                    for (const tagInPost of post.tags) { // tagInPost is original
                        if (tagInPost !== initialTag) {
                            relatedTagsSet.add(tagInPost);
                        }
                    }
                }
            }
            const relatedTags = Array.from(relatedTagsSet).sort(); // Sort original related tags

            navigationGraph.set(pathKey, { tags: relatedTags, posts: postsForPath });

            if (relatedTags.length > 0) {
                // Queue contains sorted arrays of original tags
                queue.push(pathArray); // pathArray is already sorted ([initialTag])
            }
        }

        // Step 2: Iteratively build longer paths
        let head = 0;
        while (head < queue.length) {
            const currentPathArraySorted = queue[head++]; // This is an array of original tags, already sorted.

            const currentPathKeyLookup = getCanonicalKey(currentPathArraySorted);
            const pathData = navigationGraph.get(currentPathKeyLookup);

            // Should always find pathData if currentPathArraySorted came from queue properly
            // and keys are consistent.
            const nextPossibleTags = pathData?.tags; // These are original tag names, sorted.

            if (!nextPossibleTags || nextPossibleTags.length === 0) {
                continue;
            }

            for (const tagToAdd of nextPossibleTags) { // tagToAdd is an original tag name
                const tempNewPathArray = [...currentPathArraySorted, tagToAdd];
                // newPathArraySorted will be the sorted list of original tags for the new path
                const newPathArraySorted = [...tempNewPathArray].sort();

                const newPathKeyCanonical = getCanonicalKey(newPathArraySorted);

                if (navigationGraph.has(newPathKeyCanonical)) {
                    continue; // Already processed this canonical path
                }

                // Filter posts: Start with posts matching the first tag in the new sorted path,
                // then iteratively filter. All tags in newPathArraySorted are original names.
                let postsMeetingPathCriteria = this.get(newPathArraySorted[0]) || [];

                if (postsMeetingPathCriteria.length === 0 && newPathArraySorted.length > 0) {
                    navigationGraph.set(newPathKeyCanonical, { tags: [], posts: [] });
                    continue;
                }

                for (let i = 1; i < newPathArraySorted.length; i++) {
                    const tagInPath = newPathArraySorted[i]; // original tag name
                    postsMeetingPathCriteria = postsMeetingPathCriteria.filter(post => post.tags.includes(tagInPath));
                    if (postsMeetingPathCriteria.length === 0) break; // Optimization
                }

                const furtherTagsSet = new Set();
                if (postsMeetingPathCriteria.length > 0) {
                    for (const post of postsMeetingPathCriteria) {
                        for (const tagInPost of post.tags) { // original tag name
                            // Check if the tagInPost is already part of the current path (newPathArraySorted)
                            if (!newPathArraySorted.includes(tagInPost)) {
                                furtherTagsSet.add(tagInPost);
                            }
                        }
                    }
                }

                const furtherTags = Array.from(furtherTagsSet).sort(); // Sort original further tags
                navigationGraph.set(newPathKeyCanonical, { tags: furtherTags, posts: postsMeetingPathCriteria });

                if (furtherTags.length > 0) {
                    // Push sorted array of original tags to the queue
                    queue.push(newPathArraySorted);
                }
            }
        }
        return navigationGraph;
    }

    /**
     *
     * @param {string} tag
     * @param {IPost} post
     */
    add(tag, post) {
        this.tags.add(tag)
        if (!this.map.has(tag)) {
            this.map.set(tag, [])
        }

        const list = this.map.get(tag)
        if (list?.findIndex(p => p.id === post.id) !== -1) {
            return
        }
        list.push(post)
    }

    /**
     *
     * @param {string} tag
     * @returns {import('./type.js').IPost[]}
     */
    get(tag) {
        return this.map.get(tag) ?? []
    }
}


/**
 *
 * @param {string} title
 * @param {string} description
 * @param {() => string} callback
 * @returns {string}
 */
export function tag2mdx(title, description, callback) {
    let mdx = renderPostMeta({
        title,
        description
    })
    mdx += callback()
    return mdx
}