import { defineConfig, type InlineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import vueComponents from 'unplugin-vue-components/vite'
import autoImport from 'unplugin-auto-import/vite'
import aeriaIcons from 'aeria-icons'
import { icons } from 'aeria-icons/common'
import { getInstanceConfig } from './instance.js'
import transformIndexHtml from './plugins/transform-index-html.js'
import loadYaml from './plugins/load-yaml.js'

export default defineConfig(async () => {
  const instanceConfig = await getInstanceConfig()
  const config: InlineConfig = {
    publicDir: 'static',
    resolve: {
      alias: {
        'bson': fileURLToPath(new URL('bson.cjs', import.meta.resolve('bson'))),
      },
    },
    envPrefix: [
      'VITE_',
      'AERIA_',
    ],
    plugins: [
      aeriaIcons({
        hash: true,
        libraries: instanceConfig.icons?.libraries || [],
        async preEmit() {
          const userIcons = await import(process.cwd() + '/../api/node_modules/.aeria/icons.mjs')
          const builtinsIcons = await import('@aeriajs/builtins-icons')

          userIcons.icons.forEach((icon: string) => {
            icons.add(icon)
          })

          builtinsIcons.icons.forEach((icon: string) => {
            icons.add(icon)
          })
        },
      }),
      autoImport({
        exclude: [
          /\/node_modules\//,
          /\.git\//,
          /@?aeria-ui/,
        ],
        imports: [
          'vue',
          'vue-router',
          {
            'aeria-ui': [
              'useStore',
              'useParentStore',
              'useClipboard',
              'useBreakpoints',
              'useAction',
              'useNavbar',
            ],
          },
        ],
      }),
      vueComponents({
        dirs: [
          process.cwd() + '/components',
          process.cwd() + '/src/components',
        ],
        resolvers: [
          (componentName) => {
            if( /^Aeria[A-Z]/.test(componentName) ) {
              return {
                name: componentName,
                from: '@aeria-ui/ui',
              }
            }
          },
        ],
      }),
      vue(),
      transformIndexHtml(instanceConfig),
      loadYaml(),
    ],
    optimizeDeps: {
      include: [
        'bson',
        '@aeriajs/types',
        '@aeriajs/common',
      ],
      exclude: [
        'mongodb',
        'aeria-sdk',
      ],
    },
    build: {
      target: 'esnext',
      sourcemap: !!instanceConfig.sourcemap,
    },
  }

  if( instanceConfig.preserveSymlinks ) {
    config.resolve!.preserveSymlinks = true
  }

  return config
})
