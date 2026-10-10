#!/usr/bin/env python3
"""
LERNA — génère les stickers du questionnaire et les drapeaux des pays.

Source des images : police Noto Color Emoji (Google, licence SIL OFL 1.1 / Apache 2.0).
Chaque emoji devient un sticker : contour blanc découpé + ombre douce marron,
exporté en WebP. Ainsi les images sont identiques sur tous les téléphones
(un emoji affiché par le téléphone change d'un appareil à l'autre, et les
drapeaux ne s'affichent pas du tout sur Windows).

Usage : python3 scripts/build-stickers.py
Prérequis : Pillow (avec libraqm) et la police NotoColorEmoji.ttf installée.
Quand les stickers officiels du léopard LERNA existeront, il suffira de remplacer
les fichiers de assets/stickers/ en gardant les mêmes noms.
"""
import os
import sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT = '/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf'
ARABIC_FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
OUT_STICKERS = os.path.join(ROOT, 'assets', 'stickers')
OUT_FLAGS = os.path.join(ROOT, 'assets', 'flags')

BROWN = (61, 31, 0)
ORANGE = (232, 100, 12)
CREAM = (250, 243, 224)

STICKERS = {
    # général
    'autre': '✏️', 'leopard': '🐆',
    # avatars choisis à l'inscription (garçon, fille, neutre)
    'av-h': '👨‍🎓', 'av-f': '👩‍🎓', 'av-x': '🧑‍🎓',
    # âge / parcours
    'child': '🧒', 'teen': '🧑', 'cap': '🎓', 'briefcase': '💼', 'rocket': '🚀', 'star': '⭐',
    'backpack': '🎒', 'school': '🏫', 'target': '🎯', 'compass': '🧭',
    # diplôme
    'microscope': '🔬', 'chart-up': '📈', 'book-open': '📖', 'wrench': '🔧', 'globe-net': '🌐', 'hourglass': '⏳',
    # matières
    'numbers': '🔢', 'flask': '🧪', 'dna': '🧬', 'map': '🗺️', 'chart-bar': '📊', 'pen': '🖋️',
    'speaking': '🗣️', 'laptop': '💻', 'palette': '🎨', 'ball': '⚽', 'cool': '😎',
    # personnalité / travail
    'magnifier': '🔍', 'zap': '⚡', 'hammer': '🔨', 'handshake': '🤝', 'headphones': '🎧', 'group': '👥',
    'juggler': '🤹', 'ruler': '📐', 'writing': '✍️', 'glow-star': '🌟', 'tools': '🛠️',
    # ambitions
    'office': '🏢', 'institution': '🏛️', 'earth-africa': '🌍', 'earth-asia': '🌏', 'shrug': '🤷',
    'house-garden': '🏡', 'airplane': '✈️',
    # priorités / secteurs
    'money-bag': '💰', 'heart': '💖', 'trophy': '🏆', 'dove': '🕊️', 'brain': '🧠',
    'stethoscope': '🩺', 'robot': '🤖', 'scales': '⚖️', 'teacher': '🧑‍🏫', 'megaphone': '📣',
    'gear': '⚙️', 'rice': '🌾',
    # financement / budget
    'medal': '🏅', 'muscle': '💪', 'bank': '🏦', 'search': '🔎',
    'gift': '🎁', 'dollar': '💵', 'gem': '💎', 'crown': '👑',
    # situation
    'thinking': '🤔', 'worried': '😟', 'coin': '🪙', 'books': '📚', 'book-green': '📗',
    'calendar': '📅', 'fire': '🔥', 'party': '🎉', 'smile': '😊', 'house': '🏠',
    'telescope': '🔭', 'speech': '💬',
    # interface (accueil personnel, missions, récompenses)
    'bell': '🔔', 'mobile': '📲', 'chess': '♟️', 'puzzle': '🧩', 'bulb': '💡', 'envelope': '📨',
    'lock': '🔒', 'seedling': '🌱', 'wave': '👋', 'check': '✅', 'clipboard': '📋', 'unlock': '🔓',
    'memo': '📝', 'hundred': '💯', 'calendar-spiral': '🗓️', 'sunrise': '🌅', 'muscle-arm': '🦾',
    # v5 : niveau débutant, salutations, Paramètres, Contact, « Mon dossier »
    'chick': '🐣', 'sun': '☀️', 'moon': '🌙', 'folder': '📂', 'page': '📄', 'passport': '🛂', 'mic': '🎤',
    'link': '🔗', 'mailbox': '📬', 'shield': '🛡️', 'flag-report': '🚩', 'scroll': '📜', 'pushpin': '📌',
    # drapeaux utilisés comme stickers (langues, destinations)
    'flag-fr': '🇫🇷', 'flag-gb': '🇬🇧', 'flag-es': '🇪🇸', 'flag-de': '🇩🇪', 'flag-pt': '🇵🇹', 'flag-it': '🇮🇹',
    'flag-cn': '🇨🇳', 'flag-ru': '🇷🇺', 'flag-tr': '🇹🇷', 'flag-jp': '🇯🇵', 'flag-kr': '🇰🇷',
    'flag-eu': '🇪🇺', 'flag-ca': '🇨🇦', 'flag-us': '🇺🇸',
}
COMPOSITES = {
    'hybrid': ('🏫', '💻'),
    'mix-work': ('🎧', '👥'),
    'family': ('👩', '👨', '🧒'),
    'elders': ('👵', '🧔'),
}

