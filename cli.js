#!/usr/bin/env node
import { program } from 'commander';
import { migrating2mdx } from './migrating2mdx.js';

program
  .name('blog-migration')
  .description('CLI for migrating blog content')
  .version('1.0.0')
  .requiredOption('-i, --input-directory <path>', 'path to input directory containing blog content')
  .option('-o, --output-directory <path>', 'path to output directory for processed content')
  .requiredOption('-t, --type <type>', 'migration type (currently only "mdx" supported)')
  .parse(process.argv);

const options = program.opts();

if (options.type === 'mdx') {
  const outputDir = options.outputDirectory || 'mdx';
  migrating2mdx(options.inputDirectory, outputDir);
} else {
  console.error(`Unsupported migration type: ${options.type}`);
  process.exit(1);
}