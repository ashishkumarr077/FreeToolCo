from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from pathlib import Path
import importlib.util
import json
import re

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "FreeToolCo-Management-Guide.pdf"

# Light parser for counts from src/data/tools.js to avoid executing JS in Python.
text = (ROOT / "src/data/tools.js").read_text(encoding="utf-8")
tools_count = len(re.findall(r"slug:\s*'", text))
categories_count = len(re.findall(r"id:\s*'", text.split("export const tools")[0]))

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="TitleFTC", parent=styles["Title"], fontSize=26, leading=31, textColor=colors.HexColor("#0f172a"), spaceAfter=12))
styles.add(ParagraphStyle(name="H1FTC", parent=styles["Heading1"], fontSize=18, leading=22, textColor=colors.HexColor("#2563eb"), spaceBefore=14, spaceAfter=8))
styles.add(ParagraphStyle(name="H2FTC", parent=styles["Heading2"], fontSize=13, leading=17, textColor=colors.HexColor("#0f172a"), spaceBefore=10, spaceAfter=6))
styles.add(ParagraphStyle(name="BodyFTC", parent=styles["BodyText"], fontSize=9.6, leading=13.2, spaceAfter=6))
styles.add(ParagraphStyle(name="CodeFTC", parent=styles["Code"], fontSize=8.5, leading=11.5, backColor=colors.HexColor("#f1f5f9"), borderColor=colors.HexColor("#e2e8f0"), borderWidth=0.4, borderPadding=6, spaceAfter=8))

story = []
P = lambda txt, style="BodyFTC": story.append(Paragraph(txt, styles[style]))

P("FreeToolCo Website Management Guide", "TitleFTC")
P(f"Production guide for freetoolco.com. Current project contains <b>{tools_count} tools</b> across <b>{categories_count} demand categories</b>, plus workflow guide pages, generated as static SEO pages with a plugin-style architecture.")
P("This guide is written for a non-technical manager. Give it to a developer when new engines are needed, but many new pages can be added by copying an existing tool entry.")

P("1. Project Structure", "H1FTC")
rows = [
    ["Path", "Purpose"],
    ["src/data/tools.js", "Main plugin registry. Add categories and tools here."],
    ["src/js/app.js", "Shared browser engines for PDF, image, calculator, text, developer, QR, and security tools."],
    ["src/css/styles.css", "Modern UI design system: colors, layout, cards, hero, tool panels, responsive design."],
    ["scripts/build.js", "Generates all static HTML pages, workflow guide pages, sitemap, robots.txt, manifest, and tool data."],
    ["scripts/tool-audit.js", "Checks tool registry quality and engine coverage."],
    ["scripts/seo-audit.js", "Runs 50 SEO audit loops across every generated page."],
    ["dist/", "Deployable static website output."],
]
table = Table(rows, colWidths=[55*mm, 115*mm])
table.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#2563eb")),
    ("TEXTCOLOR", (0,0), (-1,0), colors.white),
    ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
    ("GRID", (0,0), (-1,-1), 0.25, colors.HexColor("#cbd5e1")),
    ("VALIGN", (0,0), (-1,-1), "TOP"),
    ("FONTSIZE", (0,0), (-1,-1), 8.5),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
]))
story.append(table)

P("2. How to Add a New Tool", "H1FTC")
P("Step 1: Open <b>src/data/tools.js</b>.")
P("Step 2: Copy a similar tool object from the same category.")
P("Step 3: Change slug, name, category, engine, title, description, keywords, features, and privacy badge.")
P("Step 4: If the engine already exists, no JavaScript code change is required. If a new engine is needed, ask a developer to add it in src/js/app.js.")
P("Step 5: Run the test command before deployment.")
P("npm run test", "CodeFTC")
P("Example plugin entry:", "H2FTC")
P("""{
  slug: 'compress-image-to-150kb',
  name: 'Compress Image to 150KB',
  category: image,
  engine: 'image-target-size',
  title: 'Compress Image to 150KB Online Free | FreeToolCo',
  description: 'Compress JPG, PNG, or WebP images to around 150KB online.',
  keywords: ['compress image to 150kb', 'image under 150kb'],
  features: ['Target-size compression', 'Browser-based', 'No signup'],
  targetKB: 150
}""".replace("\n", "<br/>"), "CodeFTC")

