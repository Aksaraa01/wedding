export type HintMap = Record<string, Record<string, { id?: string; en?: string }>>

export const HINTS: HintMap = {
  "ivory-lace": {
    cover_apology: { en: "If a name or title has slipped our pen, we ask your understanding." },
    gallery_quote: { en: "Every love story is beautiful; ours is the one we would choose again." },
    video_intro: { en: "Our day, filmed from the first look to the last dance." },
    video_caption: { en: "A film of the day, from first look to last dance." },
    inviting_intro: { en: "Beside us stand the families whose love made this day possible." },
    gallery_intro: { en: "A few quiet frames, kept from the years that brought us here." },
    profiles_intro: { en: "Two families, two homes, and one day we will remember for the rest of our lives." },
    events_intro: { en: "We would be honoured to have you with us as we exchange our vows." },
  },
  "embroidered-garden": {
    cover_apology: { en: "Should any name or title be miswritten, please forgive the oversight." },
    story_intro: { en: "Each season we shared became a thread, and this is the pattern we finish together." },
    welcome_message: { en: "It fills us with joy to have you here, among the people we love most." },
    video_intro: { en: "The hours of our wedding, kept in motion for you." },
    events_intro: { en: "Join us as we exchange vows in the garden of our families." },
    closing_message: { en: "Thank you for stitching your prayers into our day." },
  },
  "imagine": {
    cover_apology: { en: "If we have misspelled your name or title, kindly forgive us." },
    wishes_intro: { en: "Leave a wish here and let it rest beside ours." },
  },
  "love-line": {
    cover_apology: { en: "Any slip in a name or title is ours alone — please forgive it." },
  },
  "fresco": {
    cover_apology: { en: "We ask your pardon for any name or title printed imperfectly." },
  },
  "n-film": {
    cover_apology: { en: "If a credit is misspelled, forgive the error — it is ours." },
    closing_message: { en: "Thank you for watching our story; your presence is in every frame." },
  },
  "cinnabar-seal": {
    cover_apology: { en: "For any name or title written imperfectly, we ask your pardon." },
    story_intro: { en: "Every quiet chapter we lived through has led us here." },
    inviting_intro: { en: "We also name the families who walk with us into this day." },
    rundown_intro: { en: "Here is how our celebration will unfold." },
    gallery_intro: { en: "Moments we have gathered, held still for you to see." },
    video_intro: { en: "A short film of the days leading to our vows." },
    gift_intro_description: { en: "Your prayers are gift enough; if you wish to give more, the details follow." },
    wishes_intro: { en: "Write your wishes for us; we will keep every word." },
    closing_message: { en: "With full hearts, thank you for standing with us." },
    dresscode_intro: { en: "Dress in our palette if you wish — it would delight us." },
  },
  "majestic": {
    cover_apology: { en: "Should a name or title be imperfect, we beg your indulgence." },
    story_intro: { en: "The little chapters of our years together brought us to this day." },
    inviting_intro: { en: "With them beside us, we extend this invitation to you." },
    rundown_intro: { en: "The order of our day, from first greeting to last farewell." },
    gallery_intro: { en: "Scenes from our life together, gathered in one place." },
    video_intro: { en: "Moving pictures from the season before our wedding." },
    gift_intro_description: { en: "Nothing more is asked of you — but should you wish, here is how." },
    closing_message: { en: "It is an honour to have shared this day with you; thank you." },
  },
  "lace": {
    story_intro: { en: "Each season we shared became a page, and this is the chapter we write together." },
    inviting_intro: { en: "Alongside us stand the families whose love made this day possible." },
    gallery_intro: { en: "Frames from the seasons before us, kept in the quiet of the album." },
    profiles_intro: { en: "Two families, two homes, and a day we will carry for the rest of our lives." },
    events_intro: { en: "We would be honoured to have you beside us as we speak our vows." },
    welcome_message: { en: "How happy we are to have you with us today, among those we love." },
    video_intro: { en: "A film of the day itself, from morning to the final song." },
    video_caption: { en: "The day itself, filmed from first look to last dance." },
  },
  "iris": {
    story_intro: { en: "Small moments, kept one by one, carried us to this day." },
  },
  "boarding-pass": {
    inviting_intro: { en: "These are the families travelling with us on this journey." },
    gift_intro_description: { en: "Your company is the gift; anything more can travel via the details below." },
    dresscode_intro: { en: "Dress in our colours if you can — your presence matters most." },
    closing_message: { en: "Thank you for travelling with us to this day." },
  },
  "songket-marun": {
    gift_intro_description: { en: "Your blessing is sufficient; a tanda kasih may follow the details below." },
    closing_message: { en: "Thank you for weaving your blessings into our day." },
  },
  "ubin-ottoman": {
    gift_intro_description: { en: "Your presence honours us; if you wish to send something, see below." },
    wishes_intro: { en: "Leave a blessing in this guestbook for the life we begin." },
    closing_message: { en: "Thank you for adding your blessing to our mosaic." },
  },
  "lentera-zamrud": {
    gift_intro_description: { en: "Your prayers suffice; gifts may be sent through the details below." },
    closing_message: { en: "Thank you for carrying a light into our celebration." },
    countdown_intro: { en: "Counting the days until we celebrate with you." },
    opening_salam: { en: "May peace be with you" },
  },
  "silver-gelatin": {
    parents_label: { en: "With their parents" },
  },
  "dark-split-rail": {
    gift_intro_title: { en: "A Gift of Love" },
  },
}
