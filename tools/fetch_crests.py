#!/usr/bin/env python3
"""Download club crests for Pyramid Manager from Wikipedia and TheSportsDB.

Usage (from the project folder):
    python3 tools/fetch_crests.py              # every club that has no crest yet
    python3 tools/fetch_crests.py --country ESP ITA
    python3 tools/fetch_crests.py --division ESP1 ITA1 GER1 FRA1
    python3 tools/fetch_crests.py --list-missing
    python3 tools/fetch_crests.py --european      # only clubs that regularly play in Europe
    python3 tools/fetch_crests.py --dry-run       # show the matches, download nothing
    python3 tools/fetch_crests.py --source thesportsdb   # or wikipedia; default: both

Each club is looked up on English Wikipedia first (its article's lead image is
almost always the crest) and then, if Wikipedia has nothing, on TheSportsDB.
Crests are saved as img/crests/<club id>.png (128px where `sips` or Pillow is
available), js/crests.js is rebuilt from whatever files are in that folder, and
the page each crest came from is added to tools/crest_sources.txt.
It is safe to stop and re-run: clubs that already have a crest are skipped.
Both sources limit how fast you can ask (Wikipedia: 10 requests a minute without
contact details; TheSportsDB's free key: a few a minute), so the script paces
itself; a run for a few hundred clubs takes about an hour.

Clubs it can't match are written to tools/crest_misses.txt. For those, save a
PNG yourself as img/crests/<club id>.png and run with --rebuild-only. To replace
a wrong crest, delete its file and re-run (or save the right one by hand).
"""

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CREST_DIR = os.path.join(ROOT, "img", "crests")
CRESTS_JS = os.path.join(ROOT, "js", "crests.js")
MISSES = os.path.join(ROOT, "tools", "crest_misses.txt")
SOURCES = os.path.join(ROOT, "tools", "crest_sources.txt")  # where each downloaded crest came from
API = "https://www.thesportsdb.com/api/v1/json/123/searchteams.php?t="
PAUSE = 2.5  # seconds between requests

# Country names as TheSportsDB spells them, where they differ from ours.
COUNTRY_ALIASES = {
    "Czech Republic": ["Czech Republic", "Czechia"],
    "Netherlands": ["Netherlands", "The Netherlands", "Holland"],
    "Bosnia and Herzegovina": ["Bosnia-Herzegovina", "Bosnia and Herzegovina"],
    "Republic of Ireland": ["Ireland", "Republic of Ireland", "Northern Ireland"],
    "Turkey": ["Turkey", "Türkiye"],
    "North Macedonia": ["North Macedonia", "Macedonia"],
    "France": ["France", "Monaco"],  # AS Monaco plays in Ligue 1
    "Wales": ["Wales", "England"],   # some Welsh clubs are listed under England
}


