"""
PDF Generator — Porta Nusa Hotel RFID Linen Visibility Platform
Technical Documentation & Operator Guide  — v1.1 (Correction Pass)
"""

import os
import hashlib
from datetime import datetime
from pathlib import Path

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable, Image as RLImage, KeepTogether
)
from reportlab.pdfgen import canvas as pdfgen_canvas
from PIL import Image as PILImage

# ─── Paths ───────────────────────────────────────────────────────────────────
BASE = Path(__file__).parent.parent.parent
SS   = BASE / "docs" / "screenshots"
OUTPUT = BASE / "output" / "pdf"
OUTPUT.mkdir(parents=True, exist_ok=True)

OUTPUT_PDF    = OUTPUT / "porta-nusa-rfid-documentation-package.pdf"
OUTPUT_RECORD = OUTPUT / "porta-nusa-rfid-documentation-source-record.md"

# ─── Brand Colours ────────────────────────────────────────────────────────────
NAVY      = colors.HexColor("#1a2f5a")
NAVY_SOFT = colors.HexColor("#2c4a7a")
TEAL      = colors.HexColor("#007a7a")
TEAL_DARK = colors.HexColor("#005a5a")
TEAL_SOFT = colors.HexColor("#e0f4f4")
GOLD_SOFT = colors.HexColor("#fffbe6")
GOLD      = colors.HexColor("#c8a800")
RED       = colors.HexColor("#c0392b")
RED_SOFT  = colors.HexColor("#fdecea")
BLUE_SOFT = colors.HexColor("#e8f0fe")
SURFACE   = colors.HexColor("#f8fafc")
LINE      = colors.HexColor("#dde3ec")
TEXT      = colors.HexColor("#1e2a3a")
MUTED     = colors.HexColor("#6b7a8d")
WHITE     = colors.white

PAGE_W, PAGE_H = A4
MARGIN_L  = 18 * mm
MARGIN_R  = 18 * mm
MARGIN_T  = 26 * mm
MARGIN_B  = 22 * mm
CW        = PAGE_W - MARGIN_L - MARGIN_R   # content width ≈ 159 mm

# ─── Screenshot registry ─────────────────────────────────────────────────────
# Verified caption = what the screenshot ACTUALLY shows (v1.1 correction pass)
SCREENSHOTS_USED = [
    ("web/web_00_landing_mode_selection.png",
     "Web Platform — Mode Selection Landing Page. The operator chooses Simulation or "
     "Hardware Mode before entering the platform.",
     "Mode Selection"),

    ("web/web_01_hw_dashboard.png",
     "Hardware Mode Dashboard — partial return state. Available: 1, In Laundry: 1, "
     "Outstanding: 1, Transactions: 2. Reflects the hardware database at time of capture.",
     "Hardware"),

    ("web/web_02_hw_linen_master.png",
     "Hardware Mode — Linen Master. Two registered linen items (IDs A and B), "
     "both showing Available status.",
     "Hardware"),

    ("web/web_03_hw_laundry_batches.png",
     "Hardware Mode — Laundry Batches. Batch LB-HW-2: Sent 2, Returned 1, "
     "Outstanding 1, Status: In Progress.",
     "Hardware"),

    ("web/web_04_hw_reconciliation.png",
     "Hardware Mode — Reconciliation after a partial return. Batch LB-HW-2 remains "
     "In Progress: 2 items sent, 1 returned, 1 outstanding.",
     "Hardware"),

    ("web/web_05_hw_transaction_history.png",
     "Hardware Mode — Device Activity. 7 reader sessions received; 11 unique tags. "
     "(File was labelled transaction_history at capture but contains the Device Activity page.)",
     "Hardware"),

    ("web/web_07_hw_rfid_scan.png",
     "Hardware Mode — RFID Hardware Activity (RFID Scan page). Last transaction: "
     "RETURN_FROM_LAUNDRY. Read-only view of uploaded C5 session data.",
     "Hardware"),

    ("web/web_08_sim_dashboard.png",
     "Simulation Mode Dashboard showing the Simulation Data Management section "
     "(Generate Demo Data, Clear Generated Data, Reset Database).",
     "Simulation"),

    ("web/web_09_sim_rfid_scan.png",
     "Simulation Mode — RFID Scan Page. Read-only view of the latest recorded session "
     "data. No live browser-side scanner is provided.",
     "Simulation"),

    ("android/c5_transaction_dropdown.png",
     "Chainway C5 — Workflow Selection Dropdown showing STOCK_COUNT, SEND_TO_LAUNDRY, "
     "and RETURN_FROM_LAUNDRY.",
     "Android"),

    ("android/c5_new_session.png",
     "Chainway C5 — New Session ready state. Ready to begin scanning.",
     "Android"),

    ("android/c5_stock_count_scanning.png",
     "Chainway C5 — Live STOCK_COUNT scan in progress. Reads: 77, Unique EPCs: 2.",
     "Android"),

    ("android/c5_stock_count_result.png",
     "Chainway C5 — STOCK_COUNT stopped. RETRY UPLOAD shown; operator can retry "
     "if the initial upload failed.",
     "Android"),

    ("android/c5_stock_count_accepted.png",
     "Chainway C5 — STOCK_COUNT result after upload. Accepted: 2; both EPCs show ACCEPTED.",
     "Android"),

    ("android/c5_return_from_laundry_accepted.png",
     "Chainway C5 — RETURN_FROM_LAUNDRY accepted result. Two EPCs were accepted; "
     "each EPC was read 14 times during the session.",
     "Android"),

    ("android/c5_settings.png",
     "Chainway C5 — Settings Panel. Server URL shown is a local demo environment "
     "address; it must be reconfigured per deployment. Power Profile: Near shown.",
     "Android"),
]

SCREENSHOTS_OMITTED = [
    ("android/c5_main_idle.png",
     "Redundant with c5_new_session.png"),
    ("web/web_06_hw_device_activity.png",
     "REJECTED — file contains a screenshot of an editor/terminal environment, "
     "not the web application UI"),
    ("web/web_10_guide_system_overview.png",
     "In-app guide; content reproduced in this PDF"),
    ("web/web_11_guide_simulation.png",
     "In-app guide; content reproduced in this PDF"),
    ("web/web_12_guide_hardware.png",
     "In-app guide; content reproduced in this PDF"),
    ("web/web_13_guide_operator_checklist.png",
     "In-app guide; checklist reproduced in this PDF"),
]

# ─── Styles ──────────────────────────────────────────────────────────────────
def build_styles():
    base = getSampleStyleSheet()
    def S(name, **kw):
        parent = kw.pop("parent", "Normal")
        return ParagraphStyle(name, parent=base[parent], **kw)

    return {
        "cover_hotel":   S("ch",  fontName="Helvetica",      fontSize=12, textColor=TEAL,      leading=16, alignment=TA_CENTER, spaceAfter=4),
        "cover_title":   S("ct",  fontName="Helvetica-Bold", fontSize=24, textColor=NAVY,      leading=30, alignment=TA_CENTER, spaceAfter=8),
        "cover_sub":     S("cs",  fontName="Helvetica",      fontSize=13, textColor=NAVY_SOFT, leading=18, alignment=TA_CENTER),
        "cover_meta":    S("cm",  fontName="Helvetica",      fontSize=9,  textColor=MUTED,     leading=13, alignment=TA_CENTER),
        "h1":            S("h1",  fontName="Helvetica-Bold", fontSize=15, textColor=NAVY,      leading=20, spaceBefore=30, spaceAfter=6),
        "h2":            S("h2",  fontName="Helvetica-Bold", fontSize=12, textColor=NAVY,      leading=16, spaceBefore=14, spaceAfter=5),
        "h3":            S("h3",  fontName="Helvetica-Bold", fontSize=10, textColor=NAVY_SOFT, leading=14, spaceBefore=7,  spaceAfter=4),
        "body":          S("bd",  fontName="Helvetica",      fontSize=9,  textColor=TEXT,      leading=13, spaceAfter=5, alignment=TA_JUSTIFY),
        "body_l":        S("bl",  fontName="Helvetica",      fontSize=9,  textColor=TEXT,      leading=13, spaceAfter=4, alignment=TA_LEFT),
        "caption":       S("cap", fontName="Helvetica-Oblique", fontSize=7.5, textColor=MUTED, leading=10, spaceAfter=6, alignment=TA_CENTER),
        "th":            S("th",  fontName="Helvetica-Bold", fontSize=8,  textColor=NAVY,      leading=11),
        "td":            S("td",  fontName="Helvetica",      fontSize=8,  textColor=TEXT,      leading=11),
        "td_sm":         S("tds", fontName="Helvetica",      fontSize=7.5,textColor=TEXT,      leading=10),
        "bullet":        S("bul", fontName="Helvetica",      fontSize=9,  textColor=TEXT,      leading=13, spaceAfter=3, leftIndent=10),
        "step":          S("stp", fontName="Helvetica",      fontSize=9,  textColor=TEXT,      leading=13, spaceAfter=4, leftIndent=18),
        "callout_i":     S("ci",  fontName="Helvetica",      fontSize=8.5,textColor=NAVY,      leading=12, spaceAfter=6),
        "callout_w":     S("cw",  fontName="Helvetica",      fontSize=8.5,textColor=colors.HexColor("#5a4000"), leading=12, spaceAfter=6),
        "callout_d":     S("cd",  fontName="Helvetica",      fontSize=8.5,textColor=RED,       leading=12, spaceAfter=6),
        "stop_title":    S("st",  fontName="Helvetica-Bold", fontSize=9,  textColor=RED,       leading=13, spaceAfter=3),
        "footer":        S("ft",  fontName="Helvetica",      fontSize=7,  textColor=MUTED,     leading=9,  alignment=TA_CENTER),
    }

