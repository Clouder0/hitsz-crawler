import type { NewsItem } from ".";
import { all_lists, logined_cookie } from "./settings";
// fetching pages saved in `list.json`
import { type Limiter, genLimitWorker, genStater } from "./utils";

console.log("Starting pager...");

const content_regex =
	/<div id='vsb_content' class="content-con">(.+)<\/div>\s+<div class="clear">/isu;
const inline_href_regex = /href="\/(.+?)"/gm;
const fetchHtmlPage = async (item: NewsItem, limiter: Limiter) => {
	const url = item.url;
	const title = item.title;
	await limiter();
	console.log(`Fetching ${title}`);
	const f = await fetch(url, {
		headers: { Cookie: logined_cookie },
	});
	const html = await f.text();
	const res = html.match(content_regex);
	// console.log(html)
	// console.log(res)
	if (res === null) {
		return null;
	}
	// console.log(res.groups)
	let content = res[1].trim();
	// replace image with correct url
	const hrefs = content.matchAll(inline_href_regex);
	for (const href of hrefs) {
		const href_url = `http://info.hitsz.edu.cn/${href[1]}`;
		content = content.replaceAll(href[0], `href="${href_url}"`);
	}
	await Bun.write(`inner2/${Bun.hash(title)}.html`, content);
	item.fetched = true;
	console.log(`Fetched ${title}`);
};

const { state, saveFile } = await genStater(all_lists);
const saver = setInterval(() => {
	saveFile(state);
}, 5000);
const limiter = genLimitWorker(200, 5);
// const pending_items = state.news_list.filter((x) => !x.fetched).filter((x) => x.url.startsWith("http://info.hitsz.edu.cn/"));
while (true) {
	const pending_items = (
		await Promise.all(
			state.news_list
				.filter((x) => x.url.startsWith("http://info.hitsz.edu.cn/"))
				.map(async (x) => {
					const f = Bun.file(`inner2/${Bun.hash(x.title)}.html`);
					const has = await f.exists();
					if (has) return null;
					return x;
				}),
		)
	).filter((x) => x !== null);
	if (pending_items.length === 0) break;
	// await fetchHtmlPage(pending_items[0], limiter);
	console.log("Todo: ", pending_items.length);
	const pending_tasks = pending_items.map((x) => fetchHtmlPage(x, limiter));
	await Promise.all(pending_tasks);
}
console.log("All Done!");
saveFile(state);
clearInterval(saver);
