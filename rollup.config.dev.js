import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import copy from 'rollup-plugin-copy';

export default {
  input: 'src/main.ts',
  output: {
    dir: 'examples/.obsidian/plugins/tracker-gt',
    sourcemap: 'inline',
    format: 'cjs',
    exports: 'default',
  },
  external: ['obsidian'],
  plugins: [
    typescript(),
    nodeResolve({ browser: true }),
    commonjs(),
    copy({
      targets: [
        {
          src: ['styles.css', 'manifest.json'],
          dest: 'examples/.obsidian/plugins/tracker-gt',
        },
      ],
    }),
  ],
  onwarn: (warning, warner) => {
    if (warning.code === 'CIRCULAR_DEPENDENCY') {
      if (warning.importer && warning.importer.startsWith('node_modules')) {
        return;
      }
    }
    warner(warning);
  },
};