ST = build_styles()

# ─── Image loader ─────────────────────────────────────────────────────────────
def load_img(rel_path, max_w_mm, max_h_mm):
    p = SS / rel_path
    if not p.exists():
        return None
    try:
        img = PILImage.open(p)
        w, h = img.size
        if w < 10 or h < 10:
            return None
        ratio = min((max_w_mm * mm) / w, (max_h_mm * mm) / h)
        return RLImage(str(p), width=w*ratio, height=h*ratio)
    except Exception as e:
        print(f"  WARNING: {rel_path}: {e}")
        return None

def ss_block(rel, caption, max_w=155, max_h=80):
    img = load_img(rel, max_w, max_h)
    if img is None:
        return [Paragraph(f"[Screenshot unavailable: {rel}]", ST["caption"])]
    t = Table([[img]], colWidths=[CW])
    t.setStyle(TableStyle([
        ("ALIGN",         (0,0),(-1,-1), "CENTER"),
        ("BACKGROUND",    (0,0),(-1,-1), SURFACE),
        ("BOX",           (0,0),(-1,-1), 0.5, LINE),
        ("TOPPADDING",    (0,0),(-1,-1), 3),
        ("BOTTOMPADDING", (0,0),(-1,-1), 3),
    ]))
    return [t, Paragraph(caption, ST["caption"])]

def two_android(path_a, cap_a, path_b, cap_b):
    ia = load_img(path_a, 71, 108)
    ib = load_img(path_b, 71, 108)
    ca = ia if ia else Paragraph(f"[{path_a}]", ST["caption"])
    cb = ib if ib else Paragraph(f"[{path_b}]", ST["caption"])
    cw = (CW - 4) / 2
    t = Table([[ca, cb],
               [Paragraph(cap_a, ST["caption"]), Paragraph(cap_b, ST["caption"])]],
              colWidths=[cw, cw], spaceBefore=2, spaceAfter=6)
    t.setStyle(TableStyle([
        ("ALIGN",  (0,0),(-1,0), "CENTER"),
        ("VALIGN", (0,0),(-1,0), "MIDDLE"),
        ("BACKGROUND",(0,0),(0,0), SURFACE), ("BOX",(0,0),(0,0), 0.5, LINE),
        ("BACKGROUND",(1,0),(1,0), SURFACE), ("BOX",(1,0),(1,0), 0.5, LINE),
        ("TOPPADDING",(0,0),(-1,0), 3), ("BOTTOMPADDING",(0,0),(-1,0), 3),
        ("LEFTPADDING",(1,0),(1,-1), 4),
        ("ALIGN",(0,1),(-1,1),"CENTER"),
    ]))
    return [t]

# ─── Table builder ────────────────────────────────────────────────────────────
def dtable(headers, rows, cw=None, sm=False):
    sth  = ST["th"]
    sttd = ST["td_sm"] if sm else ST["td"]
    data = [[Paragraph(h, sth) for h in headers]]
    for r in rows:
        data.append([Paragraph(str(c), sttd) for c in r])
    if cw is None:
        n = len(headers)
        cw = [CW / n] * n
    t = Table(data, colWidths=cw, repeatRows=1, spaceBefore=3, spaceAfter=6)
    t.setStyle(TableStyle([
        ("BACKGROUND",   (0,0),(-1,0), NAVY),
        ("TEXTCOLOR",    (0,0),(-1,0), WHITE),
        ("FONTNAME",     (0,0),(-1,0), "Helvetica-Bold"),
        ("FONTSIZE",     (0,0),(-1,0), 8),
        ("ROWBACKGROUNDS",(0,1),(-1,-1), [WHITE, SURFACE]),
        ("GRID",         (0,0),(-1,-1), 0.4, LINE),
        ("VALIGN",       (0,0),(-1,-1), "TOP"),
        ("TOPPADDING",   (0,0),(-1,-1), 4),
        ("BOTTOMPADDING",(0,0),(-1,-1), 4),
        ("LEFTPADDING",  (0,0),(-1,-1), 6),
        ("RIGHTPADDING", (0,0),(-1,-1), 6),
    ]))
    return t

def callout(text, kind="info"):
    bg  = {"info": BLUE_SOFT, "warn": GOLD_SOFT, "danger": RED_SOFT, "tip": TEAL_SOFT}
    bdr = {"info": colors.HexColor("#b3cef5"), "warn": colors.HexColor("#e0c840"),
           "danger": colors.HexColor("#f5a0a0"), "tip": TEAL}
    sty = {"info": ST["callout_i"], "warn": ST["callout_w"],
           "danger": ST["callout_d"], "tip": ST["callout_i"]}
    p = Paragraph(text, sty.get(kind, ST["callout_i"]))
    t = Table([[p]], colWidths=[CW - 2])
    t.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,-1), bg.get(kind, BLUE_SOFT)),
        ("BOX",       (0,0),(-1,-1), 0.8, bdr.get(kind, colors.HexColor("#b3cef5"))),
        ("LEFTPADDING",(0,0),(-1,-1), 9),
        ("RIGHTPADDING",(0,0),(-1,-1), 9),
        ("TOPPADDING",  (0,0),(-1,-1), 6),
        ("BOTTOMPADDING",(0,0),(-1,-1), 6),
    ]))
    return [t, Spacer(1, 4)]

def h1(text):
    return [Spacer(1, 20),
            Paragraph(text, ST["h1"]),
            HRFlowable(width=CW, thickness=1.5, color=TEAL, spaceAfter=5)]
def h2(text): return [Paragraph(text, ST["h2"])]
def h3(text): return [Paragraph(text, ST["h3"])]
def body(text): return [Paragraph(text, ST["body"])]
def body_l(text): return [Paragraph(text, ST["body_l"])]
def sp(n=4): return Spacer(1, n)
def blt(text): return Paragraph(f"•  {text}", ST["bullet"])
def step(n, text): return Paragraph(f"<b>{n}.</b>  {text}", ST["step"])
def chk(text): return Paragraph(f"□  {text}", ST["bullet"])
def hr(): return HRFlowable(width=CW, thickness=0.4, color=LINE, spaceBefore=3, spaceAfter=3)

