'use strict'

/**
 * Expose createClientConfig method.
 */

module.exports = function createClientConfig (ctx) {
  const { path, env } = require('@vuepress/shared-utils')
  const createBaseConfig = require('./createBaseConfig')

  const config = createBaseConfig(ctx)

  config
    .entry('app')
      .add(path.resolve(__dirname, '../app/clientEntry.js'))

  config.node
    .merge({
      // prevent webpack from injecting useless setImmediate polyfill because Vue
      // source contains it (although only uses it if it's native).
      setImmediate: false,
      global: false,
      process: false,
      // prevent webpack from injecting mocks to Node native modules
      // that does not make sense for the client
      dgram: 'empty',
      fs: 'empty',
      net: 'empty',
      tls: 'empty',
      child_process: 'empty'
    })

  // generate client manifest only during build
  if (process.env.NODE_ENV === 'production') {
    // This is a temp build of vue-server-renderer/client-plugin.
    // TODO Switch back to original after problems are resolved.
    // Fixes two things:
    // 1. Include CSS in preload files
    // 2. filter out useless styles.xxxxx.js chunk from mini-css-extract-plugin
    // https://github.com/webpack-contrib/mini-css-extract-plugin/issues/85
    config
      .plugin('ssr-client')
      .use(require('./ClientPlugin'), [{
        filename: 'manifest/client.json'
      }])

    config
      .plugin('optimize-css')
      .use(require('optimize-css-assets-webpack-plugin'), [{
        canPrint: false,
        cssProcessorOptions: {
          safe: true,
          autoprefixer: { disable: true },
          mergeLonghand: false
        }
      }])
  }

  if (!env.isDebug) {
    const WebpackBar = require('webpackbar')
    config
      .plugin('bar')
      .use(WebpackBar, [{
        name: 'Client',
        color: '#41b883',
        compiledIn: false
      }])
  }

  ctx.pluginAPI.options.chainWebpack.syncApply(config, false /* isServer */)

  return config
}
