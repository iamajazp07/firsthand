# Travel reviews: sources fetched on 2026-10-02

All pages below were fetched this session (WebFetch, curl, or Chrome page text). Search-result snippets were used only to find URLs, never as a source for a claim.

## Shared: flights-airlines hub and all airline products
- https://www.transportation.gov/individuals/aviation-consumer-protection/refunds (Chrome): refund owed on cancellation or significant change if you decline alternatives; definition of significant change (3h domestic / 6h international, airport change, more connections, downgrade); refund within 7 business days (card) / 20 calendar days (other); bag fee refunds for lost or significantly delayed bags; credits offered in lieu of refunds valid at least 5 years; 24-hour cancel-or-hold rule for tickets bought 7+ days ahead, not applying to OTAs.
- https://www.ecfr.gov/api/renderer/v1/content/enhanced/current/title-14?part=260 (curl, 14 CFR Part 260): cross-check of "significantly delayed or changed flight" definition and prompt refund timing. Not cited in JSON (DOT page used instead).

## Southwest Airlines (southwest-airlines)
- https://www.southwest.com/fare-information/ : four fare types; Choice Extra / Choice Preferred fully refundable if cancelled 10+ min before departure; Choice and Basic cancel to credit; Choice-family Transferable Flight Credit 12 months; Basic credit 6 months; Basic no seat selection, changes only via upgrade; Choice Extra two free bags.
- https://www.southwest.com/html/customer-service/travel-fees.html : change fee $0, cancellation fee $0; bags $45/$55 (booked on/after Apr 9, 2026) and $35/$45 (before) for Basic, Choice, Choice Preferred; Choice Extra free; cardmember first bag free; A-List rules.
- Failed: https://www.southwest.com/help/changes-and-cancellations/change-and-cancellation-policy (404), /help/baggage/baggage-fees (404), support.southwest.com checked-baggage-policy (no amounts).

## Delta Air Lines (delta-air-lines)
- https://www.delta.com/us/en/baggage/overview (Chrome): domestic bags $45/$55 Main and Comfort; change/cancel fee table (Classic/Extra/Refundable free from US/Canada; Main Basic $99 North America, $199 long-haul, for Basic bought on/after Nov 6, 2025); Same-Day Confirmed $75 Classic; Same-Day Standby free (not Basic); free carry-on on Delta-operated flights.
- https://www.delta.com/us/en/change-cancel/cancel-flight : Basic cannot change/refund after Risk-Free Cancellation (conflicts with fee table, flagged as a con); eCredit expires 1 year from purchase; disruption eCredit 5 years; 24-hour Risk-Free Cancellation for delta.com / app bookings.

## Alaska Airlines (alaska-airlines)
- https://www.alaskaair.com/content/travel-info/optional-services-fees (Chrome, shadow DOM text): North America bags $45/$55 Main and Saver; Hawaii $30/$40; First Class 2 free bags up to 70 lbs; Atmos Visa free bag; change/cancel free on Main and First for tickets issued on/after May 25, 2025; same-day confirmed $75 Main/First, $115 Saver, free for Atmos Gold+ on Main/First; "no changes or cancellations are permitted for Saver fares" outside 24h and same-day policies.
- https://www.alaskaair.com/content/travel-info/flight-experience/saver : Saver no changes; 50% credit if cancelled 14+ days out (conflicts with fee page, flagged); seats at check-in; boarding group F; no standby; no Atmos points for Saver booked for travel after Jul 31, 2026.
- Failed: /content/travel-info/policies/change-cancellation (404), /content/about-us/customer-commitment/customer-commitment-flexibility (no policy text), /content/travel-info/fly-alaska/24-hour-cancellation (no text extracted).

