from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from hashlib import sha256
from pathlib import Path

from PIL import Image as PILImage
from pypdf import PdfReader
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    Image,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[2]
OUTPUT_DIR = ROOT / "output" / "pdf"
PDF_PATH = OUTPUT_DIR / "porta-nusa-rfid-documentation-package.pdf"
SOURCE_RECORD_PATH = OUTPUT_DIR / "porta-nusa-rfid-documentation-source-record.md"
BASELINE_COMMIT = "858a9e1"
BRANCH = "android-integration"


@dataclass(frozen=True)
class Asset:
    path: str
    caption: str


WEB_ASSETS = [
    Asset("docs/screenshots/web/web_00_landing_mode_selection.png", "Landing page and mode selection"),
    Asset("docs/screenshots/web/web_08_sim_dashboard.png", "Simulation dashboard with canonical data actions"),
    Asset("docs/screenshots/web/web_09_sim_rfid_scan.png", "Simulation RFID scan read-only visibility page"),
]

ANDROID_ASSETS = [
    Asset("docs/screenshots/android/c5_settings.png", "C5 settings with server URL and power profile"),
    Asset("docs/screenshots/android/c5_transaction_dropdown.png", "Workflow picker with all three transaction types"),
    Asset("docs/screenshots/android/c5_new_session.png", "New session panel"),
    Asset("docs/screenshots/android/c5_stock_count_scanning.png", "Live STOCK_COUNT scan in progress"),
    Asset("docs/screenshots/android/c5_stock_count_result.png", "Stopped STOCK_COUNT session with retry option"),
    Asset("docs/screenshots/android/c5_stock_count_accepted.png", "Accepted STOCK_COUNT upload result"),
    Asset("docs/screenshots/android/c5_return_from_laundry_accepted.png", "Accepted RETURN_FROM_LAUNDRY result"),
]

GUIDE_SOURCES = [
    "web/app/guides/system-overview/page.tsx",
    "web/app/guides/simulation/page.tsx",
    "web/app/guides/hardware/page.tsx",
    "web/app/guides/operator-checklist/page.tsx",
]


def page_footer(canvas, doc) -> None:
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor("#d9e3ea"))
    canvas.line(doc.leftMargin, 0.55 * inch, letter[0] - doc.rightMargin, 0.55 * inch)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#4a5a67"))
    canvas.drawString(doc.leftMargin, 0.35 * inch, f"Baseline commit {BASELINE_COMMIT}")
    canvas.drawRightString(letter[0] - doc.rightMargin, 0.35 * inch, f"Page {doc.page}")
    canvas.restoreState()


def build_styles():
    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="DocTitle",
            parent=styles["Title"],
            fontName="Helvetica-Bold",
            fontSize=24,
            leading=28,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#12344d"),
            spaceAfter=12,
        )
    )
    styles.add(
        ParagraphStyle(
            name="SectionTitle",
            parent=styles["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=16,
            leading=20,
            textColor=colors.HexColor("#12344d"),
            spaceAfter=8,
            spaceBefore=2,
        )
    )
    styles.add(
        ParagraphStyle(
            name="SubTitle",
            parent=styles["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=11,
            leading=14,
            textColor=colors.HexColor("#0f766e"),
            spaceAfter=6,
            spaceBefore=2,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Body",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=9.4,
            leading=13,
            textColor=colors.HexColor("#1f2933"),
            spaceAfter=6,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Caption",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=8,
            leading=10,
            textColor=colors.HexColor("#52606d"),
            alignment=TA_CENTER,
            spaceBefore=3,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Small",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=8,
            leading=10,
            textColor=colors.HexColor("#52606d"),
            spaceAfter=4,
        )
    )
    return styles


def img_cell(path: Path, caption: str, max_width: float, max_height: float, styles) -> Table:
    with PILImage.open(path) as img:
        width, height = img.size
    scale = min(max_width / width, max_height / height)
    flow_img = Image(str(path), width=width * scale, height=height * scale)
    caption_para = Paragraph(caption, styles["Caption"])
    table = Table([[flow_img], [caption_para]], colWidths=[max_width], hAlign="CENTER")
    table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )
    return table


def two_up(asset_a: Asset, asset_b: Asset, styles, max_height: float = 2.95 * inch) -> Table:
    col_width = 3.2 * inch
    left = img_cell(ROOT / asset_a.path, asset_a.caption, col_width, max_height, styles)
    right = img_cell(ROOT / asset_b.path, asset_b.caption, col_width, max_height, styles)
    table = Table([[left, right]], colWidths=[col_width, col_width], hAlign="CENTER")
    table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )
    return table