# Alternative search names, where TheSportsDB calls a club something else.
NAME_ALIASES = {
    "Athletic Club": ["Athletic Bilbao"],
    "Inter": ["Inter Milan", "Internazionale"],
    "Hamburger SV": ["Hamburg", "Hamburger SV"],
    "Paris Saint-Germain": ["Paris SG", "Paris Saint Germain", "PSG"],
    "Monaco": ["AS Monaco", "Monaco"],
    "Alavés": ["Deportivo Alaves", "Alaves"],
    "Mainz 05": ["Mainz", "FSV Mainz 05", "1. FSV Mainz 05"],
    "Lille": ["Lille OSC", "Lille"],
    # Clubs that regularly play in Europe.
    "PSV": ["PSV Eindhoven"],
    "AZ": ["AZ Alkmaar"],
    "Utrecht": ["FC Utrecht"],
    "Twente": ["FC Twente"],
    "NEC": ["NEC Nijmegen"],
    "Porto": ["FC Porto"],
    "Braga": ["SC Braga", "Sporting Braga"],
    "Sporting CP": ["Sporting Lisbon", "Sporting"],
    "Vitória de Guimarães": ["Vitoria Guimaraes", "Vitoria SC"],
    "Union Saint-Gilloise": ["Union SG", "Royale Union Saint-Gilloise", "Union St.-Gilloise"],
    "Genk": ["KRC Genk", "Racing Genk"],
    "Gent": ["KAA Gent"],
    "Antwerp": ["Royal Antwerp"],
    "Başakşehir": ["Istanbul Basaksehir", "Basaksehir"],
    "Slavia Prague": ["Slavia Praha", "SK Slavia Praha"],
    "Sparta Prague": ["Sparta Praha", "AC Sparta Praha"],
    "Copenhagen": ["FC Copenhagen", "FC Kobenhavn"],
    "Red Star Belgrade": ["Crvena Zvezda", "Red Star"],
    "Dynamo Kyiv": ["Dynamo Kiev"],
    "Salzburg": ["Red Bull Salzburg", "RB Salzburg"],
    "Red Bull Salzburg": ["Salzburg", "RB Salzburg"],
    "Young Boys": ["BSC Young Boys"],
    "Basel": ["FC Basel"],
    "Ludogorets": ["Ludogorets Razgrad"],
    "FCSB": ["Steaua Bucuresti", "FCSB"],
    "Olimpija Ljubljana": ["NK Olimpija Ljubljana"],
    "Dinamo Zagreb": ["GNK Dinamo Zagreb"],
    "SJK": ["SJK Seinäjoki", "Seinajoen JK"],
    "Partizan": ["Partizan Belgrade", "FK Partizan"],
    "APOEL": ["APOEL Nicosia"],
    "Midtjylland": ["FC Midtjylland"],
    "Nordsjælland": ["FC Nordsjaelland"],
    "AGF": ["AGF Aarhus", "Aarhus GF"],
    "Bodø/Glimt": ["Bodo/Glimt", "FK Bodo/Glimt", "Bodo Glimt"],
    "Malmö FF": ["Malmo FF", "Malmo"],
    "BK Häcken": ["Hacken", "BK Hacken"],
    "Rapid București": ["Rapid Bucuresti", "FC Rapid Bucuresti", "FC Rapid 1923", "Rapid Bucharest"],
    "DAC Dunajská Streda": ["DAC Dunajska Streda", "Dunajska Streda"],
    "Győr": ["Gyori ETO", "ETO FC Gyor"],
    "Hapoel Be'er Sheva": ["Hapoel Beer Sheva", "Hapoel Beersheba", "Hapoel Be'er-Sheva", "H. Beer Sheva"],
    "Hapoel Tel Aviv": ["Hapoel Tel-Aviv", "Hapoel Tel Aviv FC"],
    "Dinamo Minsk": ["FC Dinamo Minsk", "Dinamo Minsk FC", "Dynamo Minsk"],
    "Torpedo-BelAZ Zhodino": ["Torpedo Zhodino", "Torpedo-BelAZ"],
    "Sabah": ["Sabah FK", "Sabah Baku"],
    "Zira": ["Zira FK"],
    "Neftçi": ["Neftchi Baku", "Neftci", "Neftchi", "Neftci PFK"],
    "Araz-Naxçıvan": ["Araz Nakhchivan", "Araz"],
    "Imishli": ["İmişli", "Imisli"],
    "Ararat-Armenia": ["Ararat Armenia", "FC Ararat-Armenia"],
    "Samgurali Tskaltubo": ["Samgurali"],
    "Union Saint-Gilloise": ["Union SG", "Royale Union Saint-Gilloise", "Union St.-Gilloise", "Union Saint Gilloise"],
    "FH": ["FH Hafnarfjordur", "Hafnarfjordur"],
    "KR": ["KR Reykjavik"],
    "FCI Levadia": ["Levadia Tallinn", "FC Levadia"],
    "Auda": ["FK Auda", "Auda Riga"],
    "Derry City": ["Derry City FC"],
    "St Patrick's Athletic": ["St Patricks Athletic", "St. Patrick's Athletic", "St Patricks"],
    "The New Saints": ["TNS", "The New Saints FC", "Total Network Solutions"],
    "Rabotnički": ["Rabotnicki", "FK Rabotnicki", "Rabotnicki Skopje"],
    "Partizani": ["Partizani Tirana", "FK Partizani"],
    "Vllaznia": ["Vllaznia Shkoder"],
    "Racing FC Union Luxembourg": ["Racing Union", "Racing FC"],
    "St Joseph's": ["St Josephs", "St. Joseph's", "St Joseph's FC"],
    "Atlètic Club d'Escaldes": ["Atletic Escaldes", "Atletic Club d'Escaldes"],
    "USV Eschen/Mauren": ["Eschen/Mauren", "USV Eschen Mauren"],
    "St. Gallen": ["FC St. Gallen", "St Gallen", "St. Gallen 1879"],
    "Blau-Weiss Linz": ["Blau-Weiß Linz", "FC Blau Weiss Linz", "Blau Weiss Linz", "FC Blau-Weiß Linz"],
    "Go Ahead Eagles": ["Go Ahead Eagles Deventer"],
    "Omonia": ["Omonia Nicosia", "AC Omonia"],
}

# Skip women's, youth and reserve sides that share a club's name.
NOT_FIRST_TEAM = re.compile(r"women|femin|liga f|frauen|\bw\b|u2[0-3]|u19|youth|reserve|akatemia|academy|\bjong\b|-j\b|\bii\b|\bb\b", re.I)


def norm(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]", "", s.lower().replace("&", "and"))


def clubs():
    """(id, name, country name, division id, rating) for every club in the game's data files."""
    out = []
    # England: js/data.js rows look like ["Liverpool", "LIV", 88, "#C8102E"]
    eng = open(os.path.join(ROOT, "js", "data.js"), encoding="utf-8").read()
    for part in re.split(r'(?=id: "(?:PL|CH|L1|L2)")', eng):
        m = re.match(r'id: "(PL|CH|L1|L2)"', part)
        for name, code, rating in re.findall(r'\["([^"]+)", "([A-Z]{3})", (\d+)', part):
            out.append((code, name, "England", m.group(1) if m else "ENG", int(rating)))
    # Everyone else: js/data/countries/*.js, one addCountry({...}) per country.
    folder = os.path.join(ROOT, "js", "data", "countries")
    for fname in sorted(os.listdir(folder)):
        if not fname.endswith(".js"):
            continue
        text = open(os.path.join(folder, fname), encoding="utf-8").read()
        for block in text.split("addCountry(")[1:]:
            cid = re.search(r'id:\s*"([A-Z]{3})"', block).group(1)
            cname = re.search(r'name:\s*"([^"]+)"', block).group(1)
            for part in re.split(r'(?=id: "[A-Z]{3}[12]")', block):
                m = re.match(r'id: "([A-Z]{3}[12])"', part)
                for name, code, rating in re.findall(r'\["([^"]+)", "([A-Z]{3})", (\d+)', part):
                    out.append((f"{cid}_{code}", name, cname, m.group(1) if m else cid, int(rating)))
    return out