## American Airlines (american-airlines)
- https://www.aa.com/i18n/customer-service/support/optional-service-fees.jsp (Chrome; redirects to /web/i18n/.../optional-service-fees.html): bags for tickets on/after May 18, 2026 $50 ($45 online) / $60 ($55 online), Basic +$5; voluntary change before day of travel $0 for travel beginning in North/South America, up to $400 elsewhere; Basic cancellation fees $99 / $129 / $199 for AAdvantage members; same-day change from $60; Business/First same-day $0.
- https://www.aa.com/i18n/travel-info/experience/seats/basic-economy.jsp (Chrome): Basic cannot be changed after 24h; AAdvantage cancel-for-credit conditions; no credit if fee exceeds fare; Basic boards last (typically Group 9).

## United Airlines and JetBlue: LEFT OUT
- united.com pages timed out in WebFetch and Chrome reading is not permitted on the domain; jetblue.com also not readable. Not included.

## World of Hyatt (world-of-hyatt)
- https://www.hyatt.com/help/terms/world-of-hyatt (Chrome, appendices expanded): terms effective Aug 24, 2026; Sept 9, 2026 update that the American Airlines relationship ends Nov 15, 2026; 24-month inactivity forfeiture; activity list incl. co-branded card; cancelled/no-show award does not count; 5 Base Points per eligible dollar (2.5 Hyatt Studios); Discoverist 10 nights / 25k, Explorist 30 / 50k, Globalist 60 / 100k; status through February of the second year; resort/destination fees are Eligible Incidental Charges.
- Failed: https://world.hyatt.com/content/gp/en/terms.html (404 / 403).

## Marriott Bonvoy (marriott-bonvoy)
- https://www.marriott.com/loyalty/terms/default.mi (WebFetch and Chrome): 24-month inactivity forfeiture (1.6.d); 10 base points per dollar most brands, 5 at named brands, 4 at StudioRes (2.1); resort charges, taxes, late cancel/no-show fees do not earn; Stay for 5, Pay for 4 (3.3.d); Free Night Awards excluded from it, standard rooms only, not combinable with cash; Platinum Elite 50-Night Annual Choice Benefit options; page text length about 236,000 characters.

## Hilton Honors (hilton-honors)
- https://www.hilton.com/en/hilton-honors/terms/ (Chrome): 24 consecutive month inactivity forfeiture; 5th Night Free on Standard Room Reward Stays listed under the Silver Elite Tier Status heading, up to 4 free nights per stay, forfeited if declined, cancelled or early checkout; 10 Base Points per dollar most brands, 5 at Homewood, Home2, Spark, Tru and others; deposit and cancellation restrictions vary by hotel; elite night rollover.

## IHG One Rewards (ihg-one-rewards)
- https://www.ihg.com/content/us/en/customer-care/member-tc (Chrome): Club points expire after 12 months with no earn/redeem; cardholder annual free night does not count; elite points do not expire while status kept; elite bonus 20/40/60/100%; Elite Qualifying Nights 10/20/40/70, points 40k/60k/120k; one night per day counts.
- https://www.ihg.com/content/us/en/customer-care/member-tc/2nd-page (Chrome): 10 points per dollar most hotels, 5 at Staybridge and Candlewood.
- Not used: the "4th night free for Chase cardmembers" rule appeared only in a search snippet, not on a fetched page, so it is not in the JSON.

## Chase Sapphire Preferred (chase-sapphire-preferred)
- https://creditcards.chase.com/rewards-credit-cards/sapphire/preferred (two WebFetch reads): $95 annual fee; no foreign transaction fees; 19.49% to 29.99% variable APR; 75,000 points after $5,000 in 3 months; 5x Chase Travel, 3x dining, 3x gas/EV/vacation homes, 2x other travel, 1x other; trip cancellation up to $10,000 per traveler; auto rental up to $60,000; baggage delay $100/day for 5 days; up to $100 hotel credit via Chase Travel; transfer partners incl. United, Southwest, British Airways, Marriott Bonvoy, IHG, World of Hyatt; no intro APR shown.

