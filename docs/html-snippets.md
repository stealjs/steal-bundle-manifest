<!--
@page steal-bundle-manifest.snippets Generating HTML Snippets
@parent StealJS.production
-->

When using [optimized builds](https://stealjs.com/docs/steal-tools.optimize.html) with [steal-tools](https://github.com/stealjs/steal-tools), separate bundles are created which are able to be loaded in parallel via `async` script tags like so:

```html
<script src="/dist/bundles/app/app.js" async></script>
<script src="/dist/bundles/app/page-one.js" async></script>
```

Given that steal-tools intelligently splits bundles to optimize for page load times, you don't necessary *know* which bundles are going to be created. You might have a new bundle be created, for example, when you add a new dependency to your project.

This is where the __bundle manifest__ file comes into play. It creates a file that can be used to know, for a given entry module, what bundles (JavaScript and CSS) need to be loaded.

In this guide we'll take an existing build script and update it to generate snippets of HTML, that you can use from your server-side templating engine.

## Creating the bundle manifest

If you've checked out the [progressive loading guide](https://stealjs.com/docs/StealJS.guides.progressive_loading.html) then you have probably seen (or built) the [myhub](https://github.com/stealjs/myhub) app. We're going to use this app as the example, but you can use your existing StealJS app as well.

If you'd like to follow along, start by cloning the myhub app from GitHub:

```
git clone git@github.com:stealjs/myhub.git
```

Then change the **build.js** file (if using your own app you likely have a similar file, and if not you can create one). It currently looks like:

```js
var stealTools = require("steal-tools");

stealTools.build({}, {
  bundleSteal: true
});
```

Change it to look like this instead:

```js
var stealTools = require("steal-tools");

stealTools.optimize({}, {
  bundleManifest: true
});
```

Note here:

1) This uses the `stealTools.optimize` function rather than `stealTools.build`. This build is needed in order to use the async script tags described before.
2) The `bundleManifest: true` option is used to generate the bundle manifest file that is used by [steal-bundle-manifest](https://stealjs.com/docs/steal-bundle-manifest.html).

## Generating snippets

The goal here is to create snippets of HTML that we can save to a folder and then use in our backend application server. To do this we will use [steal-bundle-manifest](https://github.com/stealjs/steal-bundle-manifest).

We'll create these snippets in a subfolder of the generate `dist/` folder, `dist/snippets`. First let's install a couple of utilities we need:

```shell
npm install steal-bundle-manifest make-dir --save
```

In addition to steal-bundle-manifest, we are also installing [make-dir](https://www.npmjs.com/package/make-dir), a library to let us recursively create directories.

Create a new file **generate-snippets.js** and paste this code:

```js
var BundleManifest = require("steal-bundle-manifest");
var bundles = require("./package.json").steal.bundle;
var fs = require("fs");

module.exports = function(){
  var manifest = new BundleManifest();

  bundles.forEach(bundleName => {
    var bundle = manifest.for(bundleName);
    var prefix = bundleName.split('/').pop();
    var fnprefix = `dist/snippets/${prefix}`;

    var styles = bundle.assets.filter(a => a.type === 'style');
    var stylesHTML = bundle.toHTML(styles);
    fs.writeFile(`${fnprefix}-styles.html`, stylesHTML, () => {});

    var scripts = bundle.assets.filter(a => a.type === 'script');
    var scriptsHTML = bundle.toHTML(scripts);
    fs.writeFile(`${fnprefix}-scripts.html`, scriptsHTML, () => {});
  });
};
```

And update your **build.js** script to use it:

```js
var stealTools = require("steal-tools");
var makeDir = require("make-dir");
var generateSnippets = require("./generate-snippets");

stealTools.optimize({}, {
  bundleManifest: true
})
.then(() => makeDir("dist/snippets"))
.then(generateSnippets);
```

What this does is:

1. Reads the `steal.bundle` property from your package.json to determine which bundles should have HTML snippets created for.
2. Creates a build that includes the bundle manifest.
3. Uses steal-bundle-manifest to create HTML snippets for *styles* and *scripts*, and saves them as `dist/snippets/page-scripts.html` and `dist/snippets/page-styles.html`.

You can run this script with:

```
node build.js
```

Which should give you a `dist/snippets` folder that looks like:

<img width="619" alt="snippets-folder" style="background-color:transparent;border:none;" src="https://user-images.githubusercontent.com/361671/29893772-2c059df0-8da1-11e7-9f7e-6a6c73065a9e.png">

## Add snippets to your route views

This part differs depending on which application framework you are using.  Whether you are using Ruby on Rails or Java or something else, it's best to refer to your framework's documentation on how to use HTML snippets in your templates.

This example shows use in PHP, using the include statement.

```php
<!doctype html>
<html lang="en">
  <head>
    <title></title>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <?php include('dist/snippets/puppies-styles.html'); ?>
  </head>
  <body>
    <div class="container">Hello World.</div>

    <?php include('dist/snippets/puppies-scripts.html'); ?>
  </body>
</html>
```

And that's it! Now every time you run your build you will also generate these snippets of HTML, so that every JavaScript bundle can load in parallel.