def european_places(rank):
    """European places an association gets at a UEFA rank (mirrors accessFor in js/europe.js)."""
    return 7 if rank <= 4 else 6 if rank <= 6 else 5 if rank <= 15 else 4 if rank <= 50 else 3


def european_regulars(all_clubs):
    """Ids of clubs that regularly play in Europe: in each country's top flight, the
    strongest clubs by rating, as many as the association has European places plus two
    (Liechtenstein: its three strongest clubs, whose cup winner enters)."""
    world = open(os.path.join(ROOT, "js", "data", "world.js"), encoding="utf-8").read()
    order = re.findall(r'\["([A-Z]{3})", [\d.]+\]', world)
    by_div = {}
    for cid, name, country, div, rating in all_clubs:
        by_div.setdefault(div, []).append((rating, cid))
    picked = set()
    for rank, code in enumerate(order, 1):
        if code == "RUS":  # suspended from UEFA competition
            continue
        div = f"{code}1" if f"{code}1" in by_div else code if code in by_div else ("PL" if code == "ENG" else None)
        if not div:
            continue
        k = 3 if code == "LIE" else european_places(rank) + 2
        for rating, cid in sorted(by_div[div], reverse=True)[:k]:
            picked.add(cid)
    return picked


_last = {}


def get(url, gap=0):
    """Fetch a URL, at least `gap` seconds after the previous request to the same host."""
    host = urllib.parse.urlparse(url).netloc
    wiki = "wiki" in host
    ua = "PyramidManager-crest-fetcher/1.0 (personal hobby project) python-urllib" if wiki \
        else "Mozilla/5.0 (PyramidManager crest fetcher)"
    req = urllib.request.Request(url, headers={"User-Agent": ua})
    for attempt in range(8):
        wait = _last.get(host, 0) + gap - time.time()
        if wait > 0:
            time.sleep(wait)
        _last[host] = time.time()
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            after = e.headers.get("Retry-After") if e.headers else None
            wait = int(after) if after and after.isdigit() else (65 if e.code == 429 else 10) * (attempt + 1)
            print(f"    HTTP {e.code}, waiting {wait}s…", flush=True)
            time.sleep(wait)
        except Exception as e:  # network hiccup
            print(f"    {e}, waiting 10s…", flush=True)
            time.sleep(10)
    raise RuntimeError(f"giving up on {url}")


def search(name, country):
    """Best TheSportsDB match for a club, or None."""
    wanted = {norm(c) for c in COUNTRY_ALIASES.get(country, [country])}
    queries = [name] + NAME_ALIASES.get(name, [])
    plain = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode()
    if plain != name:
        queries.append(plain)
    simple = re.sub(r"^(FC|AFC|SC|SK|FK|NK|KF|AC|AS|SS|US|SV|VfB|VfL|1\.)\s+|\s+(FC|SC|CF|FK)$", "", name)
    if simple != name:
        queries.append(simple)
    fallback = None
    for q in queries:
        data = json.loads(get(API + urllib.parse.quote(q)) or b"{}")
        time.sleep(PAUSE)
        teams = [t for t in (data.get("teams") or []) if t.get("strSport") == "Soccer" and t.get("strBadge")
                 and not NOT_FIRST_TEAM.search(f"{t.get('strTeam', '')} {t.get('strLeague', '')}")]
        in_country = [t for t in teams if norm(t.get("strCountry") or "") in wanted]
        # Prefer clubs listed in a real league over unattached sides of the same name.
        in_country.sort(key=lambda t: (t.get("strLeague") or "").startswith("_No League"))
        names = {norm(name), norm(q)}
        exact = [t for t in in_country if norm(t["strTeam"]) in names]
        # Otherwise only accept a club whose name contains the search (or vice versa).
        close = [t for t in in_country if any(n and (n in norm(t["strTeam"]) or norm(t["strTeam"]) in n) for n in names)]
        # Unattached sides ("_No League") are often youth teams or namesakes: exact names only.
        close = [t for t in close if t in exact or not (t.get("strLeague") or "").startswith("_No League")]
        # An exact name wins at once; a looser match only if no query finds an exact one
        # (so an alias like "Omonia Nicosia" beats "Omonia 29M").
        if exact:
            return exact[0]
        if close and not fallback:
            fallback = close[0]
    return fallback


# ---- Wikipedia --------------------------------------------------------------
# A club's English Wikipedia article almost always leads with its crest, so it's
# the first place to look. A page counts only if its description says it's a
# football club and it mentions the club's country. Wikimedia allows clients that
# don't give contact details 10 API requests a minute, so the script asks about
# several clubs at once (up to 50 page titles a request) and paces itself.