def bullet_lines(items: list[str], styles) -> list[Paragraph]:
    return [Paragraph(f"- {item}", styles["Body"]) for item in items]


def wrap_row(values: list[str], style) -> list[Paragraph]:
    return [Paragraph(value, style) for value in values]


def build_story():
    styles = build_styles()
    story = []

    story.append(Spacer(1, 1.25 * inch))
    story.append(Paragraph("Porta Nusa Hotel RFID Linen Visibility Platform", styles["DocTitle"]))
    story.append(Paragraph("PDF Documentation Package", styles["DocTitle"]))
    story.append(Paragraph("Professional project brief based on in-app guides and the confirmed screenshot package.", styles["Body"]))
    story.append(Spacer(1, 0.25 * inch))
    cover_table = Table(
        [
            ["Branch", BRANCH],
            ["Baseline commit", BASELINE_COMMIT],
            ["Generation date", datetime.now().strftime("%Y-%m-%d %H:%M")],
            ["Evidence boundary", "No deployment claims. No PPTX claims. No screenshot originals modified."],
        ],
        colWidths=[1.4 * inch, 4.8 * inch],
    )
    cover_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#e6fffb")),
                ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#115e59")),
                ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#b8c7d1")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("PADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    story.append(cover_table)
    story.append(Spacer(1, 0.35 * inch))
    story.append(img_cell(ROOT / WEB_ASSETS[0].path, WEB_ASSETS[0].caption, 5.8 * inch, 3.4 * inch, styles))
    story.append(PageBreak())

    story.append(Paragraph("Package Scope", styles["SectionTitle"]))
    story.extend(
        bullet_lines(
            [
                "Primary content source: the four in-app guide routes under web/app/guides/.",
                "Asset package: 22 confirmed PNG screenshots in docs/screenshots/.",
                "Simulation false affordances are removed from the baseline used here.",
                "Dashboard Simulation Data Management is the canonical location for Generate Demo Data, Clear Generated Data, and Reset Database.",
                "Simulation RFID Scan is documented as a read-only visibility page, not a browser-side scanner.",
            ],
            styles,
        )
    )
    story.append(Spacer(1, 0.1 * inch))
    story.append(Paragraph("Architecture Snapshot", styles["SectionTitle"]))
    arch = Table(
        [
            ["Client surface", "Mode header", "Database target"],
            ["Browser - Simulation Mode", "X-Demo-Mode: SIMULATION", "simulation.db"],
            ["Browser - Hardware Mode", "X-Demo-Mode: HARDWARE", "hardware.db"],
            ["Chainway C5 Android", "X-Demo-Mode: HARDWARE", "hardware.db"],
        ],
        colWidths=[2.2 * inch, 2.1 * inch, 1.7 * inch],
    )
    arch.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#12344d")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#b8c7d1")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 8.8),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("PADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    story.append(arch)
    story.append(Spacer(1, 0.16 * inch))
    story.append(Paragraph("Verification Boundary", styles["SubTitle"]))
    story.extend(
        bullet_lines(
            [
                "Deployment remains Not Yet Verified.",
                "The partner PPTX deliverable remains Not Yet Verified and is out of scope here.",
                "Optional Android screenshots not captured: SEND_TO_LAUNDRY accepted result and WRONG_BATCH rejection.",
                "Screenshot values reflect demo data at capture time and do not by themselves prove full physical provenance.",
            ],
            styles,
        )
    )
    story.append(PageBreak())

    story.append(Paragraph("Guide-Derived Narrative", styles["SectionTitle"]))
    story.append(Paragraph("System Overview", styles["SubTitle"]))
    story.extend(
        bullet_lines(
            [
                "The web app remains the source of truth for validation and business logic.",
                "Simulation and Hardware workflows are fully isolated by mode-aware routing and separate SQLite databases.",
                "Laundry reconciliation is dynamic per batch code, with outstanding calculated live as acceptedSent minus validReturned.",
                "RFID power profiles on the C5 are Near 5 dBm, Medium 18 dBm, and Far 30 dBm.",
            ],
            styles,
        )
    )
    story.append(Paragraph("Verification Matrix", styles["SubTitle"]))
    verify = Table(
        [
            ["Capability", "Highest verified level"],
            ["Simulation isolation", "BROWSER VERIFIED"],
            ["Hardware isolation", "BROWSER VERIFIED"],
            ["STOCK_COUNT, SEND_TO_LAUNDRY, RETURN_FROM_LAUNDRY", "PHYSICALLY VERIFIED"],
            ["Dynamic batch reconciliation", "PHYSICALLY VERIFIED"],
            ["RFID power profiles", "PHYSICALLY VERIFIED"],
            ["PDF package itself", "VISUALLY INSPECTED"],
            ["Deployment", "NOT YET VERIFIED"],
        ],
        colWidths=[4.7 * inch, 1.7 * inch],
    )
    verify.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e8f1f8")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#12344d")),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#c7d3dd")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 8.7),
                ("PADDING", (0, 0), (-1, -1), 6),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    story.append(verify)
    story.append(Spacer(1, 0.16 * inch))
    story.append(Paragraph("Guide Sources Used", styles["SubTitle"]))
    story.extend(bullet_lines(GUIDE_SOURCES, styles))
    story.append(PageBreak())

    story.append(Paragraph("Simulation Mode Walkthrough", styles["SectionTitle"]))
    story.extend(
        bullet_lines(
            [
                "Start on the Dashboard and use Simulation Data Management as the single approved control surface for synthetic data.",
                "Recommended pre-demo sequence: Clear Generated Data, then Generate Demo Data.",
                "RFID Scan in Simulation Mode is a read-only latest-session page for explanation and validation review.",
                "The operator checklist and simulation guide both prohibit presenting browser-side live scanning.",
            ],
            styles,
        )
    )
    story.append(Spacer(1, 0.08 * inch))
    story.append(two_up(WEB_ASSETS[1], WEB_ASSETS[2], styles))
    story.append(PageBreak())

    story.append(Paragraph("Hardware Mode Browser Verification", styles["SectionTitle"]))
    story.extend(
        bullet_lines(
            [
                "Hardware scans start on the Chainway C5, but browser pages remain the approval and audit surface.",
                "Linen Master is used for unknown EPC registration after the C5 uploads a discovery session.",
                "Laundry Batches and Reconciliation confirm sent, returned, and outstanding counts per exact batch code.",
                "Device Activity and Transaction History provide the session trail used to validate uploads and retry safety.",
                "Hardware RFID Scan is an observation page within Hardware Mode, not a replacement for physical trigger scanning.",
            ],
            styles,
        )
    )
    small_body = ParagraphStyle(
        "TableBody",
        parent=styles["Small"],
        fontName="Helvetica",
        fontSize=7.8,
        leading=9.2,
        textColor=colors.HexColor("#1f2933"),
    )
    browser_checks = Table(
        [
            wrap_row(["Browser page", "Hardware-mode purpose", "What the operator confirms"], small_body),
            wrap_row(["Dashboard", "Current counts and state summary", "Metrics reflect current hardware.db state"], small_body),
            wrap_row(["Linen Master", "Unknown EPC queue and registered items", "New tag appears within about 2.5 seconds and can be registered"], small_body),
            wrap_row(["Laundry Batches", "Batch overview after SEND_TO_LAUNDRY", "Submitted batch code exists and Sent count is correct"], small_body),
            wrap_row(["Reconciliation", "Outstanding items after partial returns", "Batch remains until accepted returns drive outstanding to zero"], small_body),
            wrap_row(["Device Activity", "Near-real-time upload evidence", "Recent C5 sessions arrive after a scan"], small_body),
            wrap_row(["Transaction History", "Per-session audit trail", "Retry does not create duplicate records"], small_body),
        ],
        colWidths=[1.45 * inch, 2.15 * inch, 2.65 * inch],
    )
    browser_checks.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#12344d")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#c7d3dd")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 8.2),
                ("PADDING", (0, 0), (-1, -1), 5),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    story.append(browser_checks)
    story.append(Spacer(1, 0.14 * inch))
    story.append(Paragraph("Hardware Workflow Guardrails", styles["SubTitle"]))
    story.extend(
        bullet_lines(
            [
                "SEND_TO_LAUNDRY creates or reuses the exact submitted batch code. No demo batch is hardcoded.",
                "RETURN_FROM_LAUNDRY requires the exact originating batch code.",
                "WRONG_BATCH, ALREADY_RETURNED, and UNKNOWN_EPC remain server-side validation outcomes.",
                "Browser mode must be Hardware Mode while validating physical sessions.",
            ],
            styles,
        )
    )
    story.append(PageBreak())

    story.append(Paragraph("Chainway C5 - Setup and Session Selection", styles["SectionTitle"]))
    story.extend(
        bullet_lines(
            [
                "The Android app always posts with X-Demo-Mode: HARDWARE.",
                "Server URL and reader power profile are configured in-app and persist after SAVE CONFIGURATION.",
                "Workflow selection covers STOCK_COUNT, SEND_TO_LAUNDRY, and RETURN_FROM_LAUNDRY.",
            ],
            styles,
        )
    )
    story.append(two_up(ANDROID_ASSETS[0], ANDROID_ASSETS[1], styles, max_height=3.55 * inch))
    story.append(Spacer(1, 0.12 * inch))
    story.append(img_cell(ROOT / ANDROID_ASSETS[2].path, ANDROID_ASSETS[2].caption, 2.15 * inch, 3.1 * inch, styles))
    story.append(PageBreak())

    story.append(Paragraph("Chainway C5 - Physical Scan Execution", styles["SectionTitle"]))
    story.extend(
        bullet_lines(
            [
                "STOCK_COUNT starts from the handheld, not the browser.",
                "The stopped session screen exposes retry behavior without duplicating server records.",
                "Accepted upload results are reviewed in the app and then cross-checked in the browser.",
            ],
            styles,
        )
    )
    story.append(two_up(ANDROID_ASSETS[3], ANDROID_ASSETS[4], styles, max_height=3.55 * inch))
    story.append(Spacer(1, 0.12 * inch))
    story.append(two_up(ANDROID_ASSETS[5], ANDROID_ASSETS[6], styles, max_height=3.55 * inch))
    story.append(PageBreak())

    story.append(Paragraph("Known Limitations and Deferred Items", styles["SectionTitle"]))
    story.extend(
        bullet_lines(
            [
                "Docker and Cloudflare deployment have not yet been performed.",
                "The partner-ready PPTX has not yet been created.",
                "No hardware.db reset UI exists in the MVP; hardware state is intentionally persistent.",
                "The browser UI targets desktop and tablet widths, not narrow mobile viewports.",
                "Optional Android evidence not captured: SEND_TO_LAUNDRY accepted result and WRONG_BATCH rejection.",
            ],
            styles,
        )
    )
    story.append(Spacer(1, 0.12 * inch))
    story.append(Paragraph("Selected Screenshot Inventory", styles["SubTitle"]))
    inventory_rows = [["Category", "File", "Use in PDF"]]
    for asset in WEB_ASSETS + ANDROID_ASSETS:
        category = "Web" if "/web/" in asset.path else "Android"
        inventory_rows.append([category, Path(asset.path).name, asset.caption])
    inventory = Table(inventory_rows, colWidths=[0.8 * inch, 2.2 * inch, 3.5 * inch])
    inventory.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#12344d")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#c7d3dd")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 7.7),
                ("PADDING", (0, 0), (-1, -1), 4),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    story.append(inventory)
    story.append(Spacer(1, 0.15 * inch))
    story.append(Paragraph("The full 22-file screenshot package remains preserved in docs/screenshots/ and is referenced in the source record.", styles["Small"]))

    return story


