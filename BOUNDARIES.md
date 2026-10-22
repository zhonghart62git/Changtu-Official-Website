# 仓库边界

本仓库只放官网。教师端、学生小程序、运营后台在 `zhonghart62git/changtu-compass-miniapp`，由另一方负责。

两个仓库**各自构建、各自发布、互不触发**。任何一方的代码改动都不会让另一方上线，这是有意设计的。

## 谁改什么

| 仓库 | 内容 | 发布方式 | 上线延迟 |
|---|---|---|---|
| `Changtu-Official-Website`（本仓库） | 官网 16 页 + `/teacher` `/admin` 两个入口中转页 | push 到 `main`，GitHub Pages 构建 | 约 1 分钟 |
| `changtu-compass-miniapp` | 教师端、学生小程序、运营后台、云函数 | 本地构建 + 手动部署到腾讯云 CloudBase | 取决于部署 |

`main` 已开启分支保护：禁止 force push、禁止删除。

## 三个接口点

只有这三处需要两个仓库达成一致，其余全部独立。

### 1. 颜色令牌 —— 按指定版本交接

真源在 miniapp 仓库的 `design/changtu-design-tokens.css`。本仓库的 `assets/design-colors.css` 是它的生成副本。

- 交接单位是**完整提交 SHA**，不是「最新」。
- 官网采纳了哪一版，记在 `tools/design-colors.pin`（commit + 变量指纹）。日常自检只核对这个指纹，**不读另一仓库的默认分支**，也不要求「永远与最新一致」。
- 要采纳新版本：`python tools/check_contract.py --adopt <sha>`。它会先确认该提交与本地颜色一致，再把 commit 与指纹写进 pin；不一致会拒绝登记，提示先把颜色取过来。
- 想先看看差在哪：`python tools/check_contract.py --check-upstream <sha>`，只读，不改文件。
- 官网自己调整这个文件也可以，改完跑 `--rehash` 重新登记，pin 的 commit 记为 `local`。这个文件怎么维护由官网自己决定。
- miniapp 改色不会动到本仓库的文件，也不会让本仓库自检失败。

官网自己的别名层（`--blue:var(--brand)` 这类）和版式令牌写在 `site.css` / `site-v2.css`，属于本仓库职责，与交接无关。

### 2. 入口地址 —— 官网依赖 miniapp，单向

`teacher/index.html` 和 `admin/index.html` 里硬编码了 CloudBase 实例地址，作为跳转目标。这是官网对 miniapp 的**唯一硬依赖**。

- CloudBase 环境 ID 或路由不变，两边零耦合
- 若发生变更，需通知官网侧修改这两个文件，每个文件各 2 处（`href` 和 `var TARGET`）
- 改完用 `python tools/check_contract.py` 确认两处一致

### 3. 小程序码 —— 一次性素材

`assets/miniapp-qr.png` 由小程序侧出图后交付。文件缺失时首页自动降级为「小程序即将开放 + 先在线报名」，不会破图。这是素材依赖，不构成版本依赖。

## 硬规则

1. 官网**不引入** miniapp 的构建产物、npm 包或组件库
2. 官网保持**零构建、零运行时依赖**——纯静态 HTML/CSS/JS，可独立托管
3. 本仓库的 `main` 只由官网侧推送。另一端要改跳转地址或文案，提出来由官网侧改；**同理，官网侧也不直接改 miniapp 仓库的代码**，需要什么先提出来。两个仓库各推各的，谁的仓库谁负责
4. 改 `assets/*.css|js` 后必须重算版本号（`_ref/stamp_assets.py`），否则回访用户会看到缓存里的旧样式

## 自检

```bash
python tools/check_contract.py
```

检查三项：颜色指纹是否与 pin 登记的一致、两个中转页地址是否一致、颜色文件是否保留来源说明。全程离线，不依赖另一仓库的状态。

官网侧的发布脚本在这之前还有一道检查：先 `git fetch`，若远端存在本地没有的提交，说明有人往官网仓库推过东西，脚本会列出这些提交并中止发布。两个仓库各推各的，这条检查平时永远通过，一旦越界就立刻暴露。

## 为什么这样切

官网是纯静态，随时可以单独重新发布；教师端有登录态、依赖云函数和数据库，发布节奏完全不同。把两者拆成独立仓库、只保留三个显式接口点，任何一方重构技术栈（换框架、换构建工具、换部署方式）都不会波及另一方。