WIKI_API = "https://en.wikipedia.org/w/api.php?"
WIKI_GAP = 7      # seconds between API requests
IMAGE_GAP = 3     # seconds between image downloads from Wikimedia

DEMONYMS = {
    "England": "English", "Spain": "Spanish", "Italy": "Italian", "Germany": "German", "France": "French",
    "Netherlands": "Dutch", "Portugal": "Portuguese", "Belgium": "Belgian", "Turkey": "Turkish|Türkiye",
    "Czech Republic": "Czech|Czechia", "Greece": "Greek", "Norway": "Norwegian", "Denmark": "Danish",
    "Poland": "Polish", "Austria": "Austrian", "Switzerland": "Swiss", "Scotland": "Scottish",
    "Israel": "Israeli", "Cyprus": "Cypriot", "Sweden": "Swedish", "Croatia": "Croatian", "Serbia": "Serbian",
    "Hungary": "Hungarian", "Romania": "Romanian", "Slovakia": "Slovak", "Slovenia": "Slovenian|Slovene",
    "Ukraine": "Ukrainian", "Russia": "Russian", "Bulgaria": "Bulgarian", "Azerbaijan": "Azerbaijani",
    "Kazakhstan": "Kazakh|Kazakhstani", "Belarus": "Belarusian", "Moldova": "Moldovan", "Armenia": "Armenian",
    "Georgia": "Georgian", "Finland": "Finnish", "Iceland": "Icelandic", "Faroe Islands": "Faroese",
    "Estonia": "Estonian", "Latvia": "Latvian", "Lithuania": "Lithuanian", "Republic of Ireland": "Ireland|Irish",
    "Northern Ireland": "Northern Irish", "Wales": "Welsh", "Bosnia and Herzegovina": "Bosnian|Bosnia",
    "Montenegro": "Montenegrin", "North Macedonia": "Macedonian|Macedonia", "Albania": "Albanian",
    "Kosovo": "Kosovar", "Malta": "Maltese", "Luxembourg": "Luxembourgish", "Gibraltar": "Gibraltarian",
    "Andorra": "Andorran", "San Marino": "Sammarinese", "Liechtenstein": "Liechtensteiner",
}

# Words in a page's description that mean it isn't a club's first team.
WIKI_NOT_CLUB = re.compile(r"\bseasons?\b|women|ladies|youth|reserve|under-\d|\bu-?\d\d\b|basketball|futsal|handball|"
                           r"volleyball|hockey|rivalry|derby|stadium|footballer|\bplayer\b|\bcoach\b|disambiguation|"
                           r"topics referred|defunct|former|\bleague\b|competition|\bcup\b|tournament|national team", re.I)
WIKI_CLUB = re.compile(r"(football|soccer) (club|team)|football section|association football", re.I)
# Title patterns Wikipedia uses for clubs, everywhere and per country.
TITLE_FORMS = ["{}", "{} F.C.", "FC {}", "{} FC"]
COUNTRY_FORMS = {
    "Albania": ["KF {}", "FK {}"], "Kosovo": ["KF {}", "FC {}"],
    "Croatia": ["NK {}", "HNK {}"], "Slovenia": ["NK {}"],
    "Serbia": ["FK {}"], "Montenegro": ["FK {}", "OFK {}"], "North Macedonia": ["FK {}"],
    "Bosnia and Herzegovina": ["FK {}", "NK {}", "HŠK {}"],
    "Bulgaria": ["PFC {}"], "Russia": ["PFC {}"], "Ukraine": ["PFC {}", "NK {}"], "Belarus": ["FC {}"],
    "Azerbaijan": ["{} FK", "{} PFK"], "Kazakhstan": ["FC {}"], "Armenia": ["FC {}"], "Georgia": ["FC {}"],
    "Moldova": ["FC {}", "CS {}"],
    "Czech Republic": ["FK {}", "SK {}", "MFK {}", "FC {}"], "Slovakia": ["MFK {}", "FK {}", "MŠK {}", "FC {}"],
    "Hungary": ["{} FC", "{} TE"], "Romania": ["CS {}", "ACS {}", "FC {}", "AFC {}"],
    "Turkey": ["{} S.K.", "{} F.K."], "Poland": ["{} (football)", "MKS {}", "KS {}"],
    "Lithuania": ["FK {}", "FA {}"], "Latvia": ["FK {}"], "Estonia": ["JK {}", "FC {}"],
    "Norway": ["FK {}", "{} FK", "{} IF", "{} IL", "{} Fotball", "{} BK"],
    "Denmark": ["{} BK", "{} Boldklub", "{} FF", "{} Fodbold"], "Sweden": ["{} FF"],
    "Iceland": ["{} (football)"], "Faroe Islands": ["{} (football)"],
    "San Marino": ["S.S. {}", "S.P. {}", "A.C. {}", "S.C. {}"],
    "Netherlands": ["SC {}"], "Germany": ["1. FC {}", "SV {}"], "Austria": ["SV {}", "SC {}"],
    "Switzerland": ["FC {}"], "Italy": ["{} Calcio", "AC {}", "US {}"], "Portugal": ["C.D. {}", "F.C. {}", "G.D. {}"],
}
GENERIC = {"fc", "fk", "sc", "sk", "nk", "kf", "ac", "as", "ss", "us", "sv", "cd", "ud", "cf", "afc", "pfc", "club",
           "football", "the", "de", "of", "if", "ik", "bk", "ff", "jk", "vfl", "vfb", "1"}