COUNTRIES = ('AF AL DZ AD AO AG AR AM AU AT AZ BS BH BD BB BY BE BZ BJ BT BO BA BW BR BN BG BF BI CV KH CM CA CF TD CL CN CO KM CG CD CR CI HR CU CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FJ FI FR GA GM GE DE GH GR GD GT GN GW GY HT HN HK HU IS IN ID IR IQ IE IL IT JM JP JO KZ KE KI KW KG LA LV LB LS LR LY LI LT LU MO MG MW MY MV ML MT MH MR MU MX FM MD MC MN ME MA MZ MM NA NR NP NL NZ NI NE NG KP MK NO OM PK PW PS PA PG PY PE PH PL PT PR QA RO RU RW KN LC VC WS SM ST SA SN RS SC SL SG SK SI SB SO ZA KR SS ES LK SD SR SE CH SY TW TJ TZ TH TL TG TO TT TN TR TM TV UG UA AE GB US UY UZ VU VA VE VN YE ZM ZW GP MQ GF RE YT NC PF').split()

font = ImageFont.truetype(FONT, 109)


def render(emoji):
    im = Image.new('RGBA', (220, 180), (0, 0, 0, 0))
    ImageDraw.Draw(im).text((20, 10), emoji, font=font, embedded_color=True)
    box = im.getbbox()
    if not box:
        raise ValueError('rien à dessiner pour ' + repr(emoji))
    return im.crop(box)


def fit(im, size):
    w, h = im.size
    k = size / max(w, h)
    return im.resize((max(1, round(w * k)), max(1, round(h * k))), Image.LANCZOS)


def stickerize(art, canvas=160, inner=118, outline=7, shadow=True):
    """Pose l'image au centre, ajoute un contour blanc découpé et une ombre douce."""
    art = fit(art, inner)
    base = Image.new('RGBA', (canvas, canvas), (0, 0, 0, 0))
    ox, oy = (canvas - art.width) // 2, (canvas - art.height) // 2 - 3
    base.paste(art, (ox, oy), art)
    alpha = base.split()[3].point(lambda a: 255 if a > 40 else 0)
    grown = alpha.filter(ImageFilter.MaxFilter(outline * 2 + 1)).filter(ImageFilter.GaussianBlur(1.2))
    grown = grown.point(lambda a: 255 if a > 110 else 0).filter(ImageFilter.GaussianBlur(0.7))
    out = Image.new('RGBA', (canvas, canvas), (0, 0, 0, 0))
    if shadow:
        sh = grown.filter(ImageFilter.GaussianBlur(4))
        sh_img = Image.new('RGBA', (canvas, canvas), BROWN + (0,))
        sh_img.putalpha(sh.point(lambda a: int(a * 0.30)))
        out.alpha_composite(sh_img, (0, 4))
    white = Image.new('RGBA', (canvas, canvas), (255, 255, 255, 0))
    white.putalpha(grown)
    out.alpha_composite(white)
    out.alpha_composite(base)
    return out


