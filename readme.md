# steal-bundle-manifest

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
          ${styles.toHTML()}
        </head>
        <body>
          <h1>Orders page</h1>

          ${scripts.toHTML()}
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

Specify the location of the manifest file. If not provided then `process.cwd() + "/dist/bundles.json"` is assumed.

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

## License

MIT