P("3. How to Add a New Category", "H1FTC")
P("Add a new category object inside the categories array in src/data/tools.js. Then assign tools to that category id. Keep the category name simple because it appears in navigation, sitemap, internal links, and schema.")
P("Recommended category fields: id, name, shortName, slug, icon, color, description, seoTitle, seoDescription.")

P("4. SEO Rules for Every Tool", "H1FTC")
for item in [
    "Use one exact keyword in the H1 and title.",
    "Keep title around 45-70 characters when possible.",
    "Keep meta description under 160 characters.",
    "Use a short URL: /jpg-to-pdf/ not /tools/free-online-jpg-to-pdf-converter-tool/.",
    "Add at least 2 keywords and at least 3 feature bullets.",
    "Add FAQs for high-value tools when possible.",
    "Link to related tools in the same category.",
    "Do not use misleading download buttons or thin duplicate pages.",
]:
    P(f"• {item}")

P("5. Build and Deploy", "H1FTC")
P("Install dependencies once, build the project, then upload the dist folder to your hosting provider.")
P("npm install\nnpm run build\nnpm run test", "CodeFTC")
P("Deployable folder: <b>dist/</b>. If using Cloudflare Pages, Netlify, or Vercel, set build command to <b>npm run build</b> and output directory to <b>dist</b>.")

P("6. Testing Policy", "H1FTC")
P("The project includes automated quality loops. The SEO audit runs 50 passes across the generated website. It checks title tags, meta descriptions, canonical URLs, robots meta, Open Graph, Twitter cards, H1 count, sitemap presence, internal links, WebApplication schema, FAQ schema, HowTo schema, and tool mounts.")
P("npm run audit:tools\nnpm run audit:seo", "CodeFTC")

P("7. Competitor-Informed Design Decisions", "H1FTC")
P("FreeToolCo uses proven patterns from major tool websites: simple task-first hero sections, large upload boxes, no-signup trust messaging, category hubs, related tools, FAQs, and clear post-result actions. The unique improvement is the visible processing-mode badge plus plugin-style management for non-technical operation.")

P("8. Maintenance Checklist", "H1FTC")
for item in [
    "Run npm run test after every change.",
    "Check Search Console monthly for high-impression pages with low CTR.",
    "Improve FAQs on pages that receive impressions but do not rank.",
    "Test top PDF and image tools with real files monthly.",
    "Avoid adding ads near primary download buttons.",
    "Keep privacy badges accurate.",
    "Compress assets and avoid loading heavy code on pages that do not need it.",
    "Add India-specific long-tail tools such as target KB image and PDF pages where useful.",
]:
    P(f"• {item}")

P("9. When to Ask a Developer", "H1FTC")
P("Ask a developer when a tool needs a new processing engine, server processing, OCR, AI, authentication, payments, databases, or APIs. For tools based on an existing engine, a manager can usually copy and edit a registry entry.")

P("10. Final Deployment Note", "H1FTC")
P("Before going live on freetoolco.com, verify that contact@freetoolco.com is a working inbox, connect Search Console, verify sitemap submission, and manually test the top 20 tools on mobile and desktop browsers.")


def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#64748b"))
    canvas.drawString(18*mm, 12*mm, "FreeToolCo Management Guide")
    canvas.drawRightString(192*mm, 12*mm, f"Page {doc.page}")
    canvas.restoreState()

pdf = SimpleDocTemplate(str(OUT), pagesize=A4, rightMargin=18*mm, leftMargin=18*mm, topMargin=18*mm, bottomMargin=18*mm)
pdf.build(story, onFirstPage=footer, onLaterPages=footer)
print(OUT)
