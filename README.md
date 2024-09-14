# hitsz-crawler

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run src/index.ts
```

This project was created using `bun init` in bun v1.1.20. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.

## Crawling

爬取了 HITSZ 官网及内部信息网共 6874 条新闻。没有遇到什么反爬机制，看起来公开的公网官网有 Rate Limit，但相当软性，不会封禁 IP. 内网可以以极高的速度狠狠爬。

使用 Bun 异步爬取，搓了一个基于 Promise 的 Limiter. 使用 json 文件进行状态管理，保存 NewsList 爬取目标即对应的爬取状态，以及 Fetching Page List 的进度。执行过程中动态保存。

使用时如果报错请自行解决。

注意爬取内网信息需要设置 Cookies，在 `src/settings.ts` 中自行编写。注意不要将 Cookies 公开。

请遵守法律法规。本项目为大数据导论课程作业要求，仅供学习使用。
