# -*- coding: utf-8 -*-
"""官网本地自检：结构闭合 / 内链可达 / 禁句 / 资源版本号。
不改任何文件，只报告。退出码 0=全通过 1=有问题。
"""
import html, io, os, re, sys
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
    # ── 2026-10-23 用户补充的行文规则 ────────────────────────
    # 每个名词都要指到具体对象；指不到就是废话。以下三类是废话的语法签名。
    (r'东西', '抽象指代 东西'),
    (r'一部分', '抽象指代 一部分'),
    (r'[说交给挑选写拿做找举]一[个件段句条份样](?=东西|部分|[，。、]|\s|<|$)', '空壳量词 单字动词+一X'),
    (r'[问聊谈讲说]一[句段个声](?=话|[，。、；]|\s|<|$)', '空壳量词 单字动词+一X'),
    # 「这段」抓的是「这段文字 / 这段说明」这类元话语；「这段时间」是正常的时间表述，放行
    (r'说明我们|这几件事|下面几件|这段(?!时间)', '解释性导语 页面自述'),
    # ── 2026-10-23 第二轮：全站铺开时补的签名 ─────────────────
    (r'才是', '否定定义 才是'),
    (r'以「[^」]{2,12}」为例', '元话语 以X为例'),
    (r'下面这张表|以下信息|这一节|本节', '元话语 页面自述'),
    (r'出口', '术语 出口→实践机会'),
    (r'赋能|闭环|抓手|助力|护航|一站式|全方位|能力跃迁|肌肉记忆|生态位', '空转套话'),
]

# 教案型产物不做文案规则检查：这些「不是X」是教学澄清（如「五问是导航，
# 不是机械口令」），删掉会改变原意。它们不是对外营销文案。
COPY_EXEMPT = {'sanyuanli-course.html'}


# 标题规则（用户 2026-10-23）：段落标题最多 4 个汉字，不用解释性或陈述性语句。
# h2 一律查；h3/h4 里有产品名、赛事名、阶位名，字数不能一刀切，但带句读的
# 一定是把一句话当标题用，直接判违规。
# 例外：首页案例卡的标题是引述的题眼，双句式是中文编辑标题的常态（如「练就真能力，
# 走进清华园」），与「把流程词当标题」不是一回事，按文本白名单放过。
CASE_H3 = {
    '练就真能力，走进清华园',
    '不同的体验，让我一步步走近中华文化',
    '让好教学，被更多人看见',
    # 机构支持两张卡（2026-10-25 用户定稿）：同一类双句式，前半说结果、后半说依据
    '备课更省事，上课更扎实',
    '获客有方向，内容有素材',
}


def head_issues(s):
    out = []
    s = re.sub(r'<(script|style)\b.*?</\1>', '', s, flags=re.S | re.I)
    for m in re.finditer(r'<(h2|h3|h4)\b[^>]*>(.*?)</\1>', s, re.S):
        tag = m.group(1)
        t = re.sub(r'<small>.*?</small>', '', m.group(2), flags=re.S)
        t = re.sub(r'<[^>]+>', '', t)
        t = html.unescape(t).strip()
        t = re.sub(r'\s+', ' ', t)
        if not t:
            continue
        han = len(re.findall(r'[\u4e00-\u9fff]', t))
        if tag == 'h2' and han > 4:
            out.append('标题超长 h2 %d 字「%s」' % (han, t[:22]))
        if re.search(r'[，。；]', t) and t not in CASE_H3:
            out.append('标题带句读 %s「%s」' % (tag, t[:22]))
    return out

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
        if pg not in COPY_EXEMPT:
            issues += head_issues(s)[:3]
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

    # 活动子站是独立仓库（events.leadtheway.cn），结构/内链各查各的，
    # 但对外文案是同一套规则，所以禁句要一起扫，否则改完主站子站还在说老话。
    sib = os.path.join(ROOT, '..', 'events-site')
    if os.path.isdir(sib):
        sib_pages = sorted(f for f in os.listdir(sib) if f.endswith('.html'))
        sib_bad = 0
        for pg in sib_pages:
            s = io.open(os.path.join(sib, pg), encoding='utf-8').read()
            hits = []
            for pat, name in BANNED:
                for m in re.finditer(pat, s):
                    hits.append('禁句[%s] %s' % (name, m.group(0)[:30]))
            if hits:
                sib_bad += 1
                print('✗ events-site/' + pg)
                for i in dict.fromkeys(hits):
                    print('    ', i)
        print('\n活动子站 events-site：%d 页，%d 页有禁句' % (len(sib_pages), sib_bad))
        bad += sib_bad

    print('\n检查 %d 个页面，%d 个有问题' % (len(pages), bad))
    return 1 if bad else 0

sys.exit(main())
