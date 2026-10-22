# -*- coding: utf-8 -*-
"""官网本地自检：结构闭合 / 内链可达 / 禁句 / 资源版本号。
不改任何文件，只报告。退出码 0=全通过 1=有问题。
"""
import io, os, re, sys
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote

ROOT = r'D:/WorkBuddy/2026-10-22-12-01-09/official-site'
VOID = {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}

BANNED = [
    (r'不是[^。；，]{0,20}而是', '否定定义 A不是B而是C'),
    (r'不是[^。；]{0,12}[，,]\s*是', '否定定义 A不是B'),
    (r'而不是', '否定定义 而不是'),
    (r'[，,]\s*不是[^。；]{1,12}[。；]', '否定定义 补一句「不是X」'),
    (r'很多机构|大多数机构|行业里|行业中的大多数', '假想敌'),
    (r'最不一样|别人做不到|只有我们', '相对优势当卖点'),
    (r'不假装|不会用.{0,6}占位|坦诚地说', '元话语'),
    (r'不用先|没有藏在|不给价目表', '消除顾虑式'),
    (r'的区别[。]', '说教收尾'),
]

# 教案型产物不做文案规则检查：这些「不是X」是教学澄清（如「五问是导航，
# 不是机械口令」），删掉会改变原意。它们不是对外营销文案。
COPY_EXEMPT = {'sanyuanli-course.html'}

class P(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []; self.err = []; self.links = []
    def handle_starttag(self, t, a):
        d = dict(a)
        if t == 'a' and d.get('href'):
            self.links.append(d['href'])
        if t in VOID: return
        self.stack.append((t, self.getpos()))
    def handle_endtag(self, t):
        if t in VOID: return
        if not self.stack:
            self.err.append('多余闭合 </%s> @%s' % (t, self.getpos())); return
        if self.stack[-1][0] != t:
            self.err.append('不匹配 </%s> @%s 期望 </%s>' % (t, self.getpos(), self.stack[-1][0]))
            for i in range(len(self.stack) - 1, -1, -1):
                if self.stack[i][0] == t:
                    del self.stack[i:]; return
        else:
            self.stack.pop()

def main():
    pages = sorted(f for f in os.listdir(ROOT) if f.endswith('.html') and not f.startswith('_'))
    # 子目录页面（events 活动子站）也要查，否则新页面会绕过自检
    for sub in ('events',):
        d = os.path.join(ROOT, sub)
        if os.path.isdir(d):
            pages += sorted(sub + '/' + f for f in os.listdir(d)
                            if f.endswith('.html') and not f.startswith('_'))
    pages += ['teacher/index.html', 'admin/index.html']
    bad = 0
    for pg in pages:
        path = os.path.join(ROOT, pg)
        if not os.path.exists(path):
            print('缺页', pg); bad += 1; continue
        s = io.open(path, encoding='utf-8').read()
        p = P(); p.feed(s)
        issues = []
        if p.stack: issues.append('未闭合 %r' % ([t for t, _ in p.stack][:4],))
        issues += p.err[:3]
        # 内链
        base = os.path.dirname(path)
        dead = []
        for h in p.links:
            if h.startswith(('http', 'mailto:', 'tel:', '#')) or not h:
                continue
            u = urlsplit(h)
            tgt = unquote(u.path)
            if not tgt: continue
            f = os.path.normpath(os.path.join(base, tgt))
            if tgt.endswith('/') or os.path.isdir(f):
                if not os.path.exists(os.path.join(f, 'index.html')):
                    dead.append(h)
            elif not os.path.exists(f):
                dead.append(h)
        if dead: issues.append('死链 %r' % (sorted(set(dead))[:5],))
        # 禁句
        if pg not in COPY_EXEMPT:
            for pat, name in BANNED:
                for m in re.finditer(pat, s):
                    issues.append('禁句[%s] %s' % (name, m.group(0)[:30]))
        if issues:
            bad += 1
            print('✗', pg)
            for i in issues[:6]:
                print('    ', i)
    # 占位素材：不阻断发布（用户允许先用编的素材占位），但每次都要报出来。
    # 假案例一旦忘了替换就挂在线上卖给校长，所以宁可每次都烦一遍。
    phs = []
    for pg in pages:
        path = os.path.join(ROOT, pg)
        if not os.path.exists(path):
            continue
        for n, line in enumerate(io.open(path, encoding='utf-8'), 1):
            for m in re.finditer(r'data-ph="([^"]+)"', line):
                phs.append((pg, n, m.group(1)))
    if phs:
        print('\n⚠ 占位素材 %d 处（换真实素材时，同时删掉 class="ph"、.ph-badge、data-ph）' % len(phs))
        for pg, n, lab in phs:
            print('    %-14s L%-4d %s' % (pg, n, lab))

    print('\n检查 %d 个页面，%d 个有问题' % (len(pages), bad))
    return 1 if bad else 0

sys.exit(main())
