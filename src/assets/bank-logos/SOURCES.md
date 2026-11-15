# Bank and e-wallet logo sources

File names match the `key` values in `src/sections/accounts/bankCardDesigns.ts`.
The logos are trademarks of their owners and are used here only to identify each account's provider.
Files are unmodified downloads, except for root `viewBox` edits: `bdo.svg` gained
`viewBox="0 0 415.4375 145.15625"`, and `bpi.svg` was tightened to its measured content
bounds (`99 174 596 263`). No paths or colors were changed.

| key | file | source | type | notes |
|---|---|---|---|---|
| bdo | bdo.svg | https://commons.wikimedia.org/wiki/File:BDO_Unibank_(logo).svg | commons | Root has width/height but no viewBox. |
| bpi | bpi.svg | https://commons.wikimedia.org/wiki/File:Official_BPI_Logo.svg | commons | viewBox 792x612 has large padding, so the mark renders small. |
| metrobank | metrobank.svg | https://en.wikipedia.org/wiki/File:Metropolitan_Bank_and_Trust_Company.svg | wikipedia (non-free) | Current wordmark with building icon. metrobank.com.ph serves PNG only. |
| unionbank | unionbank.svg | https://commons.wikimedia.org/wiki/File:UnionBank_PH_logo.svg | commons | |
| securitybank | securitybank.svg | https://commons.wikimedia.org/wiki/File:Security_Bank_logo.svg | commons | |
| pnb | pnb.svg | https://commons.wikimedia.org/wiki/File:Philippine-National-Bank-logo.svg | commons | |
| landbank | landbank.png | https://www.landbank.com/assets/landbank-logo.png | official (site header) | Current flat green `#74BC44` logo. PNG (241×38) because Landbank publishes no vector file and Commons only has the previous emblem. |
| maya | maya.svg | https://www.maya.ph/hubfs/Maya/MAYA-Mint%20Green.svg | official (site header) | Current mint green `#2FF19E` (the Commons file had the older `#75EEA5`); rendered on a dark chip in the picker. |
| gotyme | gotyme.svg | https://www.gotyme.com.ph/static-assets/images/gotymebank-logo-primary-white.svg | official (site header) | Official logo is single-color (white or near-black, no blue). White version, rendered on a dark chip in the picker. |
| maribank | maribank.svg | https://banking-aka-storage.maribank.com.sg/maribank/sg/app_infra/live/ccf/logo/logo_text.svg | official (maribank.sg) | maribank.com.ph showed a bot check; same brand mark. |
| tonik | tonik.svg | https://tonikbank.com/themes/tonikbankv1/logo.svg | official | |
| cimb | cimb.svg | https://www.cimbbank.com.ph/content/dam/cimbph/images/global/logo-cimb-islamic.svg | official (site header) | White "CIMB BANK" text; invisible on light surfaces. Commons file rejected (embedded PNGs). |
| gcash | gcash.svg | https://commons.wikimedia.org/wiki/File:GCash_logo.svg | commons | |
| grabpay | grabpay.svg | https://commons.wikimedia.org/wiki/File:Grab_Logo.svg | commons (fallback) | Grab parent wordmark; no GrabPay-specific SVG found. |
| paypal | paypal.svg | https://commons.wikimedia.org/wiki/File:PayPal_2024.svg | commons | Black 2024 wordmark; low contrast on dark surfaces. |
| wise | wise.svg | https://wise.com/ph/ (header logo, inline SVG) | official (site header) | Current Forest Green `#163300` logo; the fill was a CSS variable and is written as its resolved value. Extra: Wise has no entry in `bankCardDesigns` yet. |
| uno | — | MISSING | — | uno.bank and unobank.asia return 403 to automation; no Commons or Wikipedia file. |
