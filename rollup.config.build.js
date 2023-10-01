import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';

export default {
  input: 'src/main.ts',
  output: {
    dir: '.',
    sourcemap: 'inline',
    format: 'cjs',
    exports: 'default',
  },
  external: ['obsidian'],
  plugins: [typescript(), nodeResolve({ browser: true }), commonjs(), terser()],
  onwarn: (warning, warner) => {
    if (warning.code === 'CIRCULAR_DEPENDENCY') {
      if (warning.importer && warning.importer.startsWith('node_modules')) {
        return;
      }
    }
    warner(warning);
  },
};
