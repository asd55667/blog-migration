import { defineConfig } from 'rollup'
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default defineConfig({
  input: ['cli.js'],
  output: {
    dir: 'dist',
    format: 'es',
    sourcemap: false,
    preserveModules: false,
    minifyInternalExports: false
  },
  plugins: [
    nodeResolve(),
    // @ts-expect-error
    commonjs(),
  ]
});