## Wells Fargo Autograph (wells-fargo-autograph)
- https://creditcards.wellsfargo.com/autograph-visa-credit-card/ (two WebFetch reads): no annual fee; no foreign transaction fee; 0% intro 12 months on purchases, then 18.74%/24.74%/28.74%; 20,000 points after $1,000 in 3 months; 3x categories; travel and transit definitions; cell phone protection $600, $25 deductible; points example at $0.01; BT/cash/late fees not shown, page points to Important Credit Terms.

## Bank of America Travel Rewards (bank-of-america-travel-rewards)
- https://www.bankofamerica.com/credit-cards/products/travel-rewards-credit-card/ : $0 annual fee; no foreign transaction fees; 0% for 15 billing cycles on purchases and BTs in first 60 days; 17.49% to 27.49% variable; BT fee 3% then 5%; 1.5 points per dollar; 25,000 points after $1,000 in 90 days (valued at $250); statement-credit redemption for travel and dining.

## Capital One VentureOne (capital-one-ventureone)
- https://www.capitalone.com/credit-cards/ventureone/ (two WebFetch reads): $0 annual fee; no foreign transaction fee; 1.25x; 5x hotels/vacation rentals/rental cars via Capital One Travel; 20,000 miles after $500 in 3 months; 0% intro 15 months purchases and BTs, then 18.49% to 28.49%; excellent credit; past-travel reimbursement within 90 days; BT fee amount not shown.

## Carnival Cruise Line (carnival-cruise-line)
- https://www.carnival.com/legal/ticket-contract (Chrome; redirects to https://www.carnival.com/about-carnival/legal-notice/ticket-contract): Section 7 cancellation schedule for 2-5 day and 6+ day cruises; whole-cabin rule; Early Saver deposit non-refundable, credit minus $50 per person.
- https://www.carnival.com/help?topicid=1202 : gratuities $17.00 standard / $19.00 suite per person per day; adjustable onboard, final after disembarkation.
- Failed: https://help.carnival.com/app/answers/detail/a_id/481/~/ (deposit page, no content extracted). Deposit amounts are therefore not stated.

## Disney Cruise Line (disney-cruise-line)
- https://disneycruise.disney.go.com/contracts-terms-safety/terms-conditions/united-states/ (two WebFetch reads): deposit set at booking; cancellation schedules for regular and suite/concierge staterooms, 1-5 and 6+ nights; restricted categories 100% non-refundable; fare inclusions/exclusions incl. gratuities excluded; right to change prices and terms without notice.

## Royal Caribbean (royal-caribbean)
- https://www.royalcaribbean.com/faq/questions/booking-cancellation-refund-policy : schedules for 1-4, 5-14, 15+ nights; non-refundable deposits held in full.
- https://www.royalcaribbean.com/faq/questions/onboard-service-gratuity-expense : $21.00 suites / $18.50 other per guest per day; 18% on beverages, specialty dining, room service, minibar; 20% spa/salon; adjustable before disembarkation.

## Celebrity Cruises (celebrity-cruises)
- https://www.celebritycruises.com/faqs/cancellation-policy : North American schedules by length, Galapagos schedule, non-refundable deposits never refunded and carry change fees.
- https://www.celebritycruises.com/faqs/all-included : All Included = Basic Wi-Fi + Classic Drink Package; drink gratuities included; staff tips excluded for packages bought after Oct 4, 2023; stateroom availability; Retreat includes Premium packages.

## Cruises hub
- https://www.cdc.gov/vessel-sanitation/about/index.html : VSP covers ships with 13+ passengers on foreign itineraries with U.S. ports; inspection scores and reports via the Inspection Query Tool.

## Cruise lines LEFT OUT
- Norwegian Cruise Line and Princess Cruises: ncl.com and princess.com served only UK-market terms (GBP deposits, UK schedules) to every fetch; the NCL U.S. ticket contract PDF (https://www.ncl.com/sites/default/files/NCL_Guest_Ticket_Contract_US_EN_April_2025.pdf, fetched) defers the cancellation schedule to the brochure. U.S. schedules could not be confirmed, so both were left out.