# ─── Page canvas (header / footer) ───────────────────────────────────────────
class HFCanvas(pdfgen_canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved = []

    def showPage(self):
        self._saved.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        total = len(self._saved)
        for i, state in enumerate(self._saved):
            self.__dict__.update(state)
            self._draw_hf(i + 1, total)
            super().showPage()
        super().save()

    def _draw_hf(self, pg, total):
        if pg == 1:
            return
        self.saveState()
        # header rule
        self.setFillColor(NAVY)
        self.rect(MARGIN_L, PAGE_H - 17*mm, CW, 0.4*mm, fill=1, stroke=0)
        self.setFont("Helvetica-Bold", 7)
        self.setFillColor(NAVY)
        self.drawString(MARGIN_L, PAGE_H - 13*mm,
                        "Porta Nusa Hotel  |  RFID Linen Visibility Platform")
        self.setFont("Helvetica", 7)
        self.setFillColor(MUTED)
        self.drawRightString(PAGE_W - MARGIN_R, PAGE_H - 13*mm,
                             "Technical Documentation & Operator Guide")
        # footer
        self.setFillColor(LINE)
        self.rect(MARGIN_L, MARGIN_B - 4*mm, CW, 0.3*mm, fill=1, stroke=0)
        self.setFont("Helvetica", 7)
        self.setFillColor(MUTED)
        self.drawString(MARGIN_L,       MARGIN_B - 9*mm, "Confidential — Partner Review Copy")
        self.drawCentredString(PAGE_W/2, MARGIN_B - 9*mm, f"Page {pg} of {total}")
        self.drawRightString(PAGE_W - MARGIN_R, MARGIN_B - 9*mm, "Version 1.1  |  28 June 2026")
        self.restoreState()


# ─── Cover ────────────────────────────────────────────────────────────────────
def cover():
    s = []
    s.append(Spacer(1, 36*mm))
    bar = Table([[""]], colWidths=[CW], rowHeights=[4])
    bar.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),TEAL)]))
    s.append(bar)
    s.append(Spacer(1, 12*mm))
    s.append(Paragraph("PORTA NUSA HOTEL", ST["cover_hotel"]))
    s.append(Spacer(1, 4))
    s.append(Paragraph("RFID Linen Visibility Platform", ST["cover_title"]))
    s.append(Spacer(1, 3))
    s.append(Paragraph("Technical Documentation &amp; Operator Guide", ST["cover_sub"]))
    s.append(Spacer(1, 8*mm))
    # short teal rule
    div = Table([[""]], colWidths=[70*mm], rowHeights=[1.5])
    div.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),TEAL)]))
    ctr = Table([[div]], colWidths=[CW])
    ctr.setStyle(TableStyle([("ALIGN",(0,0),(-1,-1),"CENTER")]))
    s.append(ctr)
    s.append(Spacer(1, 8*mm))
    # Correction 5: cover exposes only Version, Date, Classification — no commit/branch
    meta = [
        ["Document Version", "1.1"],
        ["Date",             "28 June 2026"],
        ["Classification",   "Partner Review — Confidential"],
    ]
    mt = Table(meta, colWidths=[52*mm, 90*mm])
    mt.setStyle(TableStyle([
        ("FONTNAME",  (0,0),(0,-1), "Helvetica-Bold"),
        ("FONTNAME",  (1,0),(1,-1), "Helvetica"),
        ("FONTSIZE",  (0,0),(-1,-1), 9),
        ("TEXTCOLOR", (0,0),(0,-1), NAVY),
        ("TEXTCOLOR", (1,0),(1,-1), TEXT),
        ("ROWBACKGROUNDS",(0,0),(-1,-1), [SURFACE, WHITE]),
        ("GRID",      (0,0),(-1,-1), 0.3, LINE),
        ("TOPPADDING",(0,0),(-1,-1), 5),
        ("BOTTOMPADDING",(0,0),(-1,-1), 5),
        ("LEFTPADDING",(0,0),(-1,-1), 7),
    ]))
    ctr2 = Table([[mt]], colWidths=[CW])
    ctr2.setStyle(TableStyle([("ALIGN",(0,0),(-1,-1),"CENTER")]))
    s.append(ctr2)
    s.append(Spacer(1, 14*mm))
    bar2 = Table([[""]], colWidths=[CW], rowHeights=[3])
    bar2.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),NAVY)]))
    s.append(bar2)
    s.append(PageBreak())
    return s


# ─── Section 1: Executive Summary ────────────────────────────────────────────
def sec_exec():
    s = []
    s += h1("1. Executive Summary")
    s += body(
        "Hotel linen management presents a persistent operational challenge: without item-level "
        "visibility, hotels cannot reliably track which linens have been dispatched to the laundry, "
        "which have returned, and which remain outstanding. Manual counting is error-prone, "
        "time-consuming, and provides no audit trail for reconciliation disputes."
    )
    s += body(
        "The Porta Nusa Hotel RFID Linen Visibility Platform addresses this by attaching UHF RFID "
        "tags to individual linen items and reading them with a Chainway C5 E710 handheld scanner. "
        "Each scan session is uploaded in real time to a browser-based management interface, giving "
        "operators instant inventory counts, laundry batch tracking, and a complete transaction "
        "audit trail."
    )
    s += h2("Dual-Mode Architecture")
    # two-column mode cards
    sim = Table([[Paragraph("<b>Simulation Mode</b>", ST["h3"]),
                  Paragraph("Browser-only operation — no physical hardware required. "
                             "Synthetic linen data is generated, cleared, and reset from the "
                             "Dashboard's Simulation Data Management section. All data is stored "
                             "in an isolated simulation database.", ST["body"])]],
                colWidths=[CW/2 - 3])
    sim.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),TEAL_SOFT),
                              ("BOX",(0,0),(-1,-1),1.5,TEAL),
                              ("TOPPADDING",(0,0),(-1,-1),8),("BOTTOMPADDING",(0,0),(-1,-1),8),
                              ("LEFTPADDING",(0,0),(-1,-1),8),("RIGHTPADDING",(0,0),(-1,-1),8),
                              ("SPAN",(0,0),(-1,0))]))
    hw  = Table([[Paragraph("<b>Hardware Mode</b>", ST["h3"]),
                  Paragraph("Physical RFID operations. The Chainway C5 uploads scan sessions "
                             "to the Web API over a local network. The browser monitors results, "
                             "manages EPC registration, and tracks the complete linen lifecycle. "
                             "All data is stored in an isolated hardware database.", ST["body"])]],
                colWidths=[CW/2 - 3])
    hw.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),BLUE_SOFT),
                             ("BOX",(0,0),(-1,-1),1.5,NAVY),
                             ("TOPPADDING",(0,0),(-1,-1),8),("BOTTOMPADDING",(0,0),(-1,-1),8),
                             ("LEFTPADDING",(0,0),(-1,-1),8),("RIGHTPADDING",(0,0),(-1,-1),8),
                             ("SPAN",(0,0),(-1,0))]))
    mode_t = Table([[sim, hw]], colWidths=[CW/2, CW/2], spaceBefore=4, spaceAfter=8)
    mode_t.setStyle(TableStyle([("VALIGN",(0,0),(-1,-1),"TOP"),("LEFTPADDING",(1,0),(1,0),5)]))
    s.append(mode_t)
    s += body(
        "The two modes are completely isolated at the database level. Simulation data never appears "
        "in Hardware Mode, and hardware scan data never appears in Simulation Mode. Reconciliation "
        "is computed automatically from live send and return counts — no manual tallying required. "
        "Every RFID session is permanently logged for audit purposes."
    )
    return s


# ─── Section 2: Architecture ──────────────────────────────────────────────────
def sec_arch():
    s = []
    s += h1("2. Solution Architecture")
    s += body(
        "The platform integrates four layers: UHF RFID tags on linen items, the Chainway C5 E710 "
        "Android handheld, a Next.js 14 web application with REST API, and two isolated SQLite "
        "databases managed by Prisma ORM."
    )
    # Component diagram
    comps = [
        ("RFID Tags", "UHF tags sewn into each linen item. Each tag carries a unique EPC.", TEAL_SOFT, TEAL),
        ("Chainway C5 E710", "Android handheld reader. Triggers physical RFID scans and uploads sessions to the Web API.", BLUE_SOFT, NAVY_SOFT),
        ("Next.js 14 Web App", "Serves the management UI and all API routes. Validates sessions and applies business rules.", colors.HexColor("#e8f4e8"), colors.HexColor("#4a9a4a")),
        ("SQLite Databases", "Two isolated files: simulation database and hardware database. No shared state.", GOLD_SOFT, GOLD),
    ]
    cw4 = (CW - 9) / 4
    diag_row = []
    for name, desc, bg, bdr in comps:
        cell = Table([[Paragraph(f"<b>{name}</b>", ST["td"]),
                       Paragraph(desc, ST["td_sm"])]],
                     colWidths=[cw4])
        cell.setStyle(TableStyle([
            ("BACKGROUND",(0,0),(-1,-1),bg),("BOX",(0,0),(-1,-1),1,bdr),
            ("TOPPADDING",(0,0),(-1,-1),8),("BOTTOMPADDING",(0,0),(-1,-1),8),
            ("LEFTPADDING",(0,0),(-1,-1),6),("RIGHTPADDING",(0,0),(-1,-1),6),
            ("SPAN",(0,0),(-1,0)),("ALIGN",(0,0),(-1,-1),"LEFT"),
        ]))
        diag_row.append(cell)
    diag = Table([diag_row], colWidths=[cw4]*4, spaceBefore=4, spaceAfter=2)
    diag.setStyle(TableStyle([("VALIGN",(0,0),(-1,-1),"TOP"),
                               ("LEFTPADDING",(1,0),(3,0),3)]))
    s.append(diag)
    s.append(Paragraph("<i>Data flows left to right: tags → C5 → API → database.</i>", ST["caption"]))

    s += h2("Data Flow")
    # Correction 6: no web/prisma/ paths — use plain database names
    s.append(dtable(
        ["Client", "Header Injected", "Target Database"],
        [["Browser (Simulation Mode)", "X-Demo-Mode: SIMULATION", "Simulation database"],
         ["Browser (Hardware Mode)",   "X-Demo-Mode: HARDWARE",   "Hardware database"],
         ["Chainway C5 Android App",   "X-Demo-Mode: HARDWARE (always)", "Hardware database"]],
        cw=[55*mm, 62*mm, 42*mm]
    ))
    s += h2("Key Technologies")
    s.append(dtable(
        ["Component", "Technology", "Role"],
        [["Web Application", "Next.js 14 (App Router)", "UI and API route handlers"],
         ["ORM",             "Prisma",                  "Type-safe database access; two datasource instances"],
         ["Databases",       "SQLite (two isolated files)", "Simulation database and hardware database; no shared state"],
         ["Android App",     "Kotlin / Android SDK",    "Scan sessions and RFID trigger handling"],
         ["RFID Module",     "RFIDWithUHFUART SDK",     "UHF antenna control; EPC and RSSI capture"],
         ["Language",        "TypeScript",              "Strict typing across the web codebase"]],
        cw=[35*mm, 48*mm, 76*mm]
    ))
    return s


