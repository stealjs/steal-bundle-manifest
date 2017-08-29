const fs = require("fs");
const {promisify} = require("util");
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const heading = /# steal-bundle-manifest/;
const frontmatter = `
@page steal-bundle-manifest
@parent StealJS.ecosystem
`.trim();

async function build() {
	const readme = await readFile("./readme.md", "utf8");
	const out = `${frontmatter} ${readme.replace(heading, "")}`;
	writeFile("./docs/steal-bundle-manifest.md", out, "utf8");
}

build();
