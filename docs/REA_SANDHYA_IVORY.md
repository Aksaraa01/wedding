# Sandhya Ivory

Sandhya Ivory is the bright ivory-and-sage sibling of the in-house `sandhya`
template. It is a separate template code and a separate component folder so the
existing dark Sandhya design remains unchanged for current couples.

## Design direction

- Warm ivory paper: `#F7F3EA`
- Soft white cards and inputs: `#FFFDF8`
- Deep sage-charcoal copy: `#2F3A31`
- Botanical sage accent: `#7C8D6D`
- Cormorant + Allura display/script, Inter body
- Full-bleed couple photography with layered ivory veils
- Translucent ivory scrim below the countdown, so Sandhya's YouTube background
  remains visible and playing through story, gallery, gift, wishes, and closing
- Dark lightbox and video modal for media focus

The two transparent baby's-breath illustrations are copied from Sandhya into
`public/templates/sandhya-ivory/`. The unused Sandhya background images and
2.2 MB parallax video are intentionally not copied.

## Section contract

| # | Section | Renders from | Gate + toggle | Count / variant branch | Copy source | Motion |
|---|---|---|---|---|---|---|
| 1 | Cover | names, date, guest, cover photo | always | one cover; photo falls back through shared helpers | profile fields; `cover_apology` | preloader → staggered cover reveal |
| 2 | Verse | `quote_text`, `quote_source`, hashtag | always when data exists | empty quote/source omitted independently | profile fields | scene camera + rise |
| 3 | Mempelai | groom/bride names, full names, parents, Instagram, portraits | always | two portrait steps; missing portrait falls back to the other/cover | profile fields | portrait pan + card reveal |
| 4 | Events | `sessions[]` | always | 0/1/many sessions; livestream is an extra final card | profile fields; `secLivestream` | event-card stagger |
| 5 | Livestream | `livestream.url` | `livestream_visible !== false` | one extra event card when URL exists | profile fields; `sandhyaLivestreamDescription` | same event-card motion |
| 6 | Dress code | `dresscode.colors[]` | `dresscode_visible !== false` | hidden when no colors | `dresscode_title`; generated palette sentence | rise + swatch reveal |
| 7 | Finale hero | countdown, calendar link, finale photo/video | always when date exists | date absent ⇒ zeroed countdown; calendar hidden without date | `countdown_title`, unit labels, `save_date_label` | finale dolly + rise |
| 8 | Opening | opening title/description, flower | always | empty profile values use bilingual defaults | profile fields; `opening_kicker` | IntersectionObserver rise |
| 9 | Love story | `stories[]` | `feature_gates.story !== false` and `story_visible !== false` | hidden when empty; alternating photo/text chapters | `love_story_title`; profile story data | clip-path photo + plate rise |
| 10 | Gallery | `gallery_photos[]` | always when photos or video exist | one photo ⇒ single row; >2 ⇒ reverse marquee; lightbox supports 1/many | `gallery_title`, `gallery_intro`, `gallery_quote` | marquee + IO reveal |
| 11 | Video | YouTube `video_url` | `feature_gates.video !== false` and `video_section_visible !== false` | YouTube only; hidden when no valid YouTube ID | `sandhyaWeddingFilm` | late-mounted YouTube player |
| 12 | Wedding gift | accounts + address | `gift_section_visible !== false`; address also needs `feature_gates.gift_address` | accounts only / address only / both; section hidden when empty | `gift_intro_title`, `gift_intro_description` | envelope reveal |
| 13 | Turut mengundang | `inviting_families[]` | `feature_gates.inviting_families !== false` and `inviting_families_visible !== false` | hidden when empty | `inviting_title`; profile list | IO rise |
| 14 | Wishes | name/message form + approved feed | always | demo feed for `demo-wedding-profile-id`; 10/page | `wishes_title`, `wishes_intro`; shared i18n | IO rise |
| 15 | Closing | portrait, flowers, names, message | always | cover/portrait fallback chain | `closing_message`; profile names | framed portrait reveal |
| 16 | Footer | Aksaraa badge + WhatsApp CTA | always | static brand chrome | shared i18n | IO rise |

## Final order

Cover → Verse → Mempelai → Events/Livestream → Dress code → Finale hero →
Opening → Love story → Gallery/Video → Gift → Turut Mengundang → Wishes →
Closing → Footer.

## Approved inherited deviations

The owner approved exact Sandhya feature parity for this visual sibling:

1. **No Rundown section.** The current Sandhya component does not render
   `profile.rundown`, so Ivory does not add a second content model or a divergent
   section order.
2. **YouTube-only video.** Direct MP4/WebM uploads are not rendered by Sandhya's
   current video path; Ivory intentionally matches that behavior.
3. **No runtime theme switcher.** Ivory is a fixed template code, not a skin
   selected inside Sandhya.

These deviations are recorded here rather than silently presented as full
current-contract support.

## Safety and accessibility

- RSVP/QR dock is suppressed when `preview_mode` or `template_demo` is true.
- Gift account copying uses `copyPlainText()` only.
- All guest-facing chrome is bilingual through `t()` / `tf()`.
- `prefers-reduced-motion` removes animation and keeps the ivory frame colors.
- `@media (scripting: none)` hides the preloader and forces reveal targets visible.
- Photo veils are tuned for dark sage text over both bright and low-key photos.
- Body scroll lock uses the independent `sandhya-ivory-active` class.
- Wishes input IDs use the `sandhya-ivory-wish-*` prefix.

## State matrix

- All gates false ⇒ only ungated sections render.
- All gates true / toggles on ⇒ full section order above.
- `sessions.length === 0|1|many` ⇒ no blank event cards.
- `stories = []` or hidden ⇒ no story shell.
- `gallery_photos.length === 0|1|many` ⇒ section hides or rows/marquee/lightbox behave.
- Gift accounts only / address only / none ⇒ correct tabs/content and no empty shell.
- Video hidden while URL exists ⇒ no autoplay/background player.
- `prefers-reduced-motion: reduce` ⇒ all copy visible, transforms disabled.
- `scripting: none` ⇒ preloader hidden, cover and finale content visible.
- 390×844 and 1440×900 ⇒ no horizontal overflow.
- `id` and `en` ⇒ no mixed-language chrome; couple-entered content stays unchanged.

## Registration

- Code: `sandhya-ivory`
- Name: `Sandhya Ivory`
- Category: `Elegant`
- Source type: `inhouse`
- Event type: `wedding`
- Cover slots: five, matching Sandhya
- Package eligibility: copied from Sandhya
- Migration: `supabase/migrations/20261126000000_sandhya_ivory.sql`
- Preview: `/templates/sandhya-ivory/preview`
- Thumbnail: `/templates/sandhya-ivory/thumbnail.webp`