# ─── Section 3: Operating Modes ──────────────────────────────────────────────
def sec_modes():
    s = []
    s += h1("3. Operating Modes and Database Isolation")
    s += body(
        "The browser operator selects the active mode using the sidebar toggle. All subsequent "
        "reads and writes target the selected mode's database exclusively. There is no data "
        "transfer between modes."
    )
    # Database isolation table — Correction 6: use plain names, not file paths
    s.append(dtable(
        ["Property", "Simulation database", "Hardware database"],
        [["Populated by",   "Dashboard data-management actions", "Chainway C5 Android uploads only"],
         ["Linen item cap", "100 (enforced)",                    "100 (enforced)"],
         ["Reset method",   "Dashboard Simulation Data Management", "CLI scripts — no browser reset in MVP"],
         ["Shared state",   "None",                              "None"]],
        cw=[40*mm, 58*mm, 61*mm]
    ))
    s += callout(
        "<b>Mode Header:</b> Browser mode is propagated via middleware that reads a cookie and "
        "attaches the X-Demo-Mode header to every server request. The Chainway C5 always sends "
        "X-Demo-Mode: HARDWARE regardless of browser state.",
        "info"
    )
    s += h2("Mode Selection")
    s += ss_block("web/web_00_landing_mode_selection.png",
                  "Mode Selection Landing Page — the operator chooses Simulation or Hardware Mode "
                  "before entering the platform.", max_w=155, max_h=75)
    return s


# ─── Section 4: End-to-End Hardware Workflow ─────────────────────────────────
def sec_workflow():
    s = []
    s += h1("4. End-to-End Hardware Workflow")
    s += body(
        "The following sequence describes the complete physical linen lifecycle as executed using "
        "the Chainway C5 and the Hardware Mode web interface."
    )
    rows = [
        ["1", "Register Physical EPC",
         "Trigger a STOCK_COUNT scan with an unregistered tag in range. The API stores the EPC as "
         "UNKNOWN_EPC. The Linen Master page polls for unknown EPCs every ~2.5 seconds and "
         "displays them in a registration queue. The operator assigns a Linen Code and Type."],
        ["2", "STOCK_COUNT",
         "Scan registered linen items in a location. Recognised EPCs return ACCEPTED; "
         "unregistered EPCs return UNKNOWN_EPC. RSSI and read count are captured per tag."],
        ["3", "SEND_TO_LAUNDRY",
         "Operator enters a batch code on the C5 and scans dispatch items. The API finds or "
         "creates the batch using the exact submitted code. The Laundry Batches page shows "
         "the batch as In Progress."],
        ["4", "Partial RETURN_FROM_LAUNDRY",
         "Operator returns a subset of items. Outstanding = Sent − Returned. The Reconciliation "
         "page lists the batch with specific outstanding EPCs highlighted."],
        ["5", "Reconciliation Review",
         "Reconciliation shows all batches with outstanding > 0. The operator can identify which "
         "EPCs have not yet been returned before proceeding."],
        ["6", "Final Return",
         "Remaining outstanding items are scanned and returned. Outstanding drops to 0."],
        ["7", "Completed Batch",
         "When outstanding = 0 and acceptedSent > 0, batch status becomes Completed. Completed "
         "batches are retained in Laundry Batches but disappear from Reconciliation."],
        ["8", "Empty Reconciliation",
         "With no outstanding items across any batch, the Reconciliation page shows an empty "
         "state and the Dashboard Outstanding metric shows 0."],
    ]
    t = Table(
        [[Paragraph("<b>#</b>", ST["th"]), Paragraph("<b>Step</b>", ST["th"]),
          Paragraph("<b>Description</b>", ST["th"])]] +
        [[Paragraph(r[0], ST["td"]), Paragraph(r[1], ST["td"]), Paragraph(r[2], ST["td"])]
         for r in rows],
        colWidths=[8*mm, 42*mm, 109*mm], repeatRows=1, spaceBefore=4, spaceAfter=8,
    )
    t.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,0), NAVY), ("TEXTCOLOR",(0,0),(-1,0), WHITE),
        ("FONTNAME",(0,0),(-1,0),"Helvetica-Bold"), ("FONTSIZE",(0,0),(-1,-1),8),
        ("ROWBACKGROUNDS",(0,1),(-1,-1),[WHITE, SURFACE]),
        ("GRID",(0,0),(-1,-1),0.4,LINE), ("VALIGN",(0,0),(-1,-1),"TOP"),
        ("TOPPADDING",(0,0),(-1,-1),4), ("BOTTOMPADDING",(0,0),(-1,-1),4),
        ("LEFTPADDING",(0,0),(-1,-1),5), ("RIGHTPADDING",(0,0),(-1,-1),5),
    ]))
    s.append(t)
    s += callout(
        "<b>Idempotency:</b> All write operations are idempotent by session ID. If the C5 retries "
        "an upload due to a network interruption, the server returns a success response without "
        "creating duplicate records. Transaction History shows each session only once.",
        "info"
    )
    return s


# ─── Section 5: Dashboard, Linen Master, Laundry, Reconciliation ─────────────
def sec_web_screens():
    s = []
    s += h1("5. Web Platform — Key Screens")

    s += h2("Hardware Mode Dashboard")
    s += body(
        "The Dashboard aggregates live counts from the active mode database. The screenshot below "
        "shows the hardware database state during a partial return: one item is available, one "
        "remains in laundry, and one is outstanding."
    )
    # Correction 2: corrected caption to match actual screenshot (Available 1, In Laundry 1, Outstanding 1)
    s += ss_block("web/web_01_hw_dashboard.png",
                  "Hardware Mode Dashboard — partial return state. Available: 1, In Laundry: 1, "
                  "Outstanding: 1, Transactions: 2. Latest transaction: RETURN_FROM_LAUNDRY.",
                  max_w=155, max_h=75)
    s.append(dtable(
        ["Metric", "Description"],
        [["Available",    "Items currently in stock and not in laundry"],
         ["In Laundry",   "Items currently dispatched to laundry (outstanding > 0)"],
         ["Outstanding",  "Total items sent to laundry but not yet returned"],
         ["Transactions", "Total RFID sessions recorded in the active database"]],
        cw=[38*mm, 121*mm]
    ))

    s += h2("Linen Master")
    s += body(
        "The Linen Master lists all registered linen items. In Hardware Mode, it also shows an "
        "auto-updating registration queue for unknown EPCs discovered by the C5 (polling every ~2.5 s)."
    )
    # Correction 3: corrected count from "three" to "two"
    s += ss_block("web/web_02_hw_linen_master.png",
                  "Hardware Mode — Linen Master. Two registered linen items (IDs A and B), "
                  "both showing Available status.",
                  max_w=155, max_h=72)

    s += h2("Laundry Batches")
    s += body(
        "Laundry Batches lists all batches created through SEND_TO_LAUNDRY sessions. "
        "Outstanding is computed live from accepted sent minus accepted returned — never stored."
    )
    s += ss_block("web/web_03_hw_laundry_batches.png",
                  "Hardware Mode — Laundry Batches. Batch LB-HW-2: Sent 2, Returned 1, "
                  "Outstanding 1, Status: In Progress.",
                  max_w=155, max_h=68)

    s += h2("Reconciliation")
    s += body(
        "Reconciliation shows only batches with outstanding > 0. When a batch is fully returned "
        "its card disappears automatically. The screenshot below shows the In Progress state "
        "after a partial return — one item remains outstanding."
    )
    # Correction 1: corrected caption — NOT empty, NOT completed; shows partial return
    s += ss_block("web/web_04_hw_reconciliation.png",
                  "Hardware Mode — Reconciliation after a partial return. Batch LB-HW-2 remains "
                  "In Progress: 2 items sent, 1 returned, 1 outstanding.",
                  max_w=155, max_h=75)

    s += h2("Device Activity and RFID Hardware Activity")
    s += body(
        "Device Activity logs every reader session received from the C5. The RFID Scan page "
        "in Hardware Mode shows the latest recorded session data including per-EPC validation "
        "status — it is a read-only view, not a browser-side scanner."
    )
    s += two_android(
        "web/web_05_hw_transaction_history.png",
        "Device Activity — 7 reader sessions, 11 unique tags.",
        "web/web_07_hw_rfid_scan.png",
        "RFID Hardware Activity — last transaction: RETURN_FROM_LAUNDRY.",
    )
    return s


