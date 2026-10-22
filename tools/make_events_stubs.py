# -*- coding: utf-8 -*-
"""把主站 official-site/events/ 下的活动页改写成跳转壳。

活动页正文已迁到独立仓库（events.leadtheway.cn）。主站保留同名路径做软跳转，
保护已经发出去的链接、sitemap 里被收录的 URL。

用法：python tools/make_events_stubs.py
可重复执行，幂等。
"""
import io, os

ROOT = r'D:/WorkBuddy/2026-10-22-12-01-09/official-site/events'
SUB = 'https://events.leadtheway.cn'

# 主站保留的跳转壳：本地文件名 -> (子站目标, 标题)
STUBS = {
    'index.html':        ('',                 '近期活动与报名'),
    'hongkong-2027.html':('hongkong-2027.html','2027 曹灿杯香港站'),
    'yingying-2027.html':('yingying-2027.html','2027 雏英杯中英双语主持人大会'),
}

TPL = '''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}｜畅途 · 未来领袖</title>
<link rel="canonical" href="{url}">
<meta name="robots" content="noindex,follow">
<meta http-equiv="refresh" content="0; url={url}">
<meta name="theme-color" content="#0B63C5">
<style>
  body{{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
    background:#F6FAFF;color:#0F1B2A;
    font-family:"Noto Sans SC","PingFang SC","Microsoft YaHei",system-ui,sans-serif}}
  .box{{max-width:520px;padding:0 24px;text-align:center}}
  h1{{font-size:19px;margin:0 0 10px;font-weight:800}}
  p{{font-size:14px;line-height:1.8;color:#3C4C63;margin:0 0 18px}}
  a{{display:inline-block;padding:11px 26px;border-radius:30px;background:#0B63C5;
    color:#fff;text-decoration:none;font-size:14px;font-weight:700}}
</style>
</head>
<body>
<div class="box">
  <h1>{title}已迁到活动站</h1>
  <p>正在跳转到 events.leadtheway.cn。没有自动跳转就点下面的按钮。</p>
  <a href="{url}">前往活动站 →</a>
</div>
<script>location.replace('{url}');</script>
</body>
</html>
'''


def main():
    for name, (path, title) in STUBS.items():
        url = SUB + '/' + path
        out = TPL.format(title=title, url=url)
        io.open(os.path.join(ROOT, name), 'w', encoding='utf-8', newline='').write(out)
        print('  %-22s -> %s' % (name, url))


if __name__ == '__main__':
    main()
