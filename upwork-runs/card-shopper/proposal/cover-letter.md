Hi, and congrats on Card Shopper. The part of your vision that grabbed me is the value box: a buyer landing on a shop, flipping through face-down cards one at a time, feeling that same dig-through-the-bin rush they get at a real show. Pair that with a booth that charges sellers one flat monthly fee and zero per-sale fees, and you have a marketplace collectors will actually root for instead of resent.

So I built it. Here is a working, clickable prototype of the signature interactions you can try right now:

https://michaelwegter.com/work-samples/card-shopper

Click a color-coded pin on the US map, open a verified shop, and flip through the value box (the real 3D card flip, not a slideshow). Then hit the role toggle, step into the seller booth, run the 4-step AI-assisted upload, and see the flat-fee subscription panel. It is mock data standing in for the real services, but every flow works and your state survives a refresh, so you can feel the product before a single dollar of the build is spent.

I read the whole brief, including the model behind it. Card Shopper is not an open marketplace; it is curated, with manual seller verification as the trust gate, and your launch hinges on signing 10 to 20 founding sellers who are tired of giving away margin. The prototype makes that tangible: the verification gate blocks listing until a seller is approved, and the booth leads with the zero-fee math, because that is the pitch those founding sellers need to hear.

On the stack, I am with you on every call you named:

- Bubble.io for the core build, so you get a real visual platform you can iterate on without me as a permanent dependency.
- Stripe recurring subscriptions for the flat monthly seller fee, set up as true recurring billing, not one-time charges, with zero fees on individual sales.
- Google Maps or Mapbox for the pin-based map of verified shops.
- Klaviyo for the drop announcement emails that fan out to a shop's followers.
- CollX API for the photo-to-details auto-detection in the upload flow (player, set, year, grade), with a market-price suggestion the seller can accept or override.
- Median.co to wrap the responsive web app for the App Store and Google Play later, no rebuild.

I want to mirror the phasing you already laid out, because it is the right way to ship inside 2,500 to 4,500 and 6 to 10 weeks:

- Phase 1, the usable core: buyer and seller accounts, the seller application and manual verification gate, the map home with pins, banners, search, and category tiles, shop profiles with grid view and inventory search and filters, watchlist, messaging, offers, instant buy, follow, and the Stripe recurring flat-fee subscription. This is the core that proves the model and fits the budget.
- Phase 2, the signature and seller power as a fast-follow: the value-box flip, the 4-step CollX-assisted upload, the booth dashboard stats, and the drop builder with live preview and follower fan-out by in-app notification and Klaviyo email.
- Phase 3, later: the Median.co native wrap.

The reason I built the Phase 2 flip and AI upload into the prototype now is that those are the hardest pieces to picture and the easiest to get wrong, so de-risking them first is worth more to you than another static mockup.

A quick note on me: I am a US-based full-stack engineer with about two and a half years building a React, Python, and SQL platform for U.S. Bank that served 600 users a month, where I became the sole developer and the go-to person when something broke. I use AI-assisted development daily in real delivery, which is exactly the kind of speed this build rewards. I meet the US-only requirement.

If the prototype feels right, I would love a short call to walk the phased plan against your budget and lock Phase 1 scope. Whenever you are ready, I am here.

Michael
github.com/mwegter95
