import html
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "source")
OUT = {"prod": os.path.join(HERE, "prod"), "dev": os.path.join(HERE, "dev")}
INFO = json.load(open(os.path.join(HERE, "glossaries.json"), encoding="utf-8"))
for d in OUT.values():
    os.makedirs(d, exist_ok=True)

QA_RE = re.compile(r'<summary><span class="q">Q</span><span>(.*?)</span></summary>\s*<div class="a">(.*?)</div>', re.S)


def e(s):
    return html.escape(s, quote=False)


def p(*paras):
    """Answer markup from plain-text paragraphs."""
    return "".join(f"<p>{e(x)}</p>" for x in paras)


def parse(name):
    s = open(os.path.join(SRC, name + ".html"), encoding="utf-8").read()
    head = s[: s.index("</head>")]
    style = re.search(r"<style>(.*?)</style>", s, re.S).group(1)
    h1 = html.unescape(re.search(r"<h1>(.*?)</h1>", s, re.S).group(1))
    purpose = html.unescape(re.search(r'<p class="purpose">(.*?)</p>', s, re.S).group(1))
    qas = [[html.unescape(q), a.strip()] for q, a in QA_RE.findall(s)]
    return head, style, h1, purpose, qas


# ------------------------------------------------------------------ dev edits
# Each entry: list of ops applied in order.
#   ("replace", question, new_answer_html)      same question, new answer
#   ("rewrite", question, new_q, new_answer)    new question and answer
#   ("after", question|None, new_q, new_answer) insert after question (None = end)
#   ("drop", question)
ITEM_ACTIONS = lambda where: ("after", None, "What is the See item actions button?", p(
    f"In dev mode, Owners and above see a clipboard button in {where}. It opens Item Actions, "
    "which gathers the items behind the drop into one list to work through. Item Actions is "
    "still Coming Soon, so the page it opens is a preview."))

EDITS = {
    "sales": [ITEM_ACTIONS("a store's report")],
    "vendors": [ITEM_ACTIONS("a vendor's report, with a count of the items that need attention")],
    "sub-dept-margins": [ITEM_ACTIONS("a sub department's report")],

    "upc-list": [
        ("replace", "What does Price Opt show?", p(
            "It lists every price each item sold at in your date range, with the quantity and revenue at each price. "
            "The price marked \u201cbest\u201d is the one that brought in the most profit once cost is known, which isn\u2019t always "
            "the one with the most revenue. Elasticity shows how much sales moved when the price changed, and an item needs at least two prices to show it.",
            "Items sold by weight are priced per pound, so their best price reads /lb and the Volume at best tile shows pounds. "
            "Other items show Qty at best.")),
        ("replace", "What does Trend show?", p(
            "It compares each item's daily sales before and after a point in your range and labels it Growing, Declining, "
            "Accelerating, Reduced availability or New since pivot, with the biggest losses first.",
            "Accelerating means the decline is getting steeper, not easing. Reduced availability means the daily rate held up "
            "but the item sold on fewer days, which often points to a stocking problem. New since pivot means the item had no "
            "sales before that point, so there is nothing to compare it with. Confidence shows how steady the pattern is.")),
        ("replace", "Can I export the results?", p(
            "Yes. Click the download icon at the top right. It exports the tab you're on as a CSV file, with options such as all "
            "UPCs or only the ones you've ticked. A Unit column says whether each row counts units or pounds, so a mix of "
            "weighed and packaged items still adds up correctly.")),
        ("after", None, "A tab didn't load. What do I do?", p(
            "If a tab couldn't get its data, open it again or change your search and it will try again. A failed load is no "
            "longer remembered as \u201cno results\u201d.")),
    ],

    "admin": [
        ("replace", "Who can use Admin?", p(
            "Admin is available to Owners (level 7) and above. You'll see your own companies and the stores assigned to you.")),
        ("rewrite", "Why don't I see a Companies tab?", "Why don't I see a Companies tab?", p(
            "Setting up and changing companies is handled by CounterCtrl, so that tab is only shown to CounterCtrl staff.")),
        ("after", None, "Where did base groups and shared groups go?", p(
            "They are on the User Management page, under the Base Groups and Shared Groups tabs. Admin now only covers "
            "store activity and store names.")),
    ],

    "store-groups": [
        ("after", "What is a store group?", "Where do I find my groups?", p(
            "In dev mode your store groups live on the User Management page, under the User Groups tab. Everyone can open it.")),
        ("after", "How do I delete a group?", "What do the All, Mine and Shared buttons do?", p(
            "They filter the list at the top of the left column. All shows every group you have, Mine shows the groups you "
            "built yourself, and Shared shows the shared groups you have been given.")),
        ("after", "What do the All, Mine and Shared buttons do?", "What do SHARED BY YOU and SHARED WITH YOU mean?", p(
            "Both mark a shared group. SHARED BY YOU is one you created on the Shared Groups tab and shared with yourself. "
            "SHARED WITH YOU is one someone else created and shared with you.")),
        ("after", "What do SHARED BY YOU and SHARED WITH YOU mean?", "Why can't I change a shared group here?", p(
            "Shared groups are read-only on this tab, so there is no rename, delete or store picker. Only the person who "
            "created a shared group can change it, on the Shared Groups tab. You'll see only the stores in it that you are "
            "assigned to.")),
        ("replace", "How do I use a group in a search?", p(
            "On pages with a store search, set Type to Group and choose one of your own groups, or set it to Shared to choose "
            "a shared group. The results cover every store in that group you have access to.")),
        ("replace", "Whose groups are listed here?", p(
            "The groups you created, plus any shared groups you've been given. Use the search box at the top of the list to "
            "find one quickly.")),
        ("after", None, "What happens if a group I search with is deleted?", p(
            "The page stops using it and asks you to choose a store or group again. The same happens when a shared group is "
            "deleted or unshared by the person who made it.")),
    ],

    "store-groups-mobile": [
        ("after", "How do I delete a group?", "Why are some groups missing under Update, Delete or Assign?", p(
            "Shared groups can't be changed on your phone, so they are left out of those lists. Only the person who created "
            "a shared group can change it, from User Management on a computer.")),
        ("replace", "How do I use a group in a search?", p(
            "When a page lets you search by Group, choose one of your groups, or choose Shared to pick a shared group. The "
            "results cover every store in that group you have access to.")),
        ("replace", "Whose groups are listed here?", p(
            "The groups you created, plus any shared groups you've been given. Shared groups can be used in a search but not "
            "changed here.")),
    ],

    "user-management": [
        ("after", None, "__placeholder__", ""),  # replaced wholesale below
    ],
}

