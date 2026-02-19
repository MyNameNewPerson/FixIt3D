# Memo: Interface & Tasks

## Interface Elements
- **Modal Structure:** `.modal-content-wrapper` > `.modal-card-detail` > `.modal-grid`
  - Left: `.modal-visual-column` (Viewer/Image + Meta tags)
  - Right: `.modal-info-column` (Title, Tabs, Content)
- **Tabs:** Print (`#tab-print`), Masters (`#tab-map`), Calculation (`#tab-calc`), Buy (`#tab-buy`).
- **Buttons:**
  - `.btn-action-main` (Primary actions like Download)
  - `.market-btn` (Affiliate links, large)
  - `.market-btn-mini` (Small marketplace links - TO BE REMOVED in calc tab)
  - `.filter-chip` (Brand filters)

## Styles
- **Grid Layout:** `.models-grid` uses `grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))`
- **Modal Grid:** Currently `1.2fr 0.8fr`. Plan to change to `1fr 1fr` or optimize for content fit.
- **Mobile Modal:** Bottom sheet style (`height: 85vh`, `border-radius: 24px 24px 0 0`). Visual column `35vh`.
- **Colors:**
  - Primary: `#2563eb`
  - Accent: `#f59e0b`
  - Background: `#f8fafc`

## Tasks
1.  **Print Tab:**
    - [ ] Remove "Treatstock Global" block (keep in Masters tab).
    - [ ] Change "Download" to direct API download (no redirect to source site).
2.  **Calculation Tab:**
    - [ ] Fix text duplication: "PLA (Ozon) (Ozon)" -> "PLA (Ozon)".
    - [ ] Remove redundant "market-btn-mini" block (generic links).
3.  **Buy Tab:**
    - [ ] Ensure content fits (fix overflow/sizing).
4.  **Masters Tab:**
    - [ ] Keep Treatstock block.
5.  **Image Display:**
    - [ ] Fix broken image loading (ensure `fallback.src` works and handles errors).
6.  **All Brands Button:**
    - [ ] Fix click handler (currently broken).
7.  **Layout & Responsiveness:**
    - [ ] Optimize `.modal-grid` ratios.
    - [ ] Check mobile view (iOS/Android).
    - [ ] Ensure no regressions in Grid/List toggle or Pagination.

## Checklist
- [ ] Verify "Download" triggers file download.
- [ ] Verify "Masters" tab has Treatstock, "Print" does not.
- [ ] Verify "Calc" tab has no duplicates.
- [ ] Verify "All Brands" resets filters.
- [ ] Check Model Modal layout on Desktop & Mobile.
- [ ] Verify Image loads correctly on click.
