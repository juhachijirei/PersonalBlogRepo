# Void Blog

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

### 纯静态预览（首页可用，文章页不可用）

```bash
python -m http.server 8080
```

访问 `http://localhost:8080`。首页会回退到读取 `/data/articles.json`，文章页因为依赖 Worker 所以看不到。

### 完整预览（需要 Worker）

安装 [Wrangler](https://developers.cloudflare.com/workers/wrangler/)：

```bash
npx wrangler pages dev .
```

然后访问 `http://localhost:8788`。

## 部署到 Cloudflare Pages

1. 将整个目录推送到 Git 仓库。
2. 在 Cloudflare Pages 中连接该仓库。
3. 构建设置留空（纯静态，无需构建命令）。
4. Pages 会自动识别 `_worker.js` 并作为 Worker 入口。
5. 默认域名 `https://<project>.pages.dev/` 即可使用。
