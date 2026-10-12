# Make Add/Edit Record follow the active theme

Written against: 24b941e

## Evidence chain

- Surface: `/add`, `/album/:id/edit` (`src/pages/AddRecord.jsx`), cover picker (`src/components/forms/ImageUpload.jsx`)
- Problem: Both files hardcode light-palette hex (`#1A1A1A`, `#FFFFFF`, `#E5E5E5`, `#9A9A9A`) inline. `App.jsx` toggles `html.dark` for the Night theme, and inline hex cannot follow it. In Night, the primary buttons stay `#1A1A1A` on the `#111111` page, and the preview card, mode toggle and cover picker stay white.
- Design evidence: `src/index.css` defines `--color-primary`, `--color-primary-foreground`, `--color-card`, `--color-secondary`, `--color-muted-foreground`, each with a `html.dark` override. `Wall.jsx`, `AppShell.jsx`, `Sync.jsx` and `AddRecord.jsx`'s own `inputStyle` already use `var(--color-*)`. Each hex literal equals the light-theme value of exactly one token.
- Owner: `src/index.css` (tokens)
- Scope and affected surfaces: `AddRecord.jsx`, `ImageUpload.jsx`
- Uncertainty: none for the mapping. Night-theme appearance after the change should be checked in the browser.

## Design decision

Replace each hex literal with the token whose light value is identical. Light theme stays pixel-identical, and Night theme follows the tokens already defined for it.

## Reuse

- `var(--color-primary)` = `#1A1A1A`, `var(--color-primary-foreground)` = `#FFFFFF`
- `var(--color-card)` = `#FFFFFF`
- `var(--color-secondary)` = `#E5E5E5`
- `var(--color-muted-foreground)` = `#9A9A9A`
- `var(--color-foreground)` = `#1A1A1A` for text on a card surface
- Exemplar: `inputStyle` in `src/pages/AddRecord.jsx:12-23` (already tokenized)

No new primitive.

## Changes

1. `src/pages/AddRecord.jsx`
   - Change, by role:
     - Filled button background `#1A1A1A` → `var(--color-primary)`, and its text `#FFFFFF` → `var(--color-primary-foreground)`. Lines ~112-113 (enabled state), 221, 443.
     - Disabled search button (~112-113): background `#E5E5E5` → `var(--color-secondary)`, text `#9A9A9A` → `var(--color-muted-foreground)`.
     - Secondary "Try again" button (~231): same pair as the disabled search button.
     - Preview card and auto-fill note background `#FFFFFF` → `var(--color-card)` (~157, 386).
     - Cover placeholder and mode-toggle track `#E5E5E5` → `var(--color-secondary)` (~172, 343).
     - Active toggle segment: background `#FFFFFF` → `var(--color-card)`, text `#1A1A1A` → `var(--color-foreground)`. Inactive text `#9A9A9A` → `var(--color-muted-foreground)` (~358-359).
     - Preview title and track titles `#1A1A1A` → `var(--color-foreground)` (~185, 207).
     - Remaining `#9A9A9A` text (labels, subtext, track numbers, icon: ~33, 181, 188, 191, 200, 206, 389, 431) → `var(--color-muted-foreground)`.
   - Preserve: all sizes, radii, shadows, error `oklch(55% 0.18 25)`, `rgba(0,0,0,…)` shadows, and the `0.05` divider.
   - Verify: `grep -nE "#[0-9A-Fa-f]{3,8}\b" src/pages/AddRecord.jsx` returns nothing.
2. `src/components/forms/ImageUpload.jsx`
   - Change: drag border `2px solid #1A1A1A` → `2px solid var(--color-primary)` (line 78). Empty-state background `#FFFFFF` → `var(--color-card)` (line 80).
   - Preserve: dashed `rgba(0,0,0,0.15)` border, shadows, hover overlay.
   - Verify: no `#` hex left in the file.

## Scope

- Inherit: Add, Edit and Auto-fill preview states.
- Verify: `TrackListEditor` (already tokenized except a neutral shadow) inside the form in Night theme.
- Exclude: shadows and `rgba` values (no shadow tokens exist), the destructive color, the `AlbumDetail` vinyl SVG hex (intentional disc art), and `Button.jsx` adoption.

## Validation

- Product: add an album via auto-fill and via manual entry, then edit it. Both complete as before.
- Interface: `/add` (autofill, preview, manual) and `/album/:id/edit` in Day and Night at 375px and desktop width. Day is visually unchanged. In Night, buttons, cards, toggle and cover picker use dark surfaces with legible text.
- System: no new hex or parallel color constants introduced.
- Repository: `npm run build` → succeeds.

## Stop conditions

- Stop if any token's `html.dark` value yields unreadable contrast for a role above. Report it rather than inventing a color.

## Design documentation

- After acceptance: none required.