def wiki_get(params):
    """Pages for a query, and where each requested title ended up (after redirects)."""
    params = {"action": "query", **params, "format": "json", "formatversion": "2", "redirects": "1"}
    q = json.loads(get(WIKI_API + urllib.parse.urlencode(params), WIKI_GAP) or b"{}").get("query", {})
    moved = {}
    for hop in q.get("normalized", []) + q.get("redirects", []):
        moved[hop["from"]] = hop["to"]
    def final(t):
        seen = set()
        while t in moved and t not in seen:
            seen.add(t)
            t = moved[t]
        return t
    return q.get("pages", []), final


PAGE_PROPS = {"prop": "pageimages|description", "piprop": "thumbnail|name", "pithumbsize": "250", "pilicense": "any"}
EXTRACTS = {"prop": "pageimages|description|extracts", "exintro": "1", "explaintext": "1", "exsentences": "2",
            "exlimit": "20", "piprop": "thumbnail|name", "pithumbsize": "250", "pilicense": "any"}
UNSURE = "country not in description"
SPORTS = "a multi-sport club"  # used only if no football club article turns up


def wiki_ok(page, name, country, check_name):
    """Why a page isn't this club's article with a crest, or None if it is."""
    if page.get("missing") or page.get("invalid") or not page.get("thumbnail"):
        return "no page or image"
    desc = page.get("description") or ""
    first = (page.get("extract") or "")[:400]
    youth = NOT_FIRST_TEAM.search(name)  # the game's own club is a B or U22 side
    sports = False
    if desc:
        if WIKI_NOT_CLUB.search(desc) and not youth:
            return f"not a club: {desc}"
        if not WIKI_CLUB.search(desc):
            # "Icelandic sports club": often the football club, but it might be a
            # sports society whose emblem isn't the football team's.
            if not re.search(r"sports? club", desc, re.I):
                return f"not a club: {desc}"
            sports = True
    elif "extract" not in page:
        return UNSURE
    elif not WIKI_CLUB.search(first) or re.search(r"\bseason\b|women's|footballer", first, re.I):
        return "not a club"
    if not re.search(rf"\b({country}|{DEMONYMS.get(country, country)})\b", f"{desc} {first}", re.I):
        return UNSURE if "extract" not in page else "wrong country"
    image = page.get("pageimage") or ""
    crest = re.search(r"logo|crest|badge|emblem|escudo|wappen|herb|grb|stemma|c[ií]mer|s[ií]mbolo", image, re.I)
    if re.search(r"\.jpe?g$", image, re.I) and not crest:
        return f"image looks like a photo: {image}"
    if re.search(r"kit_|kit body|locator|location|map|flag_of|stadium|stadion|_team|squad|players", image, re.I) and not crest:
        return f"image isn't a crest: {image}"
    if check_name:
        words = set(re.findall(r"[a-z0-9]+", unicodedata.normalize("NFKD", f"{page['title']} {first[:200]}")
                               .encode("ascii", "ignore").decode().lower()))
        flat = norm(page["title"]).replace("y", "i")
        for tok in re.findall(r"[a-z0-9]+", unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode().lower()):
            if tok in GENERIC or tok in words:
                continue
            if len(tok) < 4 or tok.replace("y", "i") not in flat:
                return f"name doesn't match: {page['title']}"
    return SPORTS if sports else None


def club_titles(name, country):
    """Page titles to try for a club, best guess first."""
    titles = []
    def add(t):
        if t not in titles:
            titles.append(t)
    for a in WIKI_ALIASES.get(name, []):
        add(a)
    for form in TITLE_FORMS + COUNTRY_FORMS.get(country, []):
        add(form.format(name))
    for a in NAME_ALIASES.get(name, []):
        for form in ("{}", "{} F.C.", "FC {}"):
            add(form.format(a))
    return titles[:50]


