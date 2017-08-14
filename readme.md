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

## License

MIT
