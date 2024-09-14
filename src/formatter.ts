import { Glob } from "bun";
import { unlink } from "node:fs/promises";
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import  fs from "node:fs"


const clean_trailing = async () => {
    const glob = new Glob("res/**/*.html");
    for await (const file of glob.scan(".")) {
        const f = Bun.file(file);
        const c = await f.text();
        const d = c.replace("\n					<", "");
        await Bun.write(f, d);
    }
}

const flatten_filename = async(path: string) => {
    // const glob = new Glob("*/.html")
    const glob = new Glob("*/*.html")
    for await (const file of glob.scan(path)) {
        console.log(file)
        // continue
        const new_filename = file.replaceAll("/", "_")
        const f = Bun.file(`${path}/${file}`)
        const new_f = Bun.file(`${path}/${new_filename}`)
        await Bun.write(new_f, await f.text())
        await unlink(`${path}/${file}`)
        console.log(`Renamed ${path}/${file} to ${path}/${new_filename}`)
    }
}

const clean_emptydirs = async (path: string) => {
    const files = await readdir(path)
    const dirs = files.filter((x) => !x.endsWith(".html"))
    
    const check_remove_dir = async(d: string) => {
        const files = await readdir(d)
        if (files.length === 0) {
            console.log(`Removing ${d}`)
            fs.rmdirSync(d)
        }
    }
    await Promise.all(dirs.map((x) => check_remove_dir(join(path, x))))
}

await clean_emptydirs("inner");
