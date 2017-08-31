<!--
@page steal-bundle-manifest.server Server templating in Node
@parent StealJS.production
-->

> Note that this guide is intended for Node.js users. If you are using a different language/server for your backend application check out the [Generating HTML Snippets](//stealjs.com/docs/steal-bundle-manifest.snippets.html) guide instead.

Bundle manifest files give you the information needed to know which `<script>` and `<link>` tags are needed for each **bundle** in your application. This guide will go through setting up a basic [Express](https://expressjs.com/) server, and using [steal-bundle-manifest](https://github.com/stealjs/steal-bundle-manifest) to attach the correct HTML needed, as well as provide `Link; rel=preload` headers (which will inform the browser to start loading the assets early).

## Setup

We will be using the [myhub](https://github.com/stealjs/myhub) app as a starting point. You can substitute your app if you want, otherwise clone the repo:

```
git clone git@github.com:stealjs/myhub.git
```

Next install the dependencies we need, there are just a few:

```js
npm install steal-bundle-manifest express --save
```

## Create server script

Create the following **server.js** file in the root of the project. For now it is just a skeleton, later we'll update it to include a template (using template strings) to send the HTML for each route.

```js
const express = require("express");
const app = express();

app.get("/",
  function(req, res){

  });

app.get("/puppies",
  function(req, res){

  });

app.get("/weather",
  function(req, res){

  });

app.use(express.static(__dirname));
app.listen(8080);
console.log(`Listening at http://localhost:8080`);
```

Next, update the **myhub.js** script to use pathnames, rather than hashes, to determine which page to show:

```js
import $ from "jquery";

import "./myhub.less";
import "bootstrap/dist/css/bootstrap.css";

$("body").append(`
    <div class="container">
        <h1>Goodbye script tags!</h1>
        <a href="/weather">Weather</a> <a href="/puppies">Puppies</a>
        <div id="main"/>
    </div>
`);

var updatePage = function() {
  var page = window.location.pathname.substr(1);
  if (!page) {
    $("#main").html("Welcome home");
  } else {
    steal.import(`myhub/${page}/${page}`).then(function(moduleOrPlugin) {
      var plugin = typeof moduleOrPlugin === "function"
        ? moduleOrPlugin
        : moduleOrPlugin["default"];
      plugin("#main");
    });
  }
};

updatePage();
```

@highlight 15-16,19

And then update your **server.js** to look like:

```js
const express = require("express");
const app = express();
const BundleManifest = require("steal-bundle-manifest");

function template(bundle, title) {
  var scripts = bundle.assets.filter(a => a.type === "script");
  var styles = bundle.assets.filter(a => a.type === "style");

  return `
    <!doctype html>
    <html lang="en">
      <head>
        <title>${title}</title>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        ${bundle.toHTML(styles)}
      </head>
      <body>
        ${bundle.toHTML(scripts)}
      </body>
    </html>
  `
}

var manifest = new BundleManifest();

app.get("/",
  function(req, res){
    var bundle = manifest.for("myhub/");
    bundle.push(req, res);

    var html = template(bundle, "myhub");
    res.send(html);
  });

app.get("/puppies",
  function(req, res){
    var bundle = manifest.for("puppies/");
    bundle.push(req, res);

    var html = template(bundle, "Puppies");
    res.send(html);
  });

app.get("/weather",
  function(req, res){
    var bundle = manifest.for("weather/");
    bundle.push(req, res);

    var html = template(bundle, "Weather");
    res.send(html);
  });

app.use(express.static(__dirname));

app.listen(8080);
```

@highlight 3,5-25,27,31-35,40-44,49-53

Notice what this does:

1. Uses `manifest.for()` to get a bundle object.
2. Filters on `bundle.assets` to divide the assets between scripts and styles.
3. Passes these arrays into `bundle.toHTML()` to generate snippets of HTML, injected into the template literal.
4. Uses `bundle.push()` to add the relevant Link headers.

Now when you load the app on the puppies page your HTML looks like:

```html
<!doctype html>
<html lang="en">
  <head>
    <title>Puppies</title>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <link rel="stylesheet" href="/dist/bundles/myhub/myhub.css">
    <link rel="stylesheet" href="/dist/bundles/myhub/puppies/puppies.css">
  </head>
  <body>
    <script src="/dist/bundles/myhub/puppies/puppies.js" async></script>
    <script src="/dist/bundles/myhub/myhub.js" async></script>
  </body>
</html>
```

In your devtools, if you look at the request for `/puppies` you'll see this:

<img alt="devtools" style="background-color:transparent;border:none;" src="https://user-images.githubusercontent.com/361671/29938073-8b0be6c4-8e55-11e7-9688-6c3690412ebd.png">

Notice that there are *Link* headers for each of the assets on the page.

## Using with a templating language

If you're using a Node server there's a good chance you are using a server templating language like EJS, Pug, or Handlebars. If that's the case, you can directly pass the `scripts` and `styles` arrays to your templating engine like so:

```js
template({
	scripts: scripts,
	styles: styles
})
```

And then use them in your template directly. This example is in Handlebars/Mustache.

```mustache
<!doctype html>
<html lang="en">
  <head>
	<title>${title}</title>
	<meta charset="utf-8">
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<meta name="viewport" content="width=device-width, initial-scale=1">

	{{#styles}}
		<link rel="stylesheet" href="{{path}}">
	{{/styles}}
	${bundle.toHTML(styles)}
  </head>
  <body>
  	{{#scripts}}
  		<script src="{{path}}" async></script>
	{{/scripts}}
  </body>
</html>
```
