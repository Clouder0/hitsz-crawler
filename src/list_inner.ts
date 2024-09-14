import type { NewsItem } from ".";
import { all_lists, logined_cookie } from "./settings";
import { type Limiter, type State, genLimitWorker, genStater } from "./utils";


const item_regex =
	/<li id="line_u3_0"><span>.+?<\/span>.+?<a href="(.+?)" target=_blank title="(.+?)<\/a><\/li>/g;

const fetchListPage = async (
	page: number,
	append_list: NewsItem[],
	limiter: Limiter,
) => {
	await limiter();
	const res = await fetch(
		`http://info.hitsz.edu.cn/list.jsp?PAGENUM=${page}&wbtreeid=1053`,
		{
			headers: { Cookie: logined_cookie },
		},
	);
	const html = await res.text();
    // console.log(html)
	const items = html.matchAll(item_regex);
    let found_items = 0
	for (const item of items) {
		const url = `http://info.hitsz.edu.cn/${item[1]}`;
		const title = item[2].trim();
        // console.log(url,title)
		if (append_list.find((news) => news.url === url)) continue;
		append_list.push({ url, title });
        found_items++
	}
	console.log(`Fetched page ${page}, found ${found_items} items`);
};

const RANGE = (x: number, y: number) =>
	Array.from(
		(function* () {
			let cur = x;
			while (cur <= y) {
				yield cur++;
			}
		})(),
	);

const fetchList = async (cur_state: State, upper: number, limiter: Limiter) => {
	const tasks = RANGE(70, upper).map((x) =>
		fetchListPage(x, cur_state.news_list, limiter),
	);
	await Promise.all(tasks);
};

const { state, saveFile } = await genStater(all_lists);
const timer = setInterval(() => {
	saveFile(state);
}, 5000);
const limiter = genLimitWorker(1000, 10);
await fetchList(state, 210, limiter);
// await fetchListPage(2, state.news_list, limiter);
console.log("All done!");
saveFile(state);
clearInterval(timer);
