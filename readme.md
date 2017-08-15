# steal-bundle-manifest

[![Build Status](https://travis-ci.org/stealjs/steal-bundle-manifest.svg?branch=master)](https://travis-ci.org/stealjs/steal-bundle-manifest)
[![npm version](https://badge.fury.io/js/steal-bundle-manifest.svg)](http://badge.fury.io/js/steal-bundle-manifest)

**steal-bundle-manifest** is a set of tools that help with working on bundle manifest files; these are files that specify a list of assets associated with a given route. In steal, these *routes* are keyed as module names.

## Install

```shell
npm install steal-bundle-manifest --save
```

## Usage

The main export is a constructor function. Instantiating it will give you an object that can be used to pull information from a manifest. A typical usage looks like:

```js
var BundleManifest = require("steal-bundle-manifest");
var spdy = require("spdy");

var manifest = new BundleManifest({
  serverRoot: "/assets"
});

spdy.createServer({
  cert: ...,
  key: ...,
  protocols: ["h2", "http/1.1"]
}, function(req, res){
  if(req.url === "orders") {
    
    var route = manifest.for("app/orders/");

    // Calling push will cause the assets to be pushed in HTTP2.
    route.push(req, res);

    var styles = route.assets.filter(a => a.type === "style");
    var scripts = route.assets.filter(a => a.type === "script");

    res.end(`
      <html>
        <head>
          ${route.toHTML(styles)}
        </head>
        <body>
          <h1>Orders page</h1>

          ${route.toHTML(scripts)}
        </body>
      </html>
    `);

  } else {
    ... other stuff
  }
});
```

## API

### BundleManifest

A **BundleManifest** is a type that represents a bundle manifest file. Upon instantiation you can provide a single argument *manifestOptions* to specify where files are located.

#### manifestOptions

An object including the following properties:

##### manifest

Specify the location of the manifest file. If not provided then `process.cwd() + "/dist/bundles.json"` is used.

```js
var manifest = new BundleManifest({
  manifest: __dirname + "public/bundles.json"
});
```

##### root

Specify the root location from where to find the files listed in the bundle manifest.

```js
var manifest = new BundleManifest({
  root: __dirname + "/public"
});
```

##### serverRoot

Specify the server's root, from where it should look for resources. This will influence how assets are written out when using the toHTML() API.

```js
var manifest = new BundleManifest({
  serverRoot: "/assets"
});
```

Will cause scripts to be written like:

```html
<script src="/assets/dist/bundles/app/app.js"></script>
```

#### for

A method used to derive a `Route` object for a given module name. This lets you filter down the bundle manifest to just the route you are interested in.

```js
var manifest = new BundleManifest();

var route = manifest.for("app/orders/");

route.assets; // -> [ { type: "script", path: "dist/bundles..." } ]
route.push; // function(){}
```

### Route

A *Route* type is created when using `manifest.for(route)`. This is an object representing a given route (or root bundle). From here you can work with a set of `assets` for the route, filtering as necessary.

#### assets

An *Array* of all of the assets associated with this route. Use normal array methods to further derive subsets as needed. For example, you typically might want to filter the set of assets into scripts and styles so that you can generate HTML snippets for each, or to provide an array for looping in your chosen templating language.

```js
var manifest = new BundleManifest();

var route = manifest.for("app/orders");

var scripts = route.assets.filter(a => a.type === "script");
var styles = route.assets.filter(a => a.type === "style");
```

#### push

A function which, given a Node.js request and response, will send PUSH messages when using HTTP/2, and add [Preload](https://w3c.github.io/preload/#h-link-element-extensions) link headers when using HTTP/1.

This can be used *instead of* [steal-push](https://github.com/stealjs/steal-push). A typical usage with [Express](https://expressjs.com/) looks like:

```js
const spdy = require("spdy");
const express = require("express");
const BundleManifest = require("bundle-manifest");

const manifest = new BundleManifest();

app.get("/",
	manifest.for("main").push,
	function(req, res){
		...
	});

app.get("/orders",
	manifest.for("orders/").push,
	function(req, res){
		...
	});

spdy.createServer({
	key: ...,
	cert: ...,
	protocols: ["h2", "http/1.1"]
}, app).listen(8080);
```

#### toHTML

This method generates HTML for assets. For scripts it creates `<script>` tags, for styles, `<link>` tags. 

```js
var scripts = route.assets.filter(a => a.type === "script");

route.toHTML(scripts); // -> "<script src="/dist/bundles/app/app.js" async></script>
```

## License

MIT
