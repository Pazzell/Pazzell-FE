# QA checklist

A manual pass to run against a real backend before a release. Use three accounts (a freemium
player, a brand and an admin) plus Paystack in test mode. Check each flow once on a desktop
browser and once on a phone-sized screen (360px wide).

## Sign-in

- [ ] Register a player, enter the emailed code, land on the player home.
- [ ] Log in as a player, a brand and an admin; each lands on their own home.
- [ ] A player opening `/brand/...` or `/admin/...` is sent back to their own home.
- [ ] Leave a tab idle until the access token expires, then act: the request succeeds without a
      visible logout (cookie refresh), or the app returns to login if the session is truly over.

## Trivia (topics)

- [ ] The topic list loads; a topic with no cover shows the placeholder.
- [ ] Setup: the timer slider runs 1 to 7 seconds and remembers the last choice; the card
      slider respects the topic's minimum and maximum.
- [ ] Setup: the Practice toggle is off the first time and remembers the last choice.
- [ ] Start Quiz goes straight to the first question. There is no study screen.
- [ ] Practice on: a hand pointer marks the correct option on every question and a "Practice"
      badge shows. Tapping the pointed option gives confetti; tapping the other gives the red
      shake; letting the timer run out shows "Time is up!".
- [ ] Practice off: no pointer and no badge, on any question.
- [ ] The leave button abandons the session and returns to the topic list.
- [ ] Tapping an option answers straight away (there is no Submit button), and a second tap
      does nothing.
- [ ] An imported image card shows its picture credit in small text in the quiz.
- [ ] Correct, wrong and timeout each show the right feedback, then the next question.
- [ ] Refresh mid-quiz: the same question returns with less time, not a fresh clock, and the
      practice setting is unchanged.
- [ ] The browser back button does nothing mid-quiz.
- [ ] The mute button silences both sounds and stays muted after a reload.
- [ ] With the OS "reduce motion" setting on, there is no confetti, no shake and the pointer
      does not pulse; feedback is still clear.
- [ ] Result: score, Retry (a new card set from the same topic) and Pick Another Topic.

## Campaign gate and campaign play

- [ ] As a freemium player, complete trivias until the threshold (default 10) is reached. The
      next start shows the sponsored trivia instead of starting.
- [ ] The topic list shows the same prompt at the top.
- [ ] Play the sponsored trivia: brand name and logo on the quiz screen and the result.
- [ ] The brand link opens in a new tab; the brand's "Link clicks" number goes up.
- [ ] After completing it, normal trivias start again.
- [ ] A Pro player is never shown the prompt.

## Pro

- [ ] `/pro` shows the price and length configured by the admin.
- [ ] Upgrade → Paystack test payment → the return page confirms → `/pro` shows Pro with days
      left, and the header and home show Pro.
- [ ] Abandon a checkout part-way: returning to `/pro` allows a fresh attempt.
- [ ] Renewing while Pro adds the days on top of the current end date.
- [ ] With Pro ending within 5 days, or expired, the renewal notice shows.

## Custom trivia

- [ ] Create a quiz, add a text card and an image card, edit one, delete one.
- [ ] "Add many" adds several text cards; a bad line is rejected with its line number.
- [ ] An image over 5 MB or of the wrong type is rejected before upload.
- [ ] Publish is disabled below the minimum card count, and works at or above it.
- [ ] Copy and Share give the link. Open it in a private window: title and creator show, with
      no cards.
- [ ] Log in from that page (and separately, register from it): both return to the quiz.
- [ ] Play it as another player, then press Retry on the result.
- [ ] Test play from the builder returns to the builder, and the plays number does not go up.
- [ ] "New link" kills the old link; "Revoke link" unpublishes the quiz.
- [ ] As a freemium player with one quiz, New Quiz shows the upgrade prompt.
- [ ] After Pro expires, extra quizzes show as Locked and cannot be published.

## Brand

- [ ] Save the brand profile with a logo and a website; a non-http(s) website is rejected.
- [ ] Create a campaign: details → cards → review. Pay is disabled below the minimum cards.
- [ ] Test play from the review step returns to the campaign.
- [ ] Pay through Paystack test mode: the return page confirms and leads to the campaign's
      results, which show it live with the right end date.
- [ ] Start a checkout, come back, and use "Cancel and Edit": the campaign is a draft again.
- [ ] A live campaign cannot be edited; its cards are shown read-only.
- [ ] Results show plays, completions, average score and link clicks after some play.

## Admin

- [ ] Home: revenue totals match the payments made above; date range and filters work.
- [ ] Topics: create a topic with a cover, add cards, mark it inactive (it disappears for
      players), delete it.
- [ ] Import Image Cards from the topics list: pick a category and a count, wait for it to
      finish, and confirm the cards (with picture credits) are on the category's topic. Repeat
      from inside a topic, and for a people category with a country.
- [ ] Settings: change the Pro price; `/pro` shows the new price. The two timer limits are
      shown as fixed.
- [ ] Campaigns: pause a live campaign with a reason (players stop seeing it, the brand sees
      the reason), resume it, then take one down.

## Wallet

- [ ] Balance and history load; add a bank account; request a withdrawal.

## Everywhere

- [ ] At 360px wide: no sideways scrolling on any page (tables scroll inside their own box).
- [ ] Turn the network off and reload a page: an error with a retry button, not a blank screen.
- [ ] Keyboard only: every button and option can be reached and activated, and dialogs trap
      and return focus.
- [ ] No page mentions points, leaderboards, referrals, raffles or a forum.
