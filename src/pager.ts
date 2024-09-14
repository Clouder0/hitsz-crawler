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
	if (title.length > 20) {
		await Bun.write(`res/${title.substring(0, 20)}.html`, content);
	} else {
		await Bun.write(`res/${title}.html`, content);
	}
	item.fetched = true;
	console.log(`Fetched ${title}`);
};

const { state, saveFile } = await genStater(all_lists);
const saver = setInterval(() => {
	saveFile(state);
}, 5000);
const limiter = genLimitWorker(1000, 3);
const pending_tasks = state.news_list
	.filter((x) => !x.fetched).filter((x) => x.url.startsWith("https://www.hitsz.edu.cn/"))
	.map((x) => fetchHtmlPage(x, limiter));
await Promise.all(pending_tasks);
console.log("All Done!");
saveFile(state);
clearInterval(saver);