def wiki_find_all(todo):
    """{club id: (article title, image URL, image file name)} for the clubs Wikipedia has."""
    hit = lambda p: (p["title"], p["thumbnail"]["source"], p.get("pageimage"))
    found, unsure, sports = {}, {}, {}
    # 1. Likely article titles, for several clubs per request.
    batch, size = [], 0
    def run(batch):
        titles = [t for _, _, _, ts in batch for t in ts]
        pages, final = wiki_get({**PAGE_PROPS, "titles": "|".join(titles)})
        by_title = {p["title"]: p for p in pages}
        for cid, name, country, ts in batch:
            for t in ts:
                p = by_title.get(final(t))
                if not p:
                    continue
                why = wiki_ok(p, name, country, False)
                if why is None:
                    found[cid] = hit(p)
                    break
                if why == SPORTS:
                    sports.setdefault(cid, hit(p))
                if why == UNSURE:
                    unsure.setdefault(cid, (name, country, []))[2].append(p["title"])
        print(f"  Wikipedia: {len(found)} found after asking about {sum(1 for _ in done) + len(batch)} clubs", flush=True)
    done = []
    for cid, name, country in todo:
        ts = club_titles(name, country)
        if batch and size + len(ts) > 50:
            run(batch)
            done.extend(batch)
            batch, size = [], 0
        batch.append((cid, name, country, ts))
        size += len(ts)
    if batch:
        run(batch)
        done.extend(batch)
    # 2. Football clubs whose description doesn't name a country: check the article's opening.
    for cid, (name, country, titles) in unsure.items():
        if cid in found:
            continue
        pages, _ = wiki_get({**EXTRACTS, "titles": "|".join(dict.fromkeys(titles[:20]))})
        for p in pages:
            why = wiki_ok(p, name, country, False)
            if why is None:
                found[cid] = hit(p)
                break
            if why == SPORTS:
                sports.setdefault(cid, hit(p))
    # 3. A search for the rest, checking that the article's title carries the club's name.
    rest = [c for c in todo if c[0] not in found]
    print(f"  Wikipedia: {len(found)} found by title; searching for the other {len(rest)}", flush=True)
    for cid, name, country in rest:
        pages, _ = wiki_get({**EXTRACTS, "generator": "search", "gsrsearch": f"{name} football club {country}",
                             "gsrlimit": "6"})
        for p in sorted(pages, key=lambda p: p.get("index", 0)):
            if not wiki_ok(p, name, country, True):
                found[cid] = hit(p)
                break
    # 4. Sports clubs (one article for all its teams), when nothing better turned up.
    for cid, h in sports.items():
        found.setdefault(cid, h)
    print(f"  Wikipedia: {len(found)} of {len(todo)} found", flush=True)
    return found