def composite(*parts):
    if len(parts) == 3:  # deux adultes derrière, un enfant devant
        A, B, C = fit(render(parts[0]), 80), fit(render(parts[1]), 80), fit(render(parts[2]), 66)
        im = Image.new('RGBA', (160, 140), (0, 0, 0, 0))
        im.alpha_composite(A, (0, 4))
        im.alpha_composite(B, (160 - B.width, 0))
        im.alpha_composite(C, ((160 - C.width) // 2, 140 - C.height))
        return im
    a, b = parts
    A, B = fit(render(a), 92), fit(render(b), 84)
    im = Image.new('RGBA', (150, 140), (0, 0, 0, 0))
    im.alpha_composite(A, (0, 0))
    im.alpha_composite(B, (150 - B.width, 140 - B.height))
    return im


def arabic_bubble():
    s = 4  # sur-échantillonnage pour des bords nets
    W, H = 128 * s, 116 * s
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((0, 0, W - 1, 92 * s), radius=26 * s, fill=ORANGE + (255,))
    d.polygon([(28 * s, 86 * s), (58 * s, 86 * s), (24 * s, 114 * s)], fill=ORANGE + (255,))
    f = ImageFont.truetype(ARABIC_FONT, 44 * s, layout_engine=ImageFont.Layout.RAQM)
    txt = 'عربي'
    bb = d.textbbox((0, 0), txt, font=f, direction='rtl')
    tw, th = bb[2] - bb[0], bb[3] - bb[1]
    d.text(((W - tw) / 2 - bb[0], (92 * s - th) / 2 - bb[1]), txt, font=f, fill=CREAM + (255,), direction='rtl')
    return im.resize((128, 116), Image.LANCZOS)


def save(im, path, quality=86):
    im.save(path, 'WEBP', quality=quality, method=6)


def main():
    os.makedirs(OUT_STICKERS, exist_ok=True)
    os.makedirs(OUT_FLAGS, exist_ok=True)
    n = 0
    for name, emo in STICKERS.items():
        save(stickerize(render(emo)), os.path.join(OUT_STICKERS, name + '.webp')); n += 1
    for name, parts in COMPOSITES.items():
        save(stickerize(composite(*parts)), os.path.join(OUT_STICKERS, name + '.webp')); n += 1
    save(stickerize(arabic_bubble()), os.path.join(OUT_STICKERS, 'lang-ar.webp')); n += 1
    # Drapeaux des pays (sélecteur de pays) — plus petits
    reg = lambda c: ''.join(chr(0x1F1E6 + ord(ch) - 65) for ch in c)
    missing = []
    ref = render(reg('ZZ')) if False else None
    for c in COUNTRIES:
        try:
            art = render(reg(c))
        except ValueError:
            missing.append(c); continue
        # Un drapeau inconnu est dessiné comme deux lettres : on le repère à sa largeur
        if art.width > 150:
            missing.append(c); continue
        save(stickerize(art, canvas=96, inner=72, outline=4), os.path.join(OUT_FLAGS, c + '.webp'), quality=82)
    print(n, 'stickers ;', len(COUNTRIES) - len(missing), 'drapeaux ; manquants :', ' '.join(missing) or 'aucun')


if __name__ == '__main__':
    sys.exit(main())
