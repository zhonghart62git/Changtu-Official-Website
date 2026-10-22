# 畅途未来领袖官网

官网为根目录的静态 HTML 页面。教师端、学生小程序和运营后台由 `zhonghart62git/changtu-compass-miniapp` 维护，官网提供入口。

本地查看：

```bash
python3 -m http.server 4180 --directory .
```

GitHub Pages 使用 `main` 分支根目录，域名为 `https://leadtheway.cn/`。push 到 `main` 即自动构建，约 1 分钟生效。

**仓库边界、与 miniapp 的三个接口点、发布方式见 [BOUNDARIES.md](BOUNDARIES.md)。** 改完代码跑一次自检：

```bash
python tools/check_contract.py
```

自检默认全程离线：核对颜色指纹、两个入口地址是否一致、颜色文件是否保留来源说明。

颜色令牌的真源在 miniapp 仓库的 `design/changtu-design-tokens.css`，`assets/design-colors.css` 是它的生成副本。**交接单位是完整提交 SHA，不是「最新」**——官网采纳哪一版，记在 `tools/design-colors.pin` 里（commit + 变量指纹）。

```bash
python tools/check_contract.py --check-upstream <sha>   # 只读：看某版与本地差在哪
python tools/check_contract.py --adopt <sha>            # 采纳某版并登记
python tools/check_contract.py --rehash                 # 官网自行改色后重新登记
```

miniapp 改色不会动到官网文件，也不会让官网自检失败；官网改色也不影响 miniapp。两边各自发布。

保留现有排版，不引入新的 UI 框架。修改 CSS 或脚本后更新 HTML 中的内容哈希查询参数。

`enroll.html` 与 `my.html` 保存和查询当前浏览器的报名意向、场次偏好。实际报名、场次与费用由招生老师确认；页面不承诺在线锁位或自动收款。

小程序入口使用已存在的「畅途未来领袖」微信搜索名称；教师和后台链接指向现有腾讯云实例。

## 占位素材（暂时用编的素材，待替换）

首页有三处内容当前是示例素材，等真实素材到位后替换：

| 位置 | 现在是什么 | 需要什么真素材 |
|---|---|---|
| 课程区 · 教案页示意 | 按「五问法」前三问编的教案页版式 | 真实课件截图或教案页照片 |
| 课程区 · 教学成效 | 82% / 3.2 次 / 78% 三个示例数 | 样本机构数、样本学员数、统计学年 + 真实数值 |
| 合作依据 · 机构案例 | 佛山一家机构的示例叙述与引述 | 具名机构、真实过程、**机构书面授权**的原话 |

占位容器统一写成 `class="ph" data-ph="用途"`，页面上带橙色「示例 · 待替换」角标，肉眼可辨。

```bash
python tools/list_placeholders.py            # 列清单
python tools/list_placeholders.py --strict   # 有占位就退出码 1
```

`tools/check_local.py` 每次跑都会在末尾提醒剩余占位处数。替换真素材时三样一起删：
`class` 里的 `ph`、`<span class="ph-badge">…</span>`、`data-ph` 属性。三处都清空后，
`list_placeholders.py` 输出「没有占位素材」即为干净。

**这条不要绕过**：编造的机构案例和成效数字一旦忘替换就挂在线上了，那是拿假客户案例去卖课。
