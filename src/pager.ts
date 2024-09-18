import type { NewsItem } from ".";
import { all_lists } from "./settings";
// fetching pages saved in `list.json`
import { type Limiter, genLimitWorker, genStater } from "./utils";

console.log("Starting pager...");

const content_extractor = /<div class="edittext">(.+?)<\/div>/gs;
const img_extractor = /<img src="(.+?)"/gs;

const fetchHtmlPage = async (item: NewsItem, limiter: Limiter) => {
	const url = item.url;
	const title = item.title;
	await limiter();
	console.log(`Fetching ${title}`);
	const f = await fetch(url);
	const html = await f.text();
	const res = content_extractor.exec(html);
	if (res === null) {
		return null;
	}
	let content = res[1].trim();
	// replace image with correct url
	const imgs = content.matchAll(img_extractor);
	for (const img of imgs) {
		const img_url = `https://www.hitsz.edu.cn${img[1]}`;
		content = content.replaceAll(img[0], `<img src="${img_url}"`);
	}
	const save_filename = Bun.hash(title);
	await Bun.write(`res2/${save_filename}.html`, content);
	item.fetched = true;
	console.log(`Fetched ${title}`);
};

const { state, saveFile } = await genStater(all_lists);
const saver = setInterval(() => {
	saveFile(state);
}, 5000);
const limiter = genLimitWorker(400, 4);
while (true) {
	const todo_list = (
		await Promise.all(
			state.news_list
				.filter((x) => x.url.startsWith("https://www.hitsz.edu.cn/"))
				.map(async (x) => {
					const f = Bun.file(`res2/${Bun.hash(x.title)}.html`);
					const has = await f.exists();
					if (has) {
						return null;
					}
					return x;
				}),
		)
	).filter((x) => x !== null);
	const pending_tasks = todo_list.map((x) => fetchHtmlPage(x, limiter));
	if (pending_tasks.length === 0) break;
	console.log("Todo: ", pending_tasks.length);
	await Promise.all(pending_tasks);
}
console.log("All Done!");
saveFile(state);
clearInterval(saver);
