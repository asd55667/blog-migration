import test from 'ava'

import { ast2Toc } from '../src/content.js'

test('ast node 2 toc of shadcn', t => {
    const src = {
        type: "list",
        ordered: false,
        spread: false,
        children: [
            {
                type: "listItem",
                spread: false,
                children: [
                    {
                        type: "paragraph",
                        children: [
                            {
                                type: "link",
                                title: null,
                                url: "#contents",
                                children: [{ type: "text", value: "Contents" }],
                            },
                        ],
                    },
                ],
            },
            {
                type: "listItem",
                spread: false,
                children: [
                    {
                        type: "paragraph",
                        children: [
                            {
                                type: "link",
                                title: null,
                                url: "#history",
                                children: [{ type: "text", value: "History" }],
                            },
                        ],
                    },
                    {
                        type: "list",
                        ordered: false,
                        spread: false,
                        children: [
                            {
                                type: "listItem",
                                spread: false,
                                children: [
                                    {
                                        type: "paragraph",
                                        children: [
                                            {
                                                type: "link",
                                                title: null,
                                                url: "#discovery",
                                                children: [{ type: "text", value: "Discovery" }],
                                            },
                                        ],
                                    },
                                ],
                            },
                            {
                                type: "listItem",
                                spread: false,
                                children: [
                                    {
                                        type: "paragraph",
                                        children: [
                                            {
                                                type: "link",
                                                title: null,
                                                url: "#name-and-symbol",
                                                children: [{ type: "text", value: "Name and symbol" }],
                                            },
                                        ],
                                    },
                                ],
                            },
                            {
                                type: "listItem",
                                spread: false,
                                children: [
                                    {
                                        type: "paragraph",
                                        children: [
                                            {
                                                type: "link",
                                                title: null,
                                                url: "#planet-x-disproved",
                                                children: [
                                                    { type: "text", value: "Planet X disproved" },
                                                ],
                                            },
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
            {
                type: "listItem",
                spread: false,
                children: [
                    {
                        type: "paragraph",
                        children: [
                            {
                                type: "link",
                                title: null,
                                url: "#orbit",
                                children: [{ type: "text", value: "Orbit" }],
                            },
                        ],
                    },
                ],
            },
        ],
    }
    const dst = {
        title: "",
        url: "",
        items: [
            {
                title: "Contents",
                url: "#contents",
                items: []
            },
            {
                title: "History",
                url: "#history",
                items: [
                    {
                        title: "Discovery",
                        url: "#discovery",
                        items: []
                    },
                    {
                        title: "Name and symbol",
                        url: "#name-and-symbol",
                        items: []
                    },
                    {
                        title: "Planet X disproved",
                        url: "#planet-x-disproved",
                        items: []
                    }
                ]
            },
            {
                title: "Orbit",
                url: "#orbit",
                items: []
            }
        ]
    }

    t.deepEqual(ast2Toc(src), dst)
})



