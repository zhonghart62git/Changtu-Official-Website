# -*- coding: utf-8 -*-
"""官网自检（三项）。默认全程离线，不读另一个仓库的默认分支。

官网与 miniapp 是两个独立仓库、独立发布。这个脚本只确认官网自己没走样：

  1. 颜色版本：assets/design-colors.css 的变量指纹必须等于
     tools/design-colors.pin 里登记的指纹。指纹变了 = 有人改了颜色但没登记。
  2. 入口地址：teacher/ 与 admin/ 两个中转页里的 href 和 JS TARGET 必须相同，
     且指向同一台 CloudBase 主机。
  3. 来源标记：design-colors.css 头部保留来源说明，文件可追溯。

颜色按「指定版本交接」：官网采纳哪一版，由 pin 文件里的 commit 记着。
日常发布只跑默认检查，不联网、不比对另一仓库的最新状态。

用法（在仓库根目录）：
    python tools/check_contract.py                  # 默认：离线核对指纹与入口
    python tools/check_contract.py --check-upstream <sha>
                                                     # 只读：核对某个提交里的颜色
                                                     # 与本地的差异，不写文件
    python tools/check_contract.py --adopt <sha>     # 采纳：确认该提交与本地一致后
                                                     # 把 commit 与指纹写进 pin
    python tools/check_contract.py --rehash          # 官网自行改色后重新登记指纹
                                                     # （commit 记为 local）

退出码 0 = 全部通过，1 = 有问题，2 = 无法检查（缺 pin / 缺凭据 / 网络失败）。
"""
import base64
import hashlib
import json
import os
import re
import subprocess
import sys
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(HERE)
SITE_CSS = os.path.join(SITE, 'assets', 'design-colors.css')
PIN_FILE = os.path.join(HERE, 'design-colors.pin')
ENTRY_PAGES = ['teacher/index.html', 'admin/index.html']

UPSTREAM_REPO = 'zhonghart62git/changtu-compass-miniapp'
UPSTREAM_PATH = 'design/changtu-design-tokens.css'

problems = []
notes = []


# ---------- 指纹 ----------

def vars_of(text):
    """取出 --name:value 形式的变量，值做归一化（去空白、转小写）。"""
    return {k.lower(): re.sub(r'\s+', ' ', v).strip().lower()
            for k, v in re.findall(r'(--[a-zA-Z0-9-]+)\s*:\s*([^;{}]+);', text)}


def fingerprint(text):
    """变量集合的语义指纹：只看「变量名=值」，不看格式与行尾。"""
    v = vars_of(text)
    body = '\n'.join('%s=%s' % (k, v[k]) for k in sorted(v))
    return hashlib.sha256(body.encode('utf-8')).hexdigest(), len(v)


def read_local_css():
    if not os.path.exists(SITE_CSS):
        return None
    return open(SITE_CSS, encoding='utf-8').read()


# ---------- pin 文件 ----------

def read_pin():
    if not os.path.exists(PIN_FILE):
        return None
    d = {}
    for line in open(PIN_FILE, encoding='utf-8'):
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        if '=' in line:
            k, v = line.split('=', 1)
            d[k.strip()] = v.strip()
    return d


def write_pin(commit, sha, count):
    lines = [
        '# 官网采纳的品牌颜色版本。由 tools/check_contract.py 读写，不要手改。',
        '# 换版本：python tools/check_contract.py --adopt <miniapp 提交 SHA>',
        '# 自行改色后：python tools/check_contract.py --rehash',
        'repo = %s' % UPSTREAM_REPO,
        'path = %s' % UPSTREAM_PATH,
        'commit = %s' % commit,
        'colors-sha256 = %s' % sha,
        'colors-count = %d' % count,
    ]
    with open(PIN_FILE, 'w', encoding='utf-8', newline='\n') as f:
        f.write('\n'.join(lines) + '\n')


# ---------- 上游（只在显式传 --adopt / --check-upstream 时联网）----------

def github_token():
    try:
        out = subprocess.run(['git', 'credential', 'fill'],
                             input='protocol=https\nhost=github.com\n\n',
                             capture_output=True, text=True, timeout=20).stdout
        for line in out.splitlines():
            if line.startswith('password='):
                return line.split('=', 1)[1].strip()
    except Exception:
        pass
    return None


def fetch_at(sha):
    tok = github_token()
    if not tok:
        return None, '没有可用的 GitHub 凭据'
    url = 'https://api.github.com/repos/%s/contents/%s?ref=%s' % (UPSTREAM_REPO, UPSTREAM_PATH, sha)
    req = urllib.request.Request(url, headers={
        'Authorization': 'Bearer ' + tok,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'changtu-contract-check',
    })
    try:
        with urllib.request.urlopen(req, timeout=25) as r:
            data = json.load(r)
        return base64.b64decode(data['content']).decode('utf-8', 'replace'), None
    except Exception as e:
        return None, str(e)


def diff_against(upstream_text, local_text):
    a, b = vars_of(upstream_text), vars_of(local_text)
    shared = [k for k in a if k in b]
    drift = [(k, a[k], b[k]) for k in shared if a[k] != b[k]]
    return shared, drift


# ---------- 三项检查 ----------

