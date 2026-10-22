# 畅途未来领袖官网

官网为根目录的静态 HTML 页面。教师端、学生小程序和运营后台由 `zhonghart62git/changtu-compass-miniapp` 维护，官网提供入口。

本地查看：

```bash
python3 -m http.server 4180 --directory .
```

GitHub Pages 使用 `main` 分支根目录，域名为 `https://leadtheway.cn/`。

颜色来自 miniapp 仓库的 `design/changtu-design-tokens.css`。在该仓库运行：

```bash
node scripts/sync-design-colors.cjs --website-root /workspace/Changtu-Official-Website
node scripts/sync-design-colors.cjs --check --website-root /workspace/Changtu-Official-Website
```

`assets/design-colors.css` 为生成文件；保留现有排版，不引入新的 UI 框架。修改 CSS 或脚本后更新 HTML 中的内容哈希查询参数。

`enroll.html` 与 `my.html` 保存和查询当前浏览器的报名意向、场次偏好。实际报名、场次与费用由招生老师确认；页面不承诺在线锁位或自动收款。

小程序入口使用已存在的「畅途未来领袖」微信搜索名称；教师和后台链接指向现有腾讯云实例。