# ─── Section 6: Chainway C5 Operation ────────────────────────────────────────
def sec_c5():
    s = []
    s += h1("6. Chainway C5 Operation")
    s += body(
        "The Chainway C5 E710 runs the Porta Nusa Operator Android app, which handles workflow "
        "selection, physical RFID scanning, and session upload to the web API."
    )

    s += h2("Workflow Selection and Scanning")
    s += two_android(
        "android/c5_transaction_dropdown.png",
        "Workflow dropdown — STOCK_COUNT, SEND_TO_LAUNDRY, RETURN_FROM_LAUNDRY.",
        "android/c5_new_session.png",
        "New session ready. Operator enters batch code before scanning.",
    )
    s += body(
        "The operator triggers a scan using the physical side key or the on-screen START SCAN "
        "button. The antenna reads all UHF RFID tags within the active power profile range. "
        "RSSI and read count are captured per tag. Duplicate EPC reads within a single session "
        "are deduplicated — each unique EPC is submitted once per session."
    )
    s += h2("Live Scan and Retry")
    s += two_android(
        "android/c5_stock_count_scanning.png",
        "Live STOCK_COUNT scan. Reads: 77, Unique EPCs: 2.",
        "android/c5_stock_count_result.png",
        "Scan stopped — RETRY UPLOAD shown if initial upload failed.",
    )

    s += h2("Session Results")
    s.append(dtable(
        ["Result Code", "Meaning", "Operator Action"],
        [["ACCEPTED",         "EPC recognised; batch matched; not previously processed.", "No action needed."],
         ["WRONG_BATCH",      "EPC belongs to a different batch than submitted.", "Confirm correct batch code and retry."],
         ["ALREADY_RETURNED", "EPC was already returned in a prior session.", "No action — item already reconciled."],
         ["UNKNOWN_EPC",      "EPC not registered in the hardware database.", "Register via Linen Master before including in a workflow."]],
        cw=[35*mm, 65*mm, 59*mm]
    ))
    # Correction 4: corrected Android return caption — 2 EPCs accepted, each read x14
    s += two_android(
        "android/c5_stock_count_accepted.png",
        "STOCK_COUNT result — Accepted: 2; both EPCs show ACCEPTED.",
        "android/c5_return_from_laundry_accepted.png",
        "RETURN_FROM_LAUNDRY accepted result. Two EPCs were accepted; each EPC was read "
        "14 times during the session.",
    )

    s += h2("C5 Settings")
    s += body(
        "The Settings panel allows the operator to configure the server address, reader ID, "
        "batch code, and power profile. Settings persist across app restarts via SharedPreferences "
        "when the operator taps SAVE CONFIGURATION."
    )
    # C5 settings screenshot — showing local IP, captioned as demo environment
    s += ss_block("android/c5_settings.png",
                  "Chainway C5 Settings. The Server URL shown (http://10.10.101.45:3000) is a "
                  "local demo environment address and must be reconfigured per deployment. "
                  "Power Profile: Near shown.",
                  max_w=80, max_h=120)
    return s


# ─── Section 7: RFID Power Profiles ──────────────────────────────────────────
def sec_power():
    s = []
    s += h1("7. RFID Power Profiles")
    s += body(
        "The operator selects a power profile before each scan. The profile controls the power "
        "level applied to the UHF antenna, affecting how far the antenna can reliably read tags. "
        "Higher power gives wider coverage; lower power gives more precise, short-range reads."
    )
    # Correction 7: "Power (dBm)" → "Configured Power Level"
    s.append(dtable(
        ["Profile", "Configured Power Level", "Typical Use Case"],
        [["Near",             "5",  "Single-item precision scanning. Minimises accidental reads from adjacent items."],
         ["Medium (default)", "18", "Standard room-level scanning. Balanced range and accuracy. Recommended for most operations."],
         ["Far",              "30", "Wide-area coverage. Suitable for warehouse environments or bulk linen carts."]],
        cw=[28*mm, 38*mm, 93*mm]
    ))
    s += callout(
        "<b>Implementation:</b> The power value is passed directly to setPower() before every "
        "startInventoryTag() call. If setPower() fails or returns false, the scan is aborted and "
        "the operator sees 'Status: FAILED TO SET POWER'. This prevents silent reads at an "
        "unintended power level.",
        "info"
    )
    s += callout(
        "<b>Persistence:</b> The profile is saved only when the operator taps SAVE CONFIGURATION "
        "in the Android Settings panel. Changing the spinner without saving does not persist. "
        "Effective read distances depend on tag orientation, antenna position, and environmental "
        "conditions; the power values are configured levels, not guaranteed distances.",
        "warn"
    )
    return s


# ─── Section 8: Simulation Mode User Guide ────────────────────────────────────
def sec_sim_guide():
    s = []
    s += h1("8. Simulation Mode User Guide")
    s += body("Complete all steps using the browser only — no physical hardware required.")

    s += h2("Entering Simulation Mode")
    for n, t in [(1, "Open the platform in the browser."),
                 (2, "If the sidebar shows <b>Hardware Mode</b>, click <b>Switch Demo Mode</b>."),
                 (3, "Sidebar now shows <b>Simulation Mode</b>. All pages read from and write to the simulation database.")]:
        s.append(step(n, t))
    s.append(sp(3))

    s += h2("Simulation Data Management")
    s += body(
        "The Dashboard contains the canonical <b>Simulation Data Management</b> section "
        "for all synthetic data operations."
    )
    s += ss_block("web/web_08_sim_dashboard.png",
                  "Simulation Mode Dashboard — Generate Demo Data, Clear Generated Data, "
                  "and Reset Database actions visible.",
                  max_w=155, max_h=75)
    s.append(dtable(
        ["Action", "Effect"],
        [["Generate Demo Data",
          "Creates synthetic linen items, batches, and transactions. Safe to run multiple times — capped at 100 items."],
         ["Clear Generated Data",
          "Removes all synthetic records, returning the simulation database to an empty state."],
         ["Reset Database",
          "Full wipe — restores only the base location records. Use for a guaranteed clean slate."]],
        cw=[44*mm, 115*mm]
    ))
    s += callout(
        "<b>Pre-demo recommendation:</b> Start on the Dashboard. Run Clear Generated Data, "
        "then Generate Demo Data. Use Reset Database only for a full wipe to base locations.",
        "warn"
    )

    s += h2("RFID Scan Page — Read-Only in Simulation Mode")
    s += body(
        "The RFID Scan page in Simulation Mode is a read-only visibility page. It summarises "
        "the most recent recorded session data. It does not provide a live browser-side RFID "
        "scanner or transaction submission control."
    )
    s += ss_block("web/web_09_sim_rfid_scan.png",
                  "Simulation Mode — RFID Scan Page. Read-only view of recorded session data. "
                  "No live browser scan controls are provided.",
                  max_w=155, max_h=72)
    s += callout(
        "<b>Operator note:</b> Do not present this page as a live browser RFID emulator. "
        "Browser operators manage seeded data from the Dashboard and review recorded outcomes here.",
        "tip"
    )

    s += h2("Recommended Simulation Demo Sequence")
    for n, t in [
        (1, "<b>Confirm mode:</b> Sidebar shows Simulation Mode."),
        (2, "<b>Reset data:</b> Dashboard → Clear Generated Data → Generate Demo Data."),
        (3, "<b>Dashboard:</b> Walk through metrics and the Simulation Data Management section."),
        (4, "<b>Linen Master:</b> Show seeded linen inventory."),
        (5, "<b>Laundry Batches and Reconciliation:</b> Explain the seeded batch state."),
        (6, "<b>Transaction History:</b> Show the recorded audit trail."),
        (7, "<b>RFID Scan:</b> Present as read-only evidence — not a live scanner."),
        (8, "<b>Close on Dashboard:</b> Restate Simulation vs Hardware database isolation."),
    ]:
        s.append(step(n, t))
    s.append(sp(4))
    return s