USER_MGMT = {
    "purpose": "Manage your users, your store groups and shared groups, and see the stores you're assigned to.",
    "qas": [
        ("What tabs will I see?", p(
            "It depends on your level. Users is for Managers (level 5) and above. User Groups and Stores are for everyone. "
            "Shared Groups and Base Groups are for Owners (level 7) and above.",
            "In dev mode User Management is a desktop page, and everyone can open it from the menu.")),
        ("How do I add a new user?", None),
        ("Can I copy another user's setup?", None),
        ("How do I find a user?", None),
        ("How do I change a user's role, level or details?", None),
        ("How do I change a user's companies, base groups or stores?", None),
        ("How do I reset a user's password?", None),
        ("How do I delete a user or bring one back?", None),
        ("Why do some users show \"Unauthorized\"?", p(
            "Those users are above your level, so you can't open or change them. The Users tab is available to Managers and above.")),
        ("What is the User Groups tab?", p(
            "It holds your own store groups and any shared groups you've been given. Use All, Mine and Shared at the top of "
            "the list to filter it. You create, rename and delete your own groups here, and add or remove their stores.",
            "Shared groups are marked SHARED BY YOU or SHARED WITH YOU and are read-only here. They show only the stores you "
            "are assigned to.")),
        ("What is a shared group?", p(
            "A store group that an Owner builds once and shares with other users. It appears in each user's User Groups tab "
            "and in the store search under Shared, so a whole team can search the same set of stores.")),
        ("How do I create a shared group?", p(
            "On the Shared Groups tab, click +, type a name and click Create. Select the group, then use its Stores tab to "
            "add stores and its Users tab to share it.")),
        ("How do I share or unshare a group?", p(
            "Select the group and open its Users tab. Click users to select them, then click Share or Unshare (or Share all / "
            "Unshare all). The counts show how many are shared out of how many are listed. Changes save straight away.",
            "To use the group yourself, share it with yourself. It then shows in your User Groups tab as SHARED BY YOU.")),
        ("Who can change a shared group?", p(
            "Only the person who created it can rename it, change its stores, share it or delete it. Everyone it is shared "
            "with can search with it but can't change it.")),
        ("What happens when a shared group is deleted?", p(
            "It disappears for everyone it was shared with. Anyone who was searching with it is asked to choose a store or "
            "group again.")),
        ("What are base groups?", p(
            "Base groups are sets of stores within a company, used to give users their stores. The Base Groups tab is for "
            "Owners and above: click + to create one, select it to rename or delete it, and use its Stores and Users tabs to "
            "assign stores and users.")),
        ("What does the Stores tab show?", p(
            "The stores you are assigned to. You can search the list and export it.")),
        ("How do I export a list?", p(
            "Click the download icon at the top right to save a CSV for the tab you're on: users (all, or just your current "
            "filter results), the selected base group's stores, or your store list on the Stores tab.")),
    ],
}


