# Builds the whole site from source:
#   - animations/<id>/index.html (+ icons, manifest) from animations/<id>/src/, with shared/ inlined
#   - index.html, the catalog page, from catalog.json
# Run from anywhere:  python3 tools/build.py   (needs Python 3 with Pillow for the icons)
import html, json, os, re
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHARED = os.path.join(ROOT, 'shared')
catalog = json.load(open(os.path.join(ROOT, 'catalog.json')))
esc = html.escape


def inline_shared(src):
    """Replace links to shared/ files with their contents, so each built page stands on its own
    (works offline from the iPad home screen, and can be published as a single file)."""
    def css(m): return '<style>\n' + open(os.path.join(SHARED, m.group(1))).read() + '</style>'
    def js(m): return '<script>\n' + open(os.path.join(SHARED, m.group(1))).read() + '</script>'
    src = re.sub(r'<link rel="stylesheet" href="(?:\.\./)+shared/([\w.-]+)">', css, src)
    src = re.sub(r'<script src="(?:\.\./)+shared/([\w.-]+)"></script>', js, src)
    return src


def build_animation(a):
    out = os.path.join(ROOT, 'animations', a['id'])
    src = open(os.path.join(out, 'src', 'index.html')).read()
    # drop the source's own <title> and artifact viewport meta; the head below replaces them
    src = re.sub(r'^<title>.*?</title>\n', '', src)
    src = re.sub(r'^<meta name="claude:[^>]*>\n', '', src)
    head = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{esc(a['title'])}</title>
<meta name="description" content="{esc(a['blurb'])}">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="{esc(a['short_name'])}">
<meta name="theme-color" content="#eef1f3">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<link rel="icon" href="icon-512.png">
<link rel="manifest" href="manifest.webmanifest">
<style>:root{{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}} body{{margin:0;font:14px system-ui,sans-serif}} [hidden]{{display:none!important}} img{{max-width:100%}}</style>
</head>
<body>
'''
    open(os.path.join(out, 'index.html'), 'w').write(head + inline_shared(src) + '\n</body>\n</html>\n')
    icon = Image.open(os.path.join(out, 'src', 'icon.png')).convert('RGB')
    icon.resize((512, 512), Image.LANCZOS).save(os.path.join(out, 'icon-512.png'))
    icon.resize((180, 180), Image.LANCZOS).save(os.path.join(out, 'apple-touch-icon.png'))
    json.dump({"name": a['title'], "short_name": a['short_name'], "start_url": "./", "scope": "./", "display": "fullscreen",
               "orientation": "landscape", "background_color": "#eef1f3", "theme_color": "#eef1f3",
               "icons": [{"src": "apple-touch-icon.png", "sizes": "180x180", "type": "image/png"},
                         {"src": "icon-512.png", "sizes": "512x512", "type": "image/png"}]},
              open(os.path.join(out, 'manifest.webmanifest'), 'w'), indent=2)
    print('Built animations/' + a['id'])


def build_catalog():
    cards = []
    for a in catalog['animations']:
        href = f"animations/{a['id']}/"
        has_thumb = os.path.exists(os.path.join(ROOT, 'animations', a['id'], 'thumb.png'))
        img = f'<img src="{href}thumb.png" alt="" width="640" height="360" loading="lazy">' if has_thumb else '<div class="nothumb"></div>'
        tags = ''.join(f'<li>{esc(t)}</li>' for t in a.get('tags', []))
        cards.append(f'''    <li class="card"><a href="{href}">
      {img}
      <div class="card-body"><h2>{esc(a['title'])}</h2><p>{esc(a['blurb'])}</p>{f'<ul class="tags">{tags}</ul>' if tags else ''}</div>
    </a></li>''')
    page = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{esc(catalog['title'])}</title>
<meta name="description" content="{esc(catalog['intro'])}">
<meta name="theme-color" content="#eef1f3">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600&family=Barlow:wght@400;500&family=IBM+Plex+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="shared/analog.css">
<style>
body {{ margin: 0; }}
.wrap {{ max-width: 1100px; gap: 20px; }}
h1 {{ font-size: 40px; }}
.cards {{ list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr)); gap: 16px; }}
.card a {{ display: grid; height: 100%; grid-template-rows: auto 1fr; color: inherit; text-decoration: none; background: var(--panel); border: 1px solid var(--line); border-radius: 8px; overflow: hidden; }}
.card a:hover {{ border-color: var(--steel-dark); }}
.card a:focus-visible {{ outline: 2px solid var(--accent); outline-offset: 2px; }}
.card img, .nothumb {{ display: block; width: 100%; height: auto; aspect-ratio: 16 / 9; object-fit: cover; background: var(--vessel); border-bottom: 1px solid var(--line); }}
.card-body {{ padding: 14px 16px 16px; display: grid; gap: 6px; align-content: start; }}
.card h2 {{ font-family: var(--font-display); font-weight: 600; font-size: 22px; margin: 0; }}
.card p {{ margin: 0; color: var(--muted); line-height: 1.45; }}
.tags {{ list-style: none; margin: 4px 0 0; padding: 0; display: flex; flex-wrap: wrap; gap: 6px; }}
.tags li {{ font-family: var(--font-mono); font-size: 12px; color: var(--muted); border: 1px solid var(--line); border-radius: 999px; padding: 2px 8px; }}
</style>
</head>
<body>
<div class="wrap">
  <header><div><h1>{esc(catalog['title'])}</h1><p class="sub">{esc(catalog['intro'])}</p></div></header>
  <ul class="cards">
{chr(10).join(cards)}
  </ul>
</div>
</body>
</html>
'''
    open(os.path.join(ROOT, 'index.html'), 'w').write(page)
    print('Built index.html (catalog,', len(cards), 'animations)')


for a in catalog['animations']:
    build_animation(a)
build_catalog()