# ─── Section 9: Hardware Mode User Guide ──────────────────────────────────────
def sec_hw_guide():
    s = []
    s += h1("9. Hardware Mode User Guide")
    s += body(
        "Hardware Mode connects the Chainway C5 E710 to the web platform over a local network. "
        "Physical RFID scan sessions are uploaded by the Android app and processed by the Web API."
    )

    s += h2("Pre-Requisites")
    # Correction 6: "npm run dev in web/" → "Start the application service"
    s.append(dtable(
        ["Check", "Pass Condition", "Fail Action"],
        [["Application service running", "Browser opens the platform dashboard", "Start the application service"],
         ["C5 on same network",          "Wi-Fi icon visible on C5 status bar",  "Connect C5 to the same network as the server"],
         ["Server address correct in app","C5 Settings shows correct address",    "Update Server URL in C5 Settings → SAVE CONFIGURATION"],
         ["Browser in Hardware Mode",    "Sidebar shows Hardware Mode",           "Click Switch Demo Mode in the sidebar"]],
        cw=[46*mm, 52*mm, 61*mm]
    ))
    s += callout(
        "<b>Stale APK warning:</b> Always ensure the installed APK was built from the current "
        "source. A stale APK may upload to an incorrect server or use an outdated session format.",
        "danger"
    )

    s += h2("Workflow Steps")
    for n, t in [
        (1,  "<b>Confirm the application service is running</b> and the browser dashboard loads."),
        (2,  "<b>Verify C5 network connectivity:</b> Confirm Wi-Fi is connected and the server address in C5 Settings is correct."),
        (3,  "<b>Configure reader:</b> Select desired Power Profile (recommend Medium). Tap SAVE CONFIGURATION."),
        (4,  "<b>Scan unknown EPC (new tags only):</b> Trigger STOCK_COUNT. Unknown EPC appears in the Linen Master queue within ~2.5 seconds."),
        (5,  "<b>Register linen:</b> In Linen Master, assign a Linen ID and type. Click Register. The tag is now recognised."),
        (6,  "<b>Run STOCK_COUNT:</b> Scan registered items. Confirm ACCEPTED results in Device Activity."),
        (7,  "<b>Run SEND_TO_LAUNDRY:</b> Enter a batch code, scan dispatch items. Confirm batch is In Progress in Laundry Batches."),
        (8,  "<b>Perform partial return:</b> Return a subset of items. Confirm Outstanding decreases in Reconciliation."),
        (9,  "<b>Inspect Reconciliation:</b> Outstanding items visible by EPC. Batch remains In Progress."),
        (10, "<b>Perform final return:</b> Return remaining items. Outstanding drops to 0."),
        (11, "<b>Confirm completed state:</b> Laundry Batches shows Completed. Reconciliation shows empty state."),
    ]:
        s.append(step(n, t))
    s.append(sp(4))
    return s


# ─── Section 10: Demo Operator Checklist ──────────────────────────────────────
def sec_checklist():
    s = []
    s += h1("10. Demo Operator Checklist")
    s += body("Complete all items before and during a live demonstration.")

    s += h2("Pre-Demo Checks")
    s += h3("Service and Network")
    for item in [
        "Application service is running and the browser dashboard loads.",
        "Network is available and stable on the demo machine.",
        "Browser is confirmed in the correct starting mode (Simulation or Hardware).",
    ]:
        s.append(chk(item))
    s.append(sp(3))

    s += h3("Simulation Mode Data")
    for item in [
        "Sidebar shows Simulation Mode.",
        "Dashboard — Simulation Data Management section is visible.",
        "Clear Generated Data then Generate Demo Data — Dashboard shows non-zero item count.",
        "Laundry Batches and Reconciliation reflect the seeded state.",
    ]:
        s.append(chk(item))
    s.append(sp(3))

    s += h3("Hardware Mode (if using C5)")
    for item in [
        "Chainway C5 is powered on and the Porta Nusa Operator app is open.",
        "C5 Settings: server address points to the correct server.",
        "C5 Settings: Power Profile is set to the intended profile (recommend: Medium).",
        "SAVE CONFIGURATION tapped on C5.",
        "Test STOCK_COUNT scan performed — session appears in Device Activity within a few seconds.",
        "At least one linen item is registered in the hardware database.",
        "At least one RFID tag is available for physical demonstration.",
    ]:
        s.append(chk(item))
    s.append(sp(5))

    s += h2("Simulation Mode Demo Sequence")
    for item in [
        "Confirm sidebar shows Simulation Mode.",
        "Dashboard: run Clear Generated Data then Generate Demo Data if a fresh state is needed.",
        "Linen Master: confirm generated items are visible.",
        "Laundry Batches: explain the seeded batch state.",
        "Reconciliation: confirm it matches the seeded outstanding state.",
        "Transaction History: explain the recorded audit trail.",
        "RFID Scan: present as a read-only page — not a live scanner.",
        "Return to Dashboard: restate Simulation vs Hardware isolation.",
    ]:
        s.append(chk(item))
    s.append(sp(5))

    s += h2("Hardware Mode Demo Sequence")
    for item in [
        "Switch browser to Hardware Mode.",
        "Confirm C5 Settings show the correct server address and Power Profile.",
        "EPC Registration (new tags): STOCK_COUNT → unknown EPC in Linen Master queue → Register.",
        "STOCK_COUNT: scan registered items → ACCEPTED results in Device Activity.",
        "SEND_TO_LAUNDRY: enter batch code → scan dispatch items → batch In Progress.",
        "Power Profile demo (optional): switch Near / Far / Medium, show range difference.",
        "RETURN_FROM_LAUNDRY (partial): scan subset → Outstanding decreases in Reconciliation.",
        "RETURN_FROM_LAUNDRY (final): return remaining items → Outstanding = 0.",
        "Confirm Completed: Laundry Batches shows Completed. Reconciliation shows empty state.",
        "Transaction History: all sessions visible with timestamps and per-EPC results.",
    ]:
        s.append(chk(item))
    s.append(sp(5))

    s += h2("Fallback Procedures")
    s += callout(
        "<b>C5 Unavailable:</b> Switch to Simulation Mode and continue with the seeded dataset. "
        "Dashboard actions, inventory views, reconciliation, and transaction history remain "
        "demonstrable without physical hardware.",
        "info"
    )
    s += callout(
        "<b>Application Service Unavailable:</b> Confirm the service is still active. Restart "
        "if needed. If unavailable, demonstrate using pre-captured screenshots or a screen recording.",
        "warn"
    )
    s += callout(
        "<b>RFID Tags Not Being Read:</b> Check Power Profile — switch to Medium or Far. Ensure "
        "tags are oriented horizontally. Restart the C5 app. If unresolved: switch to Simulation Mode.",
        "warn"
    )

    s += h2("Stop Conditions")
    for title, desc in [
        ("STOP — Application crash or unrecoverable error",
         "Pause, restart the service, and resume from the last completed checkpoint."),
        ("STOP — Results do not match expected behaviour",
         "Stop immediately. Note the discrepancy. Do not claim the result is correct. Investigate after the session."),
        ("STOP — Hardware data visible in Simulation Mode (or vice versa)",
         "Database isolation is a core guarantee. This is a critical integrity failure requiring investigation."),
    ]:
        t = Table([[Paragraph(f"<b>{title}</b>", ST["stop_title"]),
                    Paragraph(desc, ST["callout_d"])]],
                  colWidths=[62*mm, CW - 62*mm - 2])
        t.setStyle(TableStyle([
            ("BACKGROUND",(0,0),(-1,-1),RED_SOFT),
            ("BOX",(0,0),(-1,-1),1,RED),
            ("TOPPADDING",(0,0),(-1,-1),6),("BOTTOMPADDING",(0,0),(-1,-1),6),
            ("LEFTPADDING",(0,0),(-1,-1),7),("RIGHTPADDING",(0,0),(-1,-1),7),
            ("VALIGN",(0,0),(-1,-1),"TOP"),
        ]))
        s.extend([t, sp(4)])
    return s