# Wikipedia article titles for clubs whose game name is too short or plain to find.
WIKI_ALIASES = {
    "AEL": ["Athlitiki Enosi Larissa F.C."],
    "OB": ["Odense Boldklub"],
    "KA": ["Knattspyrnufélag Akureyrar"],
    "ÍA": ["Íþróttabandalag Akraness", "ÍA Akranes"],
    "ÍBV": ["ÍBV (football)", "Íþróttabandalag Vestmannaeyja"],
    "KTP": ["Kotkan Työväen Palloilijat"],
    "AVS": ["AVS Futebol SAD", "AVS – Futebol SAD"],
    "Nacional": ["C.D. Nacional"],
    "Red Star": ["Red Star F.C."],
    "Andorra": ["FC Andorra"],
    "Excelsior": ["Excelsior Rotterdam", "SBV Excelsior"],
    "Real Sociedad B": ["Real Sociedad B"],
    "Zenit": ["FC Zenit Saint Petersburg"],
    "Krasnodar": ["FC Krasnodar"],
    "Sochi": ["PFC Sochi"],
    "Orenburg": ["FC Orenburg"],
    "Rostov": ["FC Rostov"],
    "Montana": ["PFC Montana"],
    "Cosmos": ["S.S. Cosmos"],
    "Libertas": ["A.C. Libertas"],
    "Murata": ["S.P. Murata"],
    "Cailungo": ["S.P. Cailungo"],
    "Domagnano": ["S.P. Domagnano"],
    "Fiorentino": ["S.S. Fiorentino"],
    "Faetano": ["S.C. Faetano"],
    "Pennarossa": ["S.S. Pennarossa"],
    "San Giovanni": ["S.S. San Giovanni"],
    "Juvenes/Dogana": ["S.S. Juvenes/Dogana"],
    "San Marino Academy U22": ["San Marino Academy"],
    "Lynx": ["Lynx F.C."],
    "Bangor": ["Bangor F.C."],
    "Van": ["FC Van"],
    "Turan": ["FC Turan"],
    "Minsk": ["FC Minsk"],
    "Gomel": ["FC Gomel"],
    "Vitebsk": ["FC Vitebsk"],
    "Smorgon": ["FC Smorgon"],
    "Slutsk": ["FC Slutsk"],
    "Molodechno": ["FC Molodechno"],
    "Pau": ["Pau FC"],
    "Dundee": ["Dundee F.C."],
    "Vora": ["KF Vora"],
    "Metta": ["FK Metta"],
    "Mosta": ["Mosta F.C."],
    "Gagra": ["FC Gagra"],
    "Telavi": ["FC Telavi"],
    "Kudrivka": ["FC Kudrivka"],
    "Poltava": ["FC Poltava"],
    "Volos": ["Volos N.F.C."],
    "Kifisia": ["Kifisia F.C."],
    "Fram": ["Knattspyrnufélagið Fram"],
    "Vestri": ["Vestri (football)", "Íþróttafélagið Vestri"],
    "Afturelding": ["Afturelding (football)", "UMF Afturelding"],
    "Waterford": ["Waterford F.C."],
    "Dender": ["F.C.V. Dender E.H."],
    "Teuta": ["KF Teuta Durrës"],
    "Bylis": ["KF Bylis Ballsh"],
    "Flamurtari": ["Flamurtari Vlorë"],
    "Dukagjini": ["KF Dukagjini"],
    "Ferizaj": ["KF Ferizaj"],
    "Drenica": ["KF Drenica"],
    "Kapaz": ["Kapaz PFK"],
    "Shamakhi": ["Shamakhi FK"],
    "Imishli": ["Imishli FK"],
    "Karvan": ["Karvan FK", "Karvan-Evlakh FK"],
    "Sumgayit": ["Sumgayit FK"],
    "Gabala": ["Gabala FC"],
    "Shirak": ["Shirak SC"],
    "Kaisar": ["FC Kaisar"],
    "Zhenis": ["FC Zhenis"],
    "Atyrau": ["FC Atyrau"],
    "Okzhetpes": ["FC Okzhetpes"],
    "Ulytau": ["FC Ulytau"],
    "Zhetysu": ["FC Zhetysu"],
    "Kyzylzhar": ["FC Kyzylzhar"],
    "Laval": ["Stade Lavallois"],
    "Reims": ["Stade de Reims"],
    "Troyes": ["ES Troyes AC"],
    "Guingamp": ["En Avant Guingamp"],
    "Bastia": ["SC Bastia"],
    "Amiens": ["Amiens SC"],
    "Annecy": ["FC Annecy"],
    "Grenoble": ["Grenoble Foot 38"],
    "Nancy": ["AS Nancy Lorraine"],
    "Le Mans": ["Le Mans FC"],
    "Rodez": ["Rodez AF"],
    "Boulogne": ["US Boulogne"],
    "Dunkerque": ["USL Dunkerque"],
    "Clermont": ["Clermont Foot"],
    "Montpellier": ["Montpellier HSC"],
    "Saint-Étienne": ["AS Saint-Étienne"],
    "Sion": ["FC Sion"],
    "Thun": ["FC Thun"],
    "Zürich": ["FC Zürich"],
    "Winterthur": ["FC Winterthur"],
    "Grasshoppers": ["Grasshopper Club Zürich"],
    "Hartberg": ["TSV Hartberg"],
    "Altach": ["SC Rheindorf Altach"],
    "Paderborn": ["SC Paderborn 07"],
    "Kaiserslautern": ["1. FC Kaiserslautern"],
    "Nürnberg": ["1. FC Nürnberg"],
    "Magdeburg": ["1. FC Magdeburg"],
    "Elversberg": ["SV Elversberg"],
    "Schalke 04": ["FC Schalke 04"],
    "Darmstadt 98": ["SV Darmstadt 98"],
    "Mechelen": ["K.V. Mechelen"],
    "Westerlo": ["K.V.C. Westerlo"],
    "Charleroi": ["R. Charleroi S.C."],
    "Heerenveen": ["SC Heerenveen"],
    "Groningen": ["FC Groningen"],
    "Volendam": ["FC Volendam"],
    "Telstar": ["SC Telstar"],
    "Heracles": ["Heracles Almelo"],
    "Estoril": ["G.D. Estoril Praia"],
    "Arouca": ["F.C. Arouca"],
    "Alverca": ["F.C. Alverca"],
    "Tondela": ["C.D. Tondela"],
    "Moreirense": ["Moreirense F.C."],
    "Monza": ["AC Monza"],
    "Empoli": ["Empoli FC"],
    "Venezia": ["Venezia FC"],
    "Palermo": ["Palermo FC"],
    "Spezia": ["Spezia Calcio"],
    "Sampdoria": ["UC Sampdoria"],
    "Modena": ["Modena FC 2018", "Modena FC"],
    "Bari": ["SSC Bari"],
    "Cesena": ["Cesena FC"],
    "Mantova": ["Mantova 1911"],
    "Padova": ["Calcio Padova"],
    "Pescara": ["Delfino Pescara 1936"],
    "Avellino": ["US Avellino 1912"],
    "Reggiana": ["AC Reggiana 1919"],
    "Südtirol": ["FC Südtirol"],
    "Carrarese": ["Carrarese Calcio"],
    "Catanzaro": ["US Catanzaro 1929"],
    "Frosinone": ["Frosinone Calcio"],
    "Las Palmas": ["UD Las Palmas"],
    "Leganés": ["CD Leganés"],
    "Almería": ["UD Almería"],
    "Granada": ["Granada CF"],
    "Málaga": ["Málaga CF"],
    "Cádiz": ["Cádiz CF"],
    "Eibar": ["SD Eibar"],
    "Castellón": ["CD Castellón"],
    "Córdoba": ["Córdoba CF"],
    "Huesca": ["SD Huesca"],
    "Burgos": ["Burgos CF"],
    "Mirandés": ["CD Mirandés"],
    "Albacete": ["Albacete Balompié"],
    "Ceuta": ["AD Ceuta FC"],
    "Gaziantep": ["Gaziantep F.K."],
    "Eyüpspor": ["Eyüpspor"],
}