def apply(name, qas):
    if name == "user-management":
        prod = dict(qas)
        return [[q, a if a is not None else prod[q]] for q, a in USER_MGMT["qas"]]
    for op in EDITS.get(name, []):
        idx = {q: i for i, (q, _) in enumerate(qas)}
        kind = op[0]
        if kind == "replace":
            qas[idx[op[1]]][1] = op[2]
        elif kind == "rewrite":
            qas[idx[op[1]]] = [op[2], op[3]]
        elif kind == "after":
            pos = len(qas) if op[1] is None else idx[op[1]] + 1
            qas.insert(pos, [op[2], op[3]])
        elif kind == "drop":
            del qas[idx[op[1]]]
    return qas


# ------------------------------------------------------------------ glossary markup
EXTRA_CSS = """
  .stamp .tag {
    margin-left: 2px; padding: 3px 6px; border-radius: 4px;
    background: rgba(255, 255, 255, .1); color: var(--on-navy);
  }
  .jump { display: flex; gap: 6px; margin: 14px 0 0; flex-wrap: wrap; }
  .jump a {
    font: 600 11px/1 var(--mono); letter-spacing: .06em; text-transform: uppercase;
    color: var(--on-navy); text-decoration: none; padding: 7px 10px; border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, .18);
  }
  .jump a:hover { background: var(--navy-2); }
  .jump a:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
  .section + .section { margin-top: 22px; }
  .section { scroll-margin-top: 12px; }
  @media (prefers-reduced-motion: no-preference) { html { scroll-behavior: smooth; } }
  .terms {
    margin: 0; background: var(--card); border: 1px solid var(--line); border-radius: 10px;
    overflow: hidden;
  }
  .term { padding: 12px 14px; }
  .term + .term { border-top: 1px solid var(--line); }
  .term dt { font: 600 13.5px/1.35 var(--display); color: var(--ink); margin: 0 0 3px; }
  .term dd { margin: 0; color: var(--ink-2); }
  .term ul { margin: 8px 0 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 6px; }
  .term li {
    padding: 8px 10px; border-radius: 8px; background: var(--soft); border: 1px solid var(--line);
  }
  .term li b { display: block; font: 600 12.5px/1.3 var(--display); color: var(--ink); margin-bottom: 2px; }
  .group-head {
    margin: 16px 4px 8px; font: 700 14px/1.3 var(--display); color: var(--navy);
  }
  .group-head:first-of-type { margin-top: 0; }
  .group-note { margin: -4px 4px 8px; color: var(--ink-3); font-size: 12.5px; }

  /* These pages are shown in the app's help modal, where the frame IS the
     modal. The page fills it, the navy header stays put, and only what is
     under it scrolls - a page that scrolled as a whole, inside a card, on a
     background of another colour, read as a window inside a window. */
  html, body { height: 100%; }
  body { background: var(--soft); overflow: hidden; }
  .sheet {
    width: 100%; max-width: none; height: 100%; min-height: 0;
    display: flex; flex-direction: column; box-shadow: none;
  }
  .chrome { flex: none; padding-right: 48px; }
  /* The watermark sat exactly where the modal puts its close button. */
  .chrome::after { content: none; }
  .body {
    flex: 1 1 auto; min-height: 0; overflow-y: auto; padding: 16px 20px 20px;
    scrollbar-width: thin; scrollbar-color: var(--line-2) transparent;
  }
  /* Lines up with the header's own 20px rather than sitting 4px inside it. */
  .eyebrow, .group-head, .group-note { margin-left: 0; margin-right: 0; }
  .foot { margin: 16px 0 4px; }

  /* Opened on its own in a wide browser window it goes back to a centred
     column, so the lines don't sprawl. */
  @media (min-width: 700px) { .sheet { max-width: 560px; } }
"""


