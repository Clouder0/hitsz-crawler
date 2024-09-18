// Aggregate raw html files and combine them into chunked files

import type { NewsItem } from ".";
import { all_lists } from "./settings";
import { genStater } from "./utils";

function* chunks<T>(arr: T[], n: number): Generator<T[], void, void> {
	for (let i = 0; i < arr.length; i += n) {
		yield arr.slice(i, i + n);
	}
}
const aggregate = async (
	path: string,
	outpath: string,
	items: NewsItem[],
	chunkSize: number,
) => {
	const extended = items
		.toSorted((a, b) => (a.url < b.url ? -1 : 1))
		.map((x) => ({ ...x, path: `${path}/${Bun.hash(x.title)}.html` }));
	console.log(`Chunking ${extended.length} files...`);
	for (const chunk of chunks(extended, chunkSize)) {
		const content = (
			await Promise.allSettled(
				chunk.map((x) => {
					return (async () => {
						try {
							const f = Bun.file(x.path);
							const content = await f.text();
							return `<title>${x.title}</title>\n<url>${x.url}</url>\n<content>${content}</content>`;
						} catch (e) {
							console.error(
								`Error while trying to read ${x.title}, ${x.url}, ${x.path}`,
							);
							console.error(e);
							return "";
						}
					})();
				}),
			)
		).filter((x) => x.status === "fulfilled").map((x) => x.value).join("\n\n\n\n");
		const write_path = `${outpath}/${Bun.hash(content)}.html`;
		const f = Bun.file(write_path);
		await Bun.write(f, content);
		console.log(`Wrote chunk ${write_path}`);
	}
};

const { state, saveFile } = await genStater(all_lists);
/* await aggregate(
	"inner2",
	"agg_inner2",
	state.news_list.filter((x) => x.url.startsWith("http://info.hitsz.edu.cn")),
	200,
) ;*/
await aggregate(
	"res2",
	"agg_res2",
	state.news_list.filter((x) => x.url.startsWith("https://www.hitsz.edu.cn")),
	200,
)