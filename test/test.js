const assert = require("assert");
const BundleManifest = require("../index.js");
const mock = require("mock-fs");

describe("BundleManifest", function(){
	describe("constructor", function(){
		it("can be instantiated with no arguments", function(){
			new BundleManifest();
			assert.ok(true);
		});
		it("can be instantiated with an object", function(){
			new BundleManifest({});
			assert.ok(true);
		});
	});
	describe("for()", function(){
		before(function(){
			mock({
				"dist/bundles.json": `{
					"app@1.0.0#index": {
						"dist/bundles/app/app.js": {
							"type": "script",
							"weight": 2
						},
						"dist/bundles/app/puppies.js": {
							"type": "script",
							"weight": 2
						},
						"dist/bundles/app/app.css": {
							"type": "style",
							"weight": 1
						},
						"dist/bundles/app/index.css": {
							"type": "style",
							"weight": 1
						}
					}
				}`
			});
		});
		after(function(){
			mock.restore();
		});

		it("Returns a Route for the given route", function(){
			const manifest = new BundleManifest();
			const route = manifest.for("index");
			assert.ok(route, "Got a route");
		});

		describe("Route", function(){
			before(function(){
				const manifest = new BundleManifest({ serverRoot: "/app" });
				this.route = manifest.for("index");
			});

			it(".assets is an array", function(){
				assert.ok(this.route.assets instanceof Array, "It is an array");
			});

			it("filters to 2 scripts", function(){
				let route = this.route;
				let scripts = route.assets.filter(a => a.type === "script");
				assert.equal(scripts.length, 2);
			});

			it("filters to 2 styles", function(){
				let route = this.route;
				let styles = route.assets.filter(a => a.type === "style");
				assert.equal(styles.length, 2);
			});

			it("Produces the correct HTML for scripts", function(){
				let route = this.route;
				let scripts = route.assets.filter(a => a.type === "script");
				let html = route.toHTML(scripts);

				assert.equal(html, `
					<script src="/app/dist/bundles/app/puppies.js" async></script><script src="/app/dist/bundles/app/app.js" async></script>
				`.trim(), "correct scripts!");
			});

			it("Producses the correct HTML for styles", function(){
				let route = this.route;
				let styles = route.assets.filter(a => a.type === "style");
				let html = route.toHTML(styles);

				assert.equal(html, `
					<link rel="stylesheet" href="/app/dist/bundles/app/app.css"><link rel="stylesheet" href="/app/dist/bundles/app/index.css">
				`.trim(), "correct scripts!");

			});
		});
	});
});