def check_colors():
    print('[1/3] 颜色版本')
    local = read_local_css()
    if local is None:
        problems.append('找不到 assets/design-colors.css')
        return

    pin = read_pin()
    if pin is None:
        print('      未登记：tools/design-colors.pin 不存在')
        problems.append('缺少 tools/design-colors.pin，先跑 --adopt <sha> 或 --rehash 登记一版')
        return

    want = pin.get('colors-sha256', '')
    got, n = fingerprint(local)
    if not want:
        problems.append('pin 文件里没有 colors-sha256')
        return

    if got == want:
        commit = pin.get('commit', '?')
        src = '本地版本' if commit == 'local' else 'miniapp@%s' % commit[:12]
        print('      通过：%d 个变量，指纹 %s…（来源：%s）' % (n, got[:12], src))
    else:
        print('      指纹不符：pin=%s… 实际=%s…' % (want[:12], got[:12]))
        problems.append('design-colors.css 改过但没登记；确认无误后跑 --rehash，'
                        '或从 pin 记录的版本重新取一份')


def check_entries():
    print('[2/3] 入口地址')
    hosts = set()
    for rel in ENTRY_PAGES:
        p = os.path.join(SITE, rel)
        if not os.path.exists(p):
            problems.append('%s 不存在' % rel)
            continue
        s = open(p, encoding='utf-8').read()
        hrefs = re.findall(r'href="(https://[^"]*tcloudbase\.com[^"]*)"', s)
        targets = re.findall(r"var\s+TARGET\s*=\s*'([^']+)'", s)
        allurls = set(hrefs) | set(targets)
        if len(allurls) != 1:
            print('      %-22s 地址不一致：%s' % (rel, sorted(allurls)))
            problems.append('%s 里的跳转地址不一致（%d 种）' % (rel, len(allurls)))
            continue
        url = allurls.pop()
        host = re.match(r'https://([^/]+)', url).group(1)
        hosts.add(host)
        print('      %-22s %s' % (rel, url))

    if len(hosts) > 1:
        problems.append('两个中转页指向不同主机：%s' % sorted(hosts))
    elif hosts:
        print('      通过：两个入口同主机 %s' % hosts.pop())


def check_marker():
    print('[3/3] 来源标记')
    local = read_local_css()
    if local is None:
        problems.append('找不到 assets/design-colors.css')
        return
    head = local[:400]
    if 'changtu-design-tokens' in head:
        print('      通过：文件头保留了来源说明')
    else:
        print('      警告：文件头没有来源说明')
        problems.append('design-colors.css 头部的来源说明被删了，无法追溯')


# ---------- 三种写入 / 只读模式 ----------

def mode_check_upstream(sha):
    local = read_local_css()
    if local is None:
        print('找不到 assets/design-colors.css')
        return 2
    text, err = fetch_at(sha)
    if text is None:
        print('拉取失败：%s' % err)
        return 2
    shared, drift = diff_against(text, local)
    pin = read_pin() or {}
    print('上游 %s @ %s' % (UPSTREAM_REPO, sha[:12]))
    print('  pin 里记录的 commit：%s' % (pin.get('commit', '未登记')))
    print('  共有变量：%d 个' % len(shared))
    if drift:
        print('  与本地不一致 %d 项：' % len(drift))
        for k, x, y in drift:
            print('    %-24s 上游=%-14s 官网=%s' % (k, x, y))
        print('\n只读核对，未改动任何文件。要采纳这一版：--adopt %s' % sha[:12])
    else:
        print('  与本地一致。这一版就是官网当前的颜色版本。')
        print('\n只读核对，未改动任何文件。')
    return 0


def mode_adopt(sha):
    local = read_local_css()
    if local is None:
        print('找不到 assets/design-colors.css')
        return 2
    text, err = fetch_at(sha)
    if text is None:
        print('拉取失败：%s' % err)
        return 2
    shared, drift = diff_against(text, local)
    if drift:
        print('拒绝登记：该提交与本地有 %d 项颜色不同。' % len(drift))
        for k, x, y in drift:
            print('  %-24s 上游=%-14s 官网=%s' % (k, x, y))
        print('\n先把这一版颜色取到官网（生成新的 design-colors.css），再跑 --adopt。')
        return 1
    sha_val, n = fingerprint(local)
    write_pin(sha, sha_val, n)
    print('已登记：commit=%s，%d 个变量，指纹 %s…' % (sha[:12], n, sha_val[:12]))
    print('写入 %s' % os.path.relpath(PIN_FILE, SITE))
    return 0


def mode_rehash():
    local = read_local_css()
    if local is None:
        print('找不到 assets/design-colors.css')
        return 2
    pin = read_pin() or {}
    old = pin.get('commit', '')
    sha_val, n = fingerprint(local)
    write_pin('local', sha_val, n)
    print('已重新登记：commit=local，%d 个变量，指纹 %s…' % (n, sha_val[:12]))
    if old and old != 'local':
        print('提示：原来记录的是 miniapp@%s，现在改记为本地版本。' % old[:12])
    return 0


def main():
    argv = sys.argv[1:]
    if '--adopt' in argv:
        i = argv.index('--adopt')
        if i + 1 >= len(argv):
            print('用法：--adopt <miniapp 提交 SHA>')
            return 2
        return mode_adopt(argv[i + 1])
    if '--check-upstream' in argv:
        i = argv.index('--check-upstream')
        if i + 1 >= len(argv):
            print('用法：--check-upstream <miniapp 提交 SHA>')
            return 2
        return mode_check_upstream(argv[i + 1])
    if '--rehash' in argv:
        return mode_rehash()

    check_colors()
    check_entries()
    check_marker()

    print()
    if problems:
        print('发现 %d 个问题：' % len(problems))
        for p in problems:
            print('  - ' + p)
        return 1
    print('自检全部通过。')
    for n in notes:
        print('提示：' + n)
    return 0


if __name__ == '__main__':
    sys.exit(main())
