import "node:fs/promises";
import { all_lists } from "./settings";
import { type Limiter, genLimitWorker, genStater } from "./utils";

console.log("Hello via Bun!!");

export type NewsItem = {
	url: string;
	title: string;
	fetched?: boolean;
};

const { state, saveFile } = await genStater(all_lists);

const item_regex =
	/<a href="\/article\/view\/id-(\d+?)\.html" class="title_o">(.+?)<\/a>/gs;

const fetchNewsListPage = async (
	list_url: string,
	page: number,
	append_list: NewsItem[],
	limiter: Limiter,
) => {
	const offset = page * 20;
	await limiter();
	const res = await fetch(
		`${list_url}?maxPageItems=20&keywords=&pager.offset=${offset}`,
	);
	const html = await res.text();
	const items = html.matchAll(item_regex);
	for (const item of items) {
		const cur_url = `https://www.hitsz.edu.cn/article/view/id-${item[1]}.html`;
		if (append_list.find((news) => news.url === cur_url)) continue;
		append_list.push({
			url: cur_url,
			title: item[2].trim(),
		});
	}
};

const fetchNewsList = async (
	cur_state: typeof state,
	list_id: number,
	upper: number,
	limiter: Limiter,
) => {
	while (cur_state.fetch_progress[list_id] < upper) {
		console.log(
			`Fetching list ${list_id} page`,
			cur_state.fetch_progress[list_id],
		);
		await fetchNewsListPage(
			`https://www.hitsz.edu.cn/article/id-${list_id}.html`,
			cur_state.fetch_progress[list_id],
			cur_state.news_list,
			limiter,
		);
		cur_state.fetch_progress[list_id]++;
	}
};

// allow at most 5 fetches per second
const limiter = genLimitWorker(1000, 5);
setInterval(() => saveFile(state), 5000);
const task_all_list = all_lists.map((list_id) =>
	fetchNewsList(state, list_id, 500, limiter),
);
await Promise.all(task_all_list);
