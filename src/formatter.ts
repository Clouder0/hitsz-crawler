import fs from "node:fs";
import { unlink } from "node:fs/promises";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { Glob } from "bun";
import * as cheerio from "cheerio";

const clean_trailing = async () => {
	const glob = new Glob("res/**/*.html");
	for await (const file of glob.scan(".")) {
		const f = Bun.file(file);
		const c = await f.text();
		const d = c.replace("\n					<", "");
		await Bun.write(f, d);
	}
};

const flatten_filename = async (path: string) => {
	// const glob = new Glob("*/.html")
	const glob = new Glob("*/*.html");
	for await (const file of glob.scan(path)) {
		console.log(file);
		// continue
		const new_filename = file.replaceAll("/", "_");
		const f = Bun.file(`${path}/${file}`);
		const new_f = Bun.file(`${path}/${new_filename}`);
		await Bun.write(new_f, await f.text());
		await unlink(`${path}/${file}`);
		console.log(`Renamed ${path}/${file} to ${path}/${new_filename}`);
	}
};

const flatten_filename2 = async (path: string) => {
	// const glob = new Glob("*/.html")
	const glob = new Glob("*/.html");
	for await (const file of glob.scan(path)) {
		console.log(file);
		// continue
		const new_filename = file.replaceAll("/", "_");
		const f = Bun.file(`${path}/${file}`);
		const new_f = Bun.file(`${path}/${new_filename}`);
		await Bun.write(new_f, await f.text());
		await unlink(`${path}/${file}`);
		console.log(`Renamed ${path}/${file} to ${path}/${new_filename}`);
	}
};

const clean_emptydirs = async (path: string) => {
	const files = await readdir(path);
	const dirs = files.filter((x) => !x.endsWith(".html"));

	const check_remove_dir = async (d: string) => {
		const files = await readdir(d);
		if (files.length === 0) {
			console.log(`Removing ${d}`);
			fs.rmdirSync(d);
		}
	};
	await Promise.all(dirs.map((x) => check_remove_dir(join(path, x))));
};

const regulate_html = async (path: string) => {
	const glob = new Glob("*.html");
	const remove_tags = [
		"html",
		"body",
		"p",
		"strong",
		"span",
		"ul",
		"head",
		"br",
	];
	for await (const file of glob.scan(path)) {
		console.log("Regulating", file);
		const f = Bun.file(`${path}/${file}`);
		const $ = cheerio.load(await f.text());
		$("script").remove();
		$("style").remove();
		$("font").remove();
		for (const tag of remove_tags) {
			$(tag).each((i, el) => {
				if ((el as unknown as { attribs?: Record<string, unknown> }).attribs) {
					(el as unknown as { attribs?: Record<string, unknown> }).attribs = {};
				}
			});
		}
		let html = $.html().replaceAll("</p><p>", "</p>\n<p>");
		for (const tag of remove_tags) {
			html = html.replaceAll(`<${tag}>`, "");
			html = html.replaceAll(`</${tag}>`, "");
		}
		html = html
			.split("\n")
			.map((x) => x.trim())
			.filter((x) => x.length > 0)
			.join("\n");
		html = html.replaceAll("&nbsp;", " ");
		Bun.write(f, html);
	}
};

// await flatten_filename("inner2");
// await flatten_filename2("inner2");
// await clean_emptydirs("inner");
await regulate_html("res2");
await regulate_html("inner2");
