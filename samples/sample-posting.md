# Sample Upwork posting (golden test input)

Use this to dry-run the pipeline end to end before relying on it for a real job.
It is intentionally a realistic, mid-budget, frontend-friendly posting so the
demo can be built without backend work.

---

## Posting

**Title:** Build a simple booking + availability widget for my mobile dog-grooming business

**Budget:** $1,500 fixed
**Timeline:** 2 to 3 weeks

We run a mobile dog-grooming service (we drive a van to the customer). Right now
people text us to book and it is chaos. We double-book, we forget appointments,
and customers never know our real availability.

I want a clean, simple booking widget I can embed on our website (Squarespace).
Requirements:

1. Customers pick a service (bath, full groom, nail trim, or "the works") and see
   the price for each.
2. They pick a date and an available time slot. Slots we have already booked
   should not be selectable.
3. They enter their dog's name, breed, size (small / medium / large), their name,
   phone, and address.
4. Larger dogs and "the works" should take a longer time block, so the available
   slots should account for appointment length.
5. After booking, they see a clear confirmation with everything they entered.
6. It has to look professional and match a clean, friendly brand. Mobile-first,
   most of our customers book on their phones.

Nice to have: some kind of simple view for me to see the day's schedule.

Please show me something real, not just a mockup. I have been burned by
freelancers who talk a big game and never deliver. If you can show me you
actually understand the booking-length problem (point 4), you are ahead of
everyone else.

---

## Notes from Michael

- Frontend-only demo is fine for the proposal: mock the "already booked" slots
  with sample data, no real backend needed.
- Lean into requirement 4 (variable appointment length by dog size + service) as
  the hero feature, since the client explicitly said that is the differentiator.
- Keep it mobile-first and genuinely clickable. The "day schedule" view is a good
  cheap supporting feature.
- Brand it clean and friendly, but still use my site's design language so it
  clearly reads as my work.