def save_png(url, path):
    data = get(url, IMAGE_GAP) if "wikimedia" in url else get(url + "/small")
    if not data.startswith(b"\x89PNG"):
        if not (data.startswith(b"\xff\xd8") or data.startswith(b"GIF8")):
            raise ValueError("not an image")
        # A JPEG or GIF crest: convert it to PNG.
        tmp = path + ".src"
        with open(tmp, "wb") as f:
            f.write(data)
        try:
            if shutil.which("sips"):
                subprocess.run(["sips", "-s", "format", "png", tmp, "--out", path], capture_output=True, check=True)
            else:
                from PIL import Image  # optional
                Image.open(tmp).save(path, "PNG")
        except Exception:
            raise ValueError("not a PNG, and no way to convert it")
        finally:
            os.remove(tmp)
        data = None
    if data is not None:
        with open(path, "wb") as f:
            f.write(data)    # Shrink to 128px to keep the game light.
    if shutil.which("sips"):
        subprocess.run(["sips", "-Z", "128", path], capture_output=True)
    else:
        try:
            from PIL import Image  # optional
            im = Image.open(path)
            im.thumbnail((128, 128))
            im.save(path)
        except Exception:
            pass


def rebuild_crests_js():
    ids = sorted(f[:-4] for f in os.listdir(CREST_DIR) if f.endswith(".png"))
    lines = []
    row = []
    for i in ids:
        row.append(f'"{i}"')
        if len(", ".join(row)) > 90:
            lines.append("  " + ", ".join(row) + ",")
            row = []
    if row:
        lines.append("  " + ", ".join(row) + ",")
    js = (
        "// Club crests bundled in img/crests/<club id>.png (sources: Wikipedia and TheSportsDB;\n"
        "// tools/crest_sources.txt says where each recent one came from).\n"
        "// Clubs not listed here fall back to a coloured badge with their short code.\n"
        "// Rebuilt by tools/fetch_crests.py.\n\n"
        'const CREST_DIR = "img/crests/";\n'
        "const CRESTS = new Set([\n" + "\n".join(lines) + "\n]);\n"
    )
    with open(CRESTS_JS, "w", encoding="utf-8") as f:
        f.write(js)
    print(f"js/crests.js lists {len(ids)} crests")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--country", nargs="*", help="only these country codes (e.g. ESP ITA; England is ENG)")
    ap.add_argument("--division", nargs="*", help="only these divisions (e.g. ESP1 GER1; England: PL CH L1 L2)")
    ap.add_argument("--european", action="store_true", help="only clubs that regularly play in European competition")
    ap.add_argument("--list-missing", action="store_true", help="list clubs without a crest and stop")
    ap.add_argument("--rebuild-only", action="store_true", help="just rebuild js/crests.js from img/crests")
    ap.add_argument("--source", choices=["both", "wikipedia", "thesportsdb"], default="both",
                    help="where to look (default: Wikipedia, then TheSportsDB for clubs it can't find)")
    ap.add_argument("--dry-run", action="store_true", help="show what each club would match without downloading")
    args = ap.parse_args()
    os.makedirs(CREST_DIR, exist_ok=True)
    if args.rebuild_only:
        rebuild_crests_js()
        return
    todo = []
    all_clubs = clubs()
    regulars = european_regulars(all_clubs) if args.european else None
    for cid, name, country, div, _rating in all_clubs:
        if regulars is not None and cid not in regulars:
            continue
        code = cid.split("_")[0] if "_" in cid else "ENG"
        if args.country and code not in args.country:
            continue
        if args.division and div not in args.division:
            continue
        if not os.path.exists(os.path.join(CREST_DIR, cid + ".png")):
            todo.append((cid, name, country))
    print(f"{len(todo)} clubs without a crest")
    if args.list_missing:
        for cid, name, country in todo:
            print(f"  {cid:10} {name} ({country})")
        return
    misses = []
    try:
        wiki = wiki_find_all(todo) if args.source in ("both", "wikipedia") else {}
        for n, (cid, name, country) in enumerate(todo, 1):
            try:
                found = None  # (image URL, where it came from)
                if cid in wiki:
                    w = wiki[cid]
                    found = (w[1], f"Wikipedia: {w[0]} [{w[2]}]")
                elif args.source in ("both", "thesportsdb"):
                    t = search(name, country)
                    if t:
                        found = (t["strBadge"], f"TheSportsDB: {t['strTeam']} ({t.get('strLeague')})")
                if not found:
                    print(f"[{n}/{len(todo)}] MISS {cid} {name}", flush=True)
                    misses.append(f"{cid}\t{name}\t{country}")
                    continue
                if not args.dry_run:
                    save_png(found[0], os.path.join(CREST_DIR, cid + ".png"))
                    with open(SOURCES, "a", encoding="utf-8") as f:
                        f.write(f"{cid}\t{name}\t{found[1]}\n")
                print(f"[{n}/{len(todo)}] OK   {cid} {name} -> {found[1]}", flush=True)
            except Exception as e:
                print(f"[{n}/{len(todo)}] FAIL {cid} {name}: {e}", flush=True)
                misses.append(f"{cid}\t{name}\t{country}")
    except KeyboardInterrupt:
        print("\nStopped. Re-run to carry on where you left off.")
    finally:
        if args.dry_run:
            print(f"{len(misses)} clubs not found")
        else:
            with open(MISSES, "w", encoding="utf-8") as f:
                f.write("\n".join(misses) + ("\n" if misses else ""))
            rebuild_crests_js()
            if misses:
                print(f"{len(misses)} clubs not found: see tools/crest_misses.txt")


if __name__ == "__main__":
    sys.exit(main())