def terms_block(glossary):
    out = ['<dl class="terms">']
    for g in glossary:
        sub = ""
        if g.get("subEntries"):
            sub = "<ul>" + "".join(f"<li><b>{e(s['label'])}</b>{e(s['desc'])}</li>" for s in g["subEntries"]) + "</ul>"
        out.append(f'<div class="term"><dt>{e(g["term"])}</dt><dd>{e(g["desc"])}{sub}</dd></div>')
    out.append("</dl>")
    return "\n      ".join(out)


def glossary_section(name):
    if name == "upc-list":
        parts = []
        for key in ["salesComp", "priceOpt", "trend", "association"]:
            m = INFO["upc-list"][key]
            parts.append(f'<h2 class="group-head">{e(m["title"])}</h2>')
            parts.append(f'<p class="group-note">{e(m["purpose"])}</p>')
            parts.append(terms_block(m["glossary"]))
        body = "\n      ".join(parts)
    else:
        info = INFO.get(name)
        if not info or not info.get("glossary"):
            return ""
        body = terms_block(info["glossary"])
    return f"""
    <section class="section" id="terms">
      <div class="eyebrow">What the terms mean</div>
      {body}
    </section>"""


def build(name, dev):
    head, style, h1, purpose, qas = parse(name)
    if dev:
        qas = apply(name, qas)
    info = INFO.get(name) if dev else None
    if dev and name == "user-management":
        purpose = USER_MGMT["purpose"]
    elif info and info.get("purpose"):
        purpose = info["purpose"]
    terms = glossary_section(name) if dev else ""
    jump = ""
    if terms:
        jump = ('\n    <nav class="jump" aria-label="On this page">'
                '<a href="#questions">Common questions</a><a href="#terms">What the terms mean</a></nav>')
    tag = '<span class="tag">Dev</span>' if dev else ""
    items = "\n".join(
        f"""    <details>
      <summary><span class="q">Q</span><span>{e(q)}</span></summary>
      <div class="a">{a}</div>
    </details>""" for q, a in qas)
    head = head.replace(f"<style>{style}</style>", f"<style>{style.rstrip()}\n{EXTRA_CSS}</style>")
    return f"""{head}</head>
<body>
<div class="sheet">
  <header class="chrome">
    <div class="stamp"><span class="dot"></span>Help{tag}</div>
    <h1>{e(h1)}</h1>
    <p class="purpose">{e(purpose)}</p>{jump}
  </header>
  <main class="body">
    <section class="section" id="questions">
    <div class="eyebrow">Common questions</div>
    <div class="list">
{items}
    </div>
    </section>{terms}
    <p class="foot"><span class="mark" aria-hidden="true">?</span><span>Still stuck? Contact your CounterCtrl representative.</span></p>
  </main>
</div>
<script>
  // Header pills scroll to their section in place, so they work the same
  // whether this page is opened on its own or shown inside the app's modal.
  document.querySelectorAll('.jump a[href^="#"]').forEach(function (a) {{
    a.addEventListener("click", function (ev) {{
      var target = document.getElementById(a.getAttribute("href").slice(1));
      if (!target) return;
      ev.preventDefault();
      var still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      target.scrollIntoView({{ behavior: still ? "auto" : "smooth", block: "start" }});
    }});
  }});
</script>
</body>
</html>
"""


# Pages whose source IS the finished page: copied through untouched, to dev
# only. A walk-through is not the Q&A shape `build` assembles, and a Coming
# Soon page has no prod help to serve - but its source belongs in source/ with
# the rest, or the next build writes every other page and drops this one.
VERBATIM_DEV_ONLY = {"sales-export"}

names = sorted(f[:-5] for f in os.listdir(SRC) if f.endswith(".html"))
built = [n for n in names if n not in VERBATIM_DEV_ONLY]
copied = [n for n in names if n in VERBATIM_DEV_ONLY]

for mode, folder in OUT.items():
    for n in built:
        out = build(n, dev=mode == "dev")
        open(os.path.join(folder, n + ".html"), "w", encoding="utf-8", newline="\n").write(out)
    if mode == "dev":
        for n in copied:
            src = open(os.path.join(SRC, n + ".html"), encoding="utf-8").read()
            open(os.path.join(folder, n + ".html"), "w", encoding="utf-8", newline="\n").write(src)
    count = len(built) + (len(copied) if mode == "dev" else 0)
    print(f"{mode:4} {count} files -> {folder}")