# ─── Section 11: Troubleshooting ─────────────────────────────────────────────
def sec_trouble():
    s = []
    s += h1("11. Troubleshooting")
    # Correction 6: replace dev-path commands with partner-safe language
    rows = [
        ["C5 shows upload error / connection refused",
         "Confirm the application service is running. Verify the C5 server address is correct and both devices are on the same network."],
        ["Hardware scan data not appearing in browser",
         "Confirm browser is in Hardware Mode. If data is still missing, the APK may be stale — reinstall from current source."],
        ["Unknown EPC not appearing in Linen Master queue",
         "Confirm Hardware Mode is active. Wait up to 2.5 seconds. Hard-refresh the page if queue remains empty."],
        ["FAILED TO SET POWER on C5",
         "Restart the app. Try a lower power profile (Near). If persistent, power-cycle the C5 device."],
        ["RETURN_FROM_LAUNDRY shows WRONG_BATCH",
         "The batch code entered for return does not match the send batch code. Re-enter the exact code used during SEND_TO_LAUNDRY."],
        ["ALREADY_RETURNED on all returned items",
         "Items were already returned in a prior session. Check Device Activity to confirm. No further action needed."],
        ["Reconciliation shows a batch that should be completed",
         "Outstanding count is not yet zero — partial return recorded. Return remaining items; batch disappears when outstanding = 0."],
        ["SQLite lock during hardware database reset",
         "Stop the application service and all processes accessing the hardware database before running the reset script. Restart the service after completion."],
        ["All results show UNKNOWN_EPC after EPC registration",
         "Stale APK likely installed. Reinstall from current source on C5."],
        ["Unexpected page behaviour after source changes",
         "The application build cache may be stale. Stop the service, clear the build cache, and restart."],
        ["Browser and C5 show different state for the same workflow",
         "Browser may be in Simulation Mode while C5 targets Hardware Mode. Switch browser to Hardware Mode."],
        ["Scan reads far more items than expected",
         "Power profile is set to Far. Switch to Near or Medium in C5 Settings and save."],
    ]
    s.append(dtable(
        ["Symptom", "Resolution"],
        rows,
        cw=[72*mm, 87*mm],
        sm=True
    ))
    return s


# ─── Section 12: Verification Matrix ─────────────────────────────────────────
def sec_verify():
    s = []
    s += h1("12. Verification Matrix")
    s += body(
        "The table below records the highest verification level achieved for each capability. "
        "DEPLOYMENT VERIFIED is not claimed — the platform has not been deployed to a production server."
    )

    def vb(level):
        cm = {"PHYSICALLY VERIFIED": "#005a5a", "DEVICE VERIFIED": "#1a5a3a",
              "BROWSER VERIFIED": "#1a2f5a", "AUTOMATED TESTED": "#8a6000",
              "BUILD VERIFIED": "#4a4a4a", "NOT VERIFIED": "#c0392b"}
        c = cm.get(level, "#6a6a6a")
        return f'<font color="{c}"><b>{level}</b></font>'

    rows = [
        ["Core Web UI (all routes)", vb("BROWSER VERIFIED"), "All routes loaded in Chrome"],
        ["Simulation Mode database isolation", vb("BROWSER VERIFIED"), "Simulation database confirmed isolated"],
        ["Hardware Mode database isolation", vb("BROWSER VERIFIED"), "Hardware database confirmed isolated"],
        ["STOCK_COUNT (physical)", vb("PHYSICALLY VERIFIED"), "C5 upload confirmed with real RFID tags"],
        ["SEND_TO_LAUNDRY (physical)", vb("PHYSICALLY VERIFIED"), "Dynamic batch creation confirmed"],
        ["RETURN_FROM_LAUNDRY (physical)", vb("PHYSICALLY VERIFIED"), "WRONG_BATCH and ALREADY_RETURNED rejections confirmed"],
        ["Dynamic batch reconciliation", vb("PHYSICALLY VERIFIED"), "17/17 automated assertions + physical validation"],
        ["Web-first EPC registration", vb("PHYSICALLY VERIFIED"), "Unknown EPC appeared in browser queue within 2.5 s"],
        ["RFID power profiles (Near/Medium/Far)", vb("PHYSICALLY VERIFIED"), "Physical range comparison + persistence after restart"],
        ["Retry / idempotency", vb("AUTOMATED TESTED"), "17/17 assertions; no physical duplicate session test"],
        ["In-app guide routes", vb("BROWSER VERIFIED"), "All four guide routes loaded in Chrome"],
        ["Simulation Data Management", vb("BROWSER VERIFIED"), "Generate / Clear / Reset actions click-tested"],
        ["Hardware database lifecycle", vb("AUTOMATED TESTED"), "init, backup, reset, verify PASS on Windows"],
        ["Production deployment", vb("NOT VERIFIED"), "Deployment to production server not yet performed"],
    ]
    t = Table(
        [[Paragraph("<b>Capability</b>", ST["th"]),
          Paragraph("<b>Highest Level</b>", ST["th"]),
          Paragraph("<b>Notes</b>", ST["th"])]] +
        [[Paragraph(r[0], ST["td"]), Paragraph(r[1], ST["td"]), Paragraph(r[2], ST["td"])]
         for r in rows],
        colWidths=[60*mm, 40*mm, 59*mm], repeatRows=1, spaceBefore=4, spaceAfter=6,
    )
    t.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,0),NAVY),("TEXTCOLOR",(0,0),(-1,0),WHITE),
        ("FONTNAME",(0,0),(-1,0),"Helvetica-Bold"),("FONTSIZE",(0,0),(-1,-1),8),
        ("ROWBACKGROUNDS",(0,1),(-1,-1),[WHITE,SURFACE]),
        ("GRID",(0,0),(-1,-1),0.4,LINE),("VALIGN",(0,0),(-1,-1),"TOP"),
        ("TOPPADDING",(0,0),(-1,-1),4),("BOTTOMPADDING",(0,0),(-1,-1),4),
        ("LEFTPADDING",(0,0),(-1,-1),5),("RIGHTPADDING",(0,0),(-1,-1),5),
    ]))
    s.append(t)
    s += callout(
        "<b>Verification boundary:</b> BROWSER VERIFIED confirms pages loaded and key interactions "
        "were tested in Chrome on a local development server. PHYSICALLY VERIFIED confirms the "
        "complete operation — physical RFID reads, C5 uploads, and correct data in the browser — "
        "was observed end-to-end. DEPLOYMENT VERIFIED is not claimed.",
        "info"
    )
    return s


# ─── Section 13: Known Limitations ────────────────────────────────────────────
def sec_limits():
    s = []
    s += h1("13. Known Limitations")
    s += body(
        "The following are factual boundaries of the current MVP. Each is known and intentional "
        "for this phase of the project."
    )
    items = [
        ("No production deployment",
         "The platform runs on a local development server. Cloud deployment has been intentionally "
         "deferred. DEPLOYMENT VERIFIED is not claimed for any milestone."),
        ("Screenshots contain environment-specific demo data",
         "Screenshots were captured from a local development environment. Item counts, EPC values, "
         "batch codes, and timestamps reflect that specific session and are not real hotel data."),
        ("Local endpoint values are environment-specific",
         "The C5 Settings server address reflects the local development machine at time of capture. "
         "This value must be reconfigured per deployment environment."),
        ("No APK distribution portal",
         "The Android APK must be sideloaded from a build workstation. There is no in-app "
         "distribution mechanism in this MVP."),
        ("No hardware database reset via the browser",
         "Clearing hardware data requires the CLI reset script or manual database file replacement. "
         "Simulation data can be reset directly from the browser Dashboard."),
        ("No authentication layer",
         "The platform has no login or multi-user session management. A single operator context "
         "is assumed per browser session."),
        ("Desktop browser required",
         "The web UI is designed for desktop or tablet (minimum 1280 px width). Narrow mobile "
         "viewports may require horizontal scrolling."),
        ("Linen item cap at 100",
         "Both databases enforce a hard cap of 100 registered linen items as a safe MVP limit."),
        ("Asset Management is an expansion concept",
         "Asset Management is not a current core capability. The platform focuses on linen tracking "
         "through laundry cycles. Broader asset management is a planned expansion."),
        ("Some Android workflow screenshots not captured",
         "SEND_TO_LAUNDRY accepted-result and WRONG_BATCH rejection screenshots were not captured "
         "to avoid risky hardware state mutation. These are optional cosmetic assets."),
    ]
    for title, desc in items:
        s.append(KeepTogether([
            Paragraph(f"<b>{title}</b>", ST["h3"]),
            Paragraph(desc, ST["body_l"]),
        ]))
        s.append(sp(3))
    return s


