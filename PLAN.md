# Feature Implementation Plan

**Overall Progress:** `0%`

## TLDR
Fix ACT-40: Source context text on flashcard back face gets clipped with no way to scroll. Add a ScrollView around the source context content so users can scroll through long text, without changing any existing dimensions or layout.

## Critical Decisions
- **Inner scroll only**: Only the source context content scrolls — answer + mnemonic stay fixed and always visible
- **Keep LayoutAnimation**: The expand/collapse animation stays as-is
- **Minimal touch**: Only modify the source context rendering block in `recall.tsx` — no changes to `FlipCard.tsx`
- **nestedScrollEnabled**: Required since this ScrollView will be nested inside FlipCard's existing ScrollView

## Tasks:

- [ ] 🟥 **Step 1: Add ScrollView to source context content**
  - [ ] 🟥 Wrap `MarkdownText` in `sourceContextContent` (recall.tsx:819-834) with a `ScrollView`
  - [ ] 🟥 Set `maxHeight` on the ScrollView to cap the visible area
  - [ ] 🟥 Add `nestedScrollEnabled` for iOS nested scroll support

- [ ] 🟥 **Step 2: Verify on iOS**
  - [ ] 🟥 Test expand/collapse LayoutAnimation still works
  - [ ] 🟥 Test scrolling through long source context text
  - [ ] 🟥 Test that tapping the card still flips (scroll vs tap gesture doesn't conflict)
  - [ ] 🟥 Test with short source context (no scroll needed — should look identical to current)