def write_source_record() -> None:
    all_screens = sorted((ROOT / "docs" / "screenshots").rglob("*.png"))
    pdf_hash = sha256(PDF_PATH.read_bytes()).hexdigest()
    page_count = len(PdfReader(str(PDF_PATH)).pages)
    used_assets = WEB_ASSETS + ANDROID_ASSETS
    lines = [
        "# PDF Documentation Package - Source Record",
        "",
        f"- Output PDF: `{PDF_PATH.relative_to(ROOT).as_posix()}`",
        f"- Baseline commit: `{BASELINE_COMMIT}`",
        f"- Branch: `{BRANCH}`",
        f"- Generated at: `{datetime.now().isoformat(timespec='seconds')}`",
        f"- PDF SHA256: `{pdf_hash}`",
        f"- Page count: `{page_count}`",
        "",
        "## Content Sources",
        "",
        "Primary in-app guide pages:",
    ]
    lines.extend([f"- `{path}`" for path in GUIDE_SOURCES])
    lines.extend(
        [
            "",
            "Screenshot manifest:",
            "- `docs/screenshots/SCREENSHOT_MANIFEST.md`",
            "",
            "## Screenshot Package Verification",
            "",
            f"- Confirmed PNG count: `{len(all_screens)}`",
            "- Screenshot originals were not modified.",
            "- Selected screenshots were embedded directly from repository paths.",
            "",
            "### Screenshots Used In PDF",
        ]
    )
    lines.extend([f"- `{asset.path}` - {asset.caption}" for asset in used_assets])
    lines.extend(
        [
            "",
            "### Full Screenshot Inventory Referenced",
        ]
    )
    lines.extend([f"- `{path.relative_to(ROOT).as_posix()}`" for path in all_screens])
    lines.extend(
        [
            "",
            "## Evidence Boundary",
            "",
            "- PDF, PPTX, and deployment were previously Not Yet Verified.",
            "- This package does not claim DEPLOYMENT VERIFIED.",
            "- This package does not claim PPTX completion.",
            "- Optional Android screenshots not captured remain out of scope: SEND_TO_LAUNDRY accepted result and WRONG_BATCH rejection.",
            "",
            "## Local Files Produced",
            "",
            "- `tmp/pdfs/generate_pdf_documentation.py`",
            f"- `{PDF_PATH.relative_to(ROOT).as_posix()}`",
            f"- `{SOURCE_RECORD_PATH.relative_to(ROOT).as_posix()}`",
        ]
    )
    SOURCE_RECORD_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(
        str(PDF_PATH),
        pagesize=letter,
        leftMargin=0.65 * inch,
        rightMargin=0.65 * inch,
        topMargin=0.65 * inch,
        bottomMargin=0.8 * inch,
        title="Porta Nusa Hotel RFID Documentation Package",
        author="OpenAI Codex",
    )
    doc.build(build_story(), onFirstPage=page_footer, onLaterPages=page_footer)
    write_source_record()
    print(PDF_PATH)
    print(SOURCE_RECORD_PATH)


if __name__ == "__main__":
    main()
