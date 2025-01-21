#!/usr/bin/env node
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { program } from 'commander';
import { migrating2mdx } from './migrating2mdx.js';

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const pkg = require(path.join(__dirname, 'package.json'));

program
    .name('blog-migration')
    .description('CLI for migrating blog content')
    .version(pkg.version, "-v, --version", "display the version number")
    .requiredOption('-i, --input-directory <path>', 'path to input directory containing blog content')
    .option('-o, --output-directory <path>', 'path to output directory for processed content')
    .requiredOption('-t, --type <type>', 'migration type (currently only "mdx" supported)')
    .action(async (options) => {
        try {
            if (options.type === 'mdx') {
                const outputDir = options.outputDirectory ? path.resolve(process.cwd(), options.outputDirectory) : 'mdx';
                migrating2mdx(options.inputDirectory, outputDir);
            } else {
                console.error(`Unsupported migration type: ${options.type}`);
                process.exit(1);
            }
        } catch (err) {
            console.log(err);

        }
    })
    .parse(process.argv);
