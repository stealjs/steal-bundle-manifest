const fs = require("fs");
const normalize = require("steal-fuzzy-normalize");
const path = require("path");
const StealPush = require("steal-push").StealPush;

function isScript(asset) {
	return asset.type === "script";
}

class Route {
	constructor(assets, push, manifest) {
		var assets = Object.keys(assets).reduce(function(acc, key){
			let obj = Object.assign({ path: key }, assets[key]);
			acc.push(obj);
			return acc;
		}, []);

		assets.sort(function(a, b) {
			if(isScript(a) && isScript(b)) {
				return 1;
			} else {
				return -1;
			}
		});

		this.assets = assets;
		this.manifest = manifest;
		this.push = push;
	}

	toHTML(assets) {
		let out = "";
		for(var i = 0, len = assets.length; i < len; i++) {
			let item = assets[i];
			let pth = path.join(this.manifest.options.serverRoot, item.path);

			switch(item.type) {
				case "style":
					out += `<link rel="stylesheet" href="${pth}">`;
					break;
				case "script":
					out += `<script src="${pth}" async></script>`;
					break;
				default:
					throw new Error(`Creating html for '${type}' is not currently supported`);
			}
		}
		return out;

	}
}

class BundleManifest {
	constructor(options = {}) {
		this.options = Object.assign({
			manifest: "dist/bundles.json",
			serverRoot: "/",
			root: process.cwd()
		}, options);
		this.manifest = null;
		this.stealPush = new StealPush(Object.assign({}, this.options));
	}

	_load() {
		if(this.manifest === null) {
			let data = fs.readFileSync(this.options.manifest);
			this.manifest = JSON.parse(data);
		}
	}

	for(identifierOrRoute) {
		this._load();
		const assets = normalize(identifierOrRoute, this.manifest);
		const push = this.stealPush.for(identifierOrRoute);
		return new Route(assets, push, this);
	}
}

module.exports = BundleManifest;