# ─── Section 14: Glossary ─────────────────────────────────────────────────────
def sec_glossary():
    s = []
    s += h1("14. Glossary of Key Terms")
    s += body(
        "The following terms appear throughout this document and in the web platform interface."
    )
    terms = [
        ("Batch Code",
         "A short identifier (e.g. LB-HW-2) assigned to a laundry dispatch event. "
         "The operator enters this on the Chainway C5 before a SEND_TO_LAUNDRY scan. "
         "The API creates the batch automatically if it does not already exist."),
        ("EPC (Electronic Product Code)",
         "The unique identifier stored in each UHF RFID tag. The C5 reads and reports "
         "the EPC of every tag in range. EPCs are registered against linen items in the Linen Master."),
        ("Hardware Mode",
         "The operating mode in which all read/write operations target the hardware database. "
         "Used for live physical RFID operations with the Chainway C5 E710."),
        ("Hardware Database",
         "The isolated SQLite database that stores hardware-mode linen items, batches, "
         "transactions, and device sessions. No data is shared with the simulation database."),
        ("Outstanding",
         "The computed count of items sent to laundry that have not yet been returned. "
         "Formula: acceptedSent − validReturned, computed live — never stored."),
        ("Power Profile",
         "A named configuration (Near, Medium, Far) for the UHF antenna power level. "
         "The value is passed directly to the RFID SDK setPower() call before each scan."),
        ("Reconciliation",
         "The web platform page that lists all active batches with outstanding > 0. "
         "A batch card disappears automatically when its outstanding count reaches 0."),
        ("RFID (Radio-Frequency Identification)",
         "Technology used to identify linen items. UHF RFID tags are read by the "
         "Chainway C5 E710 handheld reader over distances of centimetres to several metres "
         "depending on the power profile and tag orientation."),
        ("Simulation Mode",
         "The operating mode in which all read/write operations target the simulation database. "
         "No physical hardware is required. Demo data is managed from the Dashboard."),
        ("Simulation Database",
         "The isolated SQLite database for simulation-mode data. Synthetic linen items and "
         "transactions are generated and cleared from the Dashboard's Simulation Data Management section."),
        ("STOCK_COUNT",
         "A workflow type that records a snapshot of which EPC tags are present at a location. "
         "Does not create or modify laundry batches."),
        ("SEND_TO_LAUNDRY",
         "A workflow type that dispatches linen items to a laundry batch. Creates the batch "
         "automatically if the submitted batch code does not already exist."),
        ("RETURN_FROM_LAUNDRY",
         "A workflow type that records the return of linen items from laundry. Outstanding "
         "decreases by each ACCEPTED return. ALREADY_RETURNED prevents double-counting."),
        ("X-Demo-Mode Header",
         "HTTP request header injected by browser middleware (from the demoMode cookie) or "
         "hardcoded by the Chainway C5 app. Determines which database the API targets. "
         "Values: SIMULATION or HARDWARE."),
    ]
    s.append(dtable(
        ["Term", "Definition"],
        terms,
        cw=[40*mm, 119*mm],
        sm=True
    ))
    return s


# ─── Source record ────────────────────────────────────────────────────────────
def write_source_record(page_count, pdf_hash):
    used = "\n".join(f"- `{r}` — {c[:90]}..." for r, c, _ in SCREENSHOTS_USED)
    omit = "\n".join(f"- `{r}` — {reason}" for r, reason in SCREENSHOTS_OMITTED)
    text = f"""# PDF Source Record — Porta Nusa Hotel RFID Documentation Package

## Generation Metadata

| Field | Value |
|---|---|
| Output filename | `porta-nusa-rfid-documentation-package.pdf` |
| Document version | 1.1 (Correction Pass) |
| Generation date | 28 June 2026 |
| Baseline commit | `72bf84d05f78e626a5cd1cc81849595d43435575` |
| Branch | `android-integration` |
| Page count | {page_count} |
| SHA-256 (PDF) | `{pdf_hash}` |
| Generator | `tmp/pdfs/generate_pdf.py` |
| Python library | reportlab 5.0.0 |

## Corrections Applied (v1.1)

1. Reconciliation caption corrected — screenshot shows partial return (1 outstanding), not empty state.
2. Dashboard caption corrected — screenshot shows Available: 1, In Laundry: 1, Outstanding: 1, Transactions: 2.
3. Linen Master caption corrected — screenshot shows two items, not three.
4. Android return caption corrected — 2 EPCs accepted, each read x14 (not 14 accepted entries).
5. Git metadata (commit hash, branch) removed from main PDF cover; retained in this source record only.
6. Developer paths (database file paths, local CLI commands) replaced with partner-safe language in main PDF.
7. Power unit label changed from "Power (dBm)" to "Configured Power Level".
8. C5 Settings screenshot captioned as local demo environment address.
9. Layout reflowed — forced page breaks removed to consolidate page count.

## Source Files

- `CLAUDE.md`
- `CURRENT_STATE.md`
- `AGENT_HANDOFF.md`
- `docs/screenshots/SCREENSHOT_MANIFEST.md`
- `web/app/guides/system-overview/page.tsx`
- `web/app/guides/simulation/page.tsx`
- `web/app/guides/hardware/page.tsx`
- `web/app/guides/operator-checklist/page.tsx`

## Screenshots Used ({len(SCREENSHOTS_USED)} files)

{used}

## Screenshots Omitted ({len(SCREENSHOTS_OMITTED)} files)

{omit}

## Evidence Boundaries

- `PHYSICALLY VERIFIED` is the highest claimed level for core RFID workflows.
- `DEPLOYMENT VERIFIED` is NOT claimed. No production deployment has been performed.
- Screenshots reflect demo data from a local development environment at time of capture.
- `web_05_hw_transaction_history.png` was mislabelled at original capture (file shows Device Activity page).
- `web_06_hw_device_activity.png` rejected — contains editor/terminal tooling screenshot.
- Server address `10.10.101.45` in C5 Settings screenshot is a local demo environment address.

## PDF Section Map

| Section | Title |
|---|---|
| 1 | Executive Summary |
| 2 | Solution Architecture |
| 3 | Operating Modes and Database Isolation |
| 4 | End-to-End Hardware Workflow |
| 5 | Web Platform — Key Screens |
| 6 | Chainway C5 Operation |
| 7 | RFID Power Profiles |
| 8 | Simulation Mode User Guide |
| 9 | Hardware Mode User Guide |
| 10 | Demo Operator Checklist |
| 11 | Troubleshooting |
| 12 | Verification Matrix |
| 13 | Known Limitations |
"""
    OUTPUT_RECORD.write_text(text, encoding="utf-8")
    print(f"  Source record: {OUTPUT_RECORD}")


# ─── Build ────────────────────────────────────────────────────────────────────
def build():
    print("Building PDF (v1.1 — Correction Pass)…")

    story = []
    story += cover()
    story += sec_exec()
    story += sec_arch()
    story += sec_modes()
    story += sec_workflow()
    story += sec_web_screens()
    story += sec_c5()
    story += sec_power()
    story += sec_sim_guide()
    story += sec_hw_guide()
    story += sec_checklist()
    story += sec_trouble()
    story += sec_verify()
    story += sec_limits()
    story += sec_glossary()

    doc = SimpleDocTemplate(
        str(OUTPUT_PDF), pagesize=A4,
        leftMargin=MARGIN_L, rightMargin=MARGIN_R,
        topMargin=MARGIN_T, bottomMargin=MARGIN_B,
        title="Porta Nusa Hotel — RFID Linen Visibility Platform",
        author="Porta Nusa Hotel",
        subject="Technical Documentation & Operator Guide v1.1",
        creator="ReportLab PDF Generator",
    )
    doc.build(story, canvasmaker=HFCanvas)

    size_kb = OUTPUT_PDF.stat().st_size // 1024
    print(f"  Written: {size_kb} KB")

    try:
        from pypdf import PdfReader
        pages = len(PdfReader(str(OUTPUT_PDF)).pages)
    except Exception:
        pages = "unknown"
    print(f"  Pages: {pages}")

    h = hashlib.sha256()
    with open(OUTPUT_PDF, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    sha = h.hexdigest()
    print(f"  SHA-256: {sha}")

    write_source_record(pages, sha)
    print("Done.")
    return pages, sha


if __name__ == "__main__":
    build()
