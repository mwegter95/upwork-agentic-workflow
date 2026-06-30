# Card Shopper — Upwork posting + notes

## Title
Building a marketplace website & app — "Card Shopper"
Posted 41 minutes ago. Only freelancers located in the U.S. may apply.

## Summary
Developer needed to build a trading card marketplace: map-based shop browsing,
value box flip experience, seller dashboard, Stripe subscriptions. Need an app and
website.

What it is: A curated online marketplace for trading card collectors (sports cards,
Pokemon, Magic: The Gathering). It recreates the feel of an in-person card show,
online.

## How it works for buyers
Buyers open the app to a US map showing verified card shops as pins, color-coded by
category. They tap a shop to open its profile, then browse inventory two ways: a
"flip through the box" experience where cards appear face-down and flip over one at
a time with a fan animation (just like digging through a bin at a real show), or a
standard grid view. Buyers can search by player, team, or set, filter by price and
category, save cards to a watchlist, message sellers directly, make an offer, or buy
instantly at the asking price.

## How it works for sellers
Sellers apply and are manually verified before they're allowed to list anything,
this is not an open marketplace, which protects buyer trust. Once approved, sellers
get a dashboard showing active listings, monthly sales total, open offers, and
follower count. They upload cards via a guided 4-step flow: take a photo, AI
auto-detects the player/set/year/grade (powered by the CollX API), the seller
reviews and sets a price (with a market price suggestion shown), then publishes,
either as a standalone listing or added to a value box. Sellers can also build "drop
announcements" with a title, date/time, and teaser description, which get pushed to
all their followers via in-app notification and email.

## The business model (key differentiator)
Sellers pay one flat monthly subscription fee. There are zero fees on individual
sales.

## Screens
- Home/Map screen: US map with shop pins, drop announcement banners, search,
  category tiles.
- Shop profile / Value Box flip screen: flip view + grid view, search, filters,
  offer/buy/message/save actions.
- Seller booth dashboard: stats, drop announcement builder with live preview,
  listings manager, AI-assisted upload flow.

## Tech stack requested
- Bubble.io for the core app (web + mobile-responsive, can be wrapped for App
  Store/Google Play later via Median.co)
- Stripe for subscription billing (NOT one-time payments, must be recurring)
- Google Maps or Mapbox plugin for the pin-based map
- Klaviyo or similar for email notifications

## Database needs (rough)
- Users (buyer/seller role distinction)
- Shops (linked to verified sellers, includes location, category, specialty)
- Listings (linked to shops, includes photos, player/set/year/grade, price,
  category, status)
- Value boxes (collections of listings grouped together for the flip browsing
  experience)
- Offers (linked to listings and buyers, status tracking: pending/accepted/declined)
- Messages (buyer-seller threads, linked to a specific listing)
- Drops (seller-created announcements with date/time/teaser, linked to followers for
  notifications)
- Follows (buyer following a shop relationship)
- Watchlist (buyer saved listings)

## Budget
$2,500 to $4,500 for MVP

## Timeline
6 to 10 weeks to launch

## Engagement type
Open to fixed price or hourly, prefer phased delivery so core features (accounts,
listings, map, Stripe) launch first and the flip animation/AI upload can follow
shortly after if needed to hit budget.

## What happens after this developer is hired
Plan is to get 10 to 20 founding sellers signed up before/at launch (a fee-savings
pitch document already exists for this outreach), validate the model, then reinvest
revenue into additional features (featured listings, promoted drops, native App
Store app).
