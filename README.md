# 十八字令的博客

多页静态个人博客，部署目标：Cloudflare Pages + Cloudflare Workers。

当前只有一篇文章：`negative-space`。

## 目录结构

```
.
├── _worker.js              # Cloudflare Pages Worker（动态渲染文章）
├── index.html              # 首页
├── about.html              # 关于页
├── 404.html                # 404 页面
├── article-template.html   # 文章页模板（Worker 读取并替换占位符）
├── assets/
│   ├── css/style.css       # 全局样式
│   ├── js/theme.js         # 主题切换
│   ├── js/common.js        # 通用逻辑（reveal、返回顶部）
│   ├── js/home.js          # 首页文章列表与分页
│   ├── js/article.js       # 文章页阅读进度
│   └── images/             # favicon、OG 图片等
├── content/
│   └── negative-space.json # 文章内容（git 仓库中唯一的内容文件）
├── data/
│   └── articles.json       # 文章元数据（首页列表读取）
├── rss.xml                 # RSS 订阅源
├── sitemap.xml             # 站点地图
├── robots.txt
├── _headers                # Cloudflare Pages 响应头
└── _redirects              # Cloudflare Pages 重定向
```

## 动态渲染流程

1. 用户访问 `/posts/negative-space.html`
2. `_worker.js` 读取 `/article-template.html`
3. `_worker.js` 读取 `/content/negative-space.json`
4. Worker 将模板中的 `{{TITLE}}`、`{{CONTENT}}` 等占位符替换为 JSON 数据
5. 返回完整的 HTML

首页文章列表通过 `fetch('/api/articles')` 获取，Worker 会返回 `/data/articles.json` 的内容。

## 添加新文章

1. 在 `content/` 下新增 `{slug}.json`，字段参考 `content/negative-space.json`。
2. 在 `data/articles.json` 中追加对应的元数据。
3. （可选）更新 `rss.xml`、`sitemap.xml`。

## 本地测试

完整动态渲染需要 Worker，所以用 Wrangler：

```bash
npx wrangler pages dev .
```

访问 `http://localhost:8788`。

## 部署

推送到 Git 后 Cloudflare Pages 会自动部署：

```bash
git add .
git commit -m "update"
git push
```

线上地址：https://juhachijisblog.pages.dev/
