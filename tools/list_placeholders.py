# -*- coding: utf-8 -*-
"""占位素材清单。

用户允许先用编的素材占位，晚些替换真素材。这个脚本的作用只有一个：
把「哪些页面、哪一行、哪一块还是假的」摊开列出来，避免假案例悄悄挂在线上。

用法：
    python tools/list_placeholders.py          # 只列清单，退出码恒为 0
    python tools/list_placeholders.py --strict # 有占位就退出码 1（可用于正式发布前的硬门槛）

约定：占位容器写 class="ph" data-ph="用途"。
换真实素材时，三样一起删：class 里的 ph、<span class="ph-badge">…</span>、data-ph 属性。
"""
import io, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAT = re.compile(r'data-ph="([^"]+)"')

def scan():
    hits = []
    for name in sorted(os.listdir(ROOT)):
        if not name.endswith('.html') or name.startswith('_'):
            continue
        path = os.path.join(ROOT, name)
        for n, line in enumerate(io.open(path, encoding='utf-8'), 1):
            for m in PAT.finditer(line):
                hits.append((name, n, m.group(1)))
    return hits

def main():
    hits = scan()
    if not hits:
        print('没有占位素材。')
        return 0
    print('占位素材 %d 处：\n' % len(hits))
    for name, n, label in hits:
        print('  %-16s L%-5d %s' % (name, n, label))
    print('\n替换时三样一起删：class="ph" / <span class="ph-badge">…</span> / data-ph')
    print('确认已清空后再跑一次，输出「没有占位素材」即可。')
    return 1 if '--strict' in sys.argv else 0

if __name__ == '__main__':
    sys.exit(main())
