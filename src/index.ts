interface ResolvablePromise<T> extends Promise<T> {
  resolve: (value: T) => void;
  reject: (error: Error) => void;
}

type Assets = { js: string[] };
type Group = Map<HtmlWebpackCombineMultipleConfigsPlugin, ResolvablePromise<Assets>>;

const defaultGroupId = Symbol('defaultGroupId');
const groups = new Map<any, Group>();

// YMNN_
const uniq = <T>(arr: T[]): T[] => [...new Set(arr)];
const flat = <T>(arr: T[][]): T[] => [].concat(...arr);

/**
 * A webpack plugin that allows injecting script tags from multiple webpack configs into one HTML file.
 * See [this issue](https://github.com/jantimon/html-webpack-plugin/issues/782) on GitHub for more.
 * Based on [this gist](https://gist.github.com/robatwilliams/36a95119ae5adcd734a73f642f749cc3).
 *
 * IMPORTANT: Each webpack config needs to have its own `HtmlWebpackPlugin` instance for this plugin to work properly.
 */
class HtmlWebpackCombineMultipleConfigsPlugin {
  /**
   * Set to true if you want to alter script tags to include 
   * `type="module"` and `nomodule` attributes based on `legacyPrefix`.
   */
  static alterTags = false;

  /** 
   * If `alterTags` is true, scripts that contain this string will receive the `nomodule` tag.
   */
  static legacyPrefix = 'legacy';

  /**
   * Same as `legacyPrefix`.
   */
  static legacySuffix = 'legacy';
  
  private group: Group;

  constructor({ groupId = defaultGroupId }: { groupId?: any } = {}) {
    if (!groups.get(groupId)) {
      groups.set(groupId, new Map());
    }
    this.group = groups.get(groupId);
  }

  apply(compiler) {
    if (compiler.hooks) {
      compiler.hooks.compilation.tap(this.constructor.name, this.compilation.bind(this))
    } else {
      throw Error(`
        You are using this plugin with an outdated version of webpack. 
        This plugin was tested against 4.39.1 only.
      `.replace(/\s+/g, ' '))
    }
  }

  compilation(compilation) {
    if (compilation.compiler.name === 'HtmlWebpackCompiler') {
      if (this.group.has(this)) {
        throw Error(`
          Looks like you are trying to reuse the same plugin instance in more than one webpack config.
          For this plugin to work properly, create new instances for each webpack config.
      `.replace(/\s+/g, ' '));
      }
      this.group.set(this, resolvablePromise<Assets>());
    }

    // Getting the HtmlWebpackPlugin instance form the plugins array for... reasons.
    const plugin = (compilation.compiler.options.plugins || [])
      .find(p => p.constructor && p.constructor.name === 'HtmlWebpackPlugin');

    if (plugin && plugin.constructor && plugin.constructor.getHooks) {
      const hooks = plugin.constructor.getHooks(compilation);
      hooks.beforeAssetTagGeneration.tapPromise(this.constructor.name, this.beforeAssetTagGeneration.bind(this));
      if (HtmlWebpackCombineMultipleConfigsPlugin.alterTags) {
        hooks.alterAssetTags.tapPromise(this.constructor.name, this.alterAssetTags.bind(this));
      }
    } else {
      throw Error(`
        You are using this plugin with an outdated version of html-webpack-plugin. 
        This plugin was tested against 4.0.0-beta.8 only.
      `.replace(/\s+/g, ' '));
    }
  }

  beforeAssetTagGeneration(data: { assets: Assets }) {
    // Resolve the promise with the assets of this compilation,
    // so we can combine them later
    this.group.get(this).resolve({
      js: data.assets.js,
    });

    // "Blocking" until all compilations have contributed their assets.
    const allAssetTagsGenerated = Promise.all(this.group.values());

    // Now we have the assets of each compilation,
    // so we update the html webpack plugin data and continue.
    return allAssetTagsGenerated.then((assetsArray: Assets[]) => {
      const allAssets = {
        js: uniq(flat(assetsArray.map(_ => _.js))),
      };
      Object.assign(data.assets, allAssets);
      return data;
    });
  }

  alterAssetTags(htmlPluginData) {
    const bodyTags = htmlPluginData.assetTags.scripts.map((scriptTag) => {
      const { attributes } = scriptTag
      const { legacyPrefix, legacySuffix } = HtmlWebpackCombineMultipleConfigsPlugin
      const src = attributes.src.toLowerCase()
      const isLegacy = src.includes(legacyPrefix) || src.includes(legacySuffix)
      return {
        ...scriptTag,
        attributes: {
          ...attributes,
          ...isLegacy ? { nomodule: true } : { type: 'module' },
        },
      };
    });

    return Promise.resolve(Object.assign(htmlPluginData, { bodyTags }));
  }
}

function resolvablePromise<T>(): ResolvablePromise<T> {
  let resolve, reject;
  const p = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  }) as ResolvablePromise<T>;
  p.resolve = resolve;
  p.reject = reject;
  return p;
}

module.exports = HtmlWebpackCombineMultipleConfigsPlugin;
module.exports.HtmlWebpackCombineMultipleConfigsPlugin = HtmlWebpackCombineMultipleConfigsPlugin;
