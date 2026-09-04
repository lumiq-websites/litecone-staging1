# LiteCone — repositioned site preview

A **review preview** of the repositioned LiteCone site (the `v4 Enterprise`
direction), published with GitHub Pages so it can be opened from anywhere
without an AWS or VPN login.

**Live preview:** https://lumiq-websites.github.io/litecone-staging1/

This is not the production site. `litecone.ai` remains canonical, and
`robots.txt` blocks indexing so this preview never competes with it in search.

The source of truth is the `Staging1` branch of the private
`lumiqai/litecone-website` repo. Changes are made there and copied here.

## What's here

23 pages plus a 404 — homepage, the nine AI Worker pages (LEO, ERIC, AURA,
ARIS, ALEX, RIO, ELSA, IRIS, MARC), four industry pages, Co-Decision, Know
LiteCone, Platform, Pricing, the workflow calculator, Company and Contact.

Dark and light themes with a toggle, the LiteCone type system (Gentium Plus /
Inter / IBM Plex Mono), wired lead forms, per-page SEO metadata and the
accessibility chrome. See `STAGING1.md` for the full build notes.

## Note on hosting

GitHub Pages serves static files only — it does not apply the security
headers or Content-Security-Policy defined in the `Staging1` branch's
`amplify.yml`. Those take effect when the site is deployed through Amplify.
