# HTML Webpack Combine Multiple Configs Plugin
This plugin allows script assets from multiple webpack configs to be injected into the same HTML template via `HtmlWebpackPlugin`.

This is useful when using two babel-env targets for legacy and `esmodules` browsers. That's why this plugin can also alter script tags to include either `type="module"` or `nomodule`. This behavior is opt-in. See [examples](examples/example-basic) for more.
Note that you will also need a `nomodule` [fix for Safari 10.1](https://gist.github.com/samthor/64b114e4a4f539915a95b91ffd340acc) in that case.

Based on [this gist](https://gist.github.com/robatwilliams/36a95119ae5adcd734a73f642f749cc3). 
See [this issue](https://github.com/jantimon/html-webpack-plugin/issues/782) on GitHub for more.
Unlike the code found there, this plugin _does not_ contain a race condition that sometimes caused invalid HTML to be generated[^1].

## Install

```bash
npm install --save-dev html-webpack-combine-multiple-configs-plugin
```

or just [grab the source](https://unpkg.com/html-webpack-combine-multiple-configs-plugin) directly and modify it to your needs.

## Usage

```js
module.exports = [
  {
    ...config1,
    plugins: [
      new HtmlWebpackPlugin(),
      new HtmlWebpackCombineMultipleConfigsPlugin(),
    ],
  }, 
  {
    ...config2,
    plugins: [
      // Make sure each config has its own instance!
      // Do not share plugins between configs!
      new HtmlWebpackPlugin(),
      new HtmlWebpackCombineMultipleConfigsPlugin(),
    ], 
  },
]
```

## Compatibility
This library was tested against `html-webpack-plugin@4.0.0-beta.8` only. Buyer beware.

## Footnotes

[^1]: Technically it does contain the same race condition because it's outside the scope of this plugin to fix it. However, since this plugin waits for all configs to contribute their assets before proceeding to render the HTML, it won't matter in practice because the output will be the same regardless of which compilation finishes first. To be extra careful you can provide a unique `filename` to each `HtmlWebpackPlugin`.
