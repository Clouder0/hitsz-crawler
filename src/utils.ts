import type { NewsItem } from ".";

export const genLimitWorker = (interval: number, threshold: number) => {
	let current_times = 0;

	const resetter = setInterval(() => {
		current_times = 0;
	}, interval);

	const waiter = async () => {
		while (current_times >= threshold) {
			await Bun.sleep(100);
		}
		current_times++;
	};

	return waiter;
};
export type Limiter = ReturnType<typeof genLimitWorker>;

export const genStater = async (all_lists: number[]) => {
	let state = {
		fetch_progress: all_lists.reduce(
			(acc, cur) => {
				acc[cur] = 0;
				return acc;
			},
			{} as { [key: number]: number },
		),
		news_list: [] as NewsItem[],
	};

	const f = Bun.file("list.json", { type: "Application/json" });
	if (await f.exists()) {
		console.log("Loading file...");
		state = await f.json();
		for (const list_id of all_lists) {
			if (!state.fetch_progress[list_id]) {
				state.fetch_progress[list_id] = 0;
			}
		}
		const fetched_num = state.news_list.filter((x) => x.fetched).length;
		console.log("Loaded file.");
		console.log("Progress: ", state.fetch_progress);
		console.log("News count: ", state.news_list.length);
		console.log("Fetched count: ", fetched_num);
	}

	const saveFile = async (cur_state: typeof state) => {
		console.log("Saving file...");
		Bun.write(f, JSON.stringify(cur_state));
		const l = cur_state.news_list.length;
		const fetched_num = cur_state.news_list.filter((x) => x.fetched).length;
		console.log("Saved file. News count:", l);
		console.log("Progress: ", cur_state.fetch_progress);
		console.log("Fetched count: ", fetched_num);
	};

	return {
		state,
		saveFile,
	};
};

export type State = Awaited<ReturnType<typeof genStater>>["state"];
