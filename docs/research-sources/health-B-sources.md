# Health batch B: sources fetched on 2026-10-02

Method notes:
- PubMed pages return a cookie/bot wall to automated fetches, so each abstract was retrieved from NCBI's official E-utilities API (`eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=<PMID>`). It is the same PubMed record as the cited `pubmed.ncbi.nlm.nih.gov/<PMID>/` URL.
- NSF listing-detail pages load product details with JavaScript. Certification was confirmed from the NSF Certified for Sport results page, which lists each product name with its listing-detail ID: https://www.nsfsport.com/certified-products/search-results.php?search=vitamin%20d
- quality-supplements.org and usp.org (USP Verified) returned 403, so no USP-only products were included.

## Shared sources

| URL | Supports |
|---|---|
| https://www.nsfsport.com/certified-products/search-results.php?search=vitamin%20d | dotFIT Vitamin D-3 (id 1221174), KLEAN-D 25 mcg (1,000) (id 1299220), Momentous Vitamin D3 2000IU (id 1671925) and Thorne D-5,000 (id 1221010) are on the NSF Certified for Sport list |
| https://www.nsfsport.com/our-mark.php | What the NSF mark means: label accuracy, no unsafe contaminants, 290 banned substances, GMP facility audited annually or twice a year |
| https://medlineplus.gov/ency/article/002405.htm | Adult RDA 600 IU (19-70) and 800 IU (70+); adult upper limit 4,000 IU; toxicity mostly from supplements; high blood calcium effects |
| https://pubmed.ncbi.nlm.nih.gov/30415629/ | VITAL: 2,000 IU D3 did not lower cancer or major CV events; 25,871 participants; no excess hypercalcemia |
| https://pubmed.ncbi.nlm.nih.gov/35939577/ | VITAL fractures: no significant reduction in total, nonvertebral or hip fractures |
| https://pubmed.ncbi.nlm.nih.gov/22552031/ | D3 vs D2 meta-analysis: D3 raised 25(OH)D more, mostly with bolus doses; no difference with daily dosing |
| https://odphp.health.gov/sites/default/files/2019-09/PAG_ExecutiveSummary.pdf | Adult guidelines: 150-300 min moderate or 75-150 min vigorous a week; strength work 2+ days |
| https://pubmed.ncbi.nlm.nih.gov/30888321/ | Romeo 2019: activity apps gave a non-significant +477 steps/day; strongest under 3 months |
| https://pubmed.ncbi.nlm.nih.gov/35228201/ | Momma 2022: strength activity linked to 10-17% lower mortality and disease risk; peak at 30-60 min/week (cohort data) |
| https://988lifeline.org/ | Call, text or chat 988; free, confidential, 24/7/365 |
| https://pubmed.ncbi.nlm.nih.gov/29215315/ | Carlbring 2018: guided internet CBT equal to face-to-face CBT across 20 trials (g = 0.05) |
| https://pubmed.ncbi.nlm.nih.gov/38056219/ | Linardon 2024: mindfulness apps, 45 RCTs, depression g = 0.24, anxiety g = 0.28; no advantage over active therapies |

## Nutrition & Supplements (vitamin D)

**dotFIT Vitamin D-3 1,000 IU**
- https://www.dotfit.com/vitamin-d3 : 1,000 IU (25 mcg), 100 softgels, $8.95, Subscribe & Save 20% off, safflower oil and gelatin softgel, NSF claim, HSA/FSA, no return terms on page
- NSF listing id 1221174 (see shared)

**Klean Athlete Klean-D 1000**
- https://www.kleanathlete.com/klean-d-1000.html (read in Chrome; WebFetch and curl got 403): 25 mcg (1,000 IU) D3, 100 tablets, $14.00, other ingredients, vegetarian / gluten free / GMO free, "log in to add to cart", training and recovery marketing copy, no return terms
- NSF listing id 1299220

**Momentous Vitamin D3 2000 IU**
- https://www.livemomentous.com/products/vitamin-d3-2000-iu : 2,000 IU (50 mcg), 60 softgels, $19.99 one-time, $14.99 Subscribe & Save (25% off), plant-based cholecalciferol in organic olive oil, vegan, NSF Certified for Sport, money-back guarantee, can be taken without food, immune/inflammation claims
- NSF listing id 1671925

**Thorne Vitamin D-5,000**
- https://www.thorne.com/products/dp/d-5-000-vitamin-d-capsule : 125 mcg (5,000 IU), 60 capsules, $20, other ingredients, NSF Certified for Sport, gluten/dairy/soy free
- https://www.thorne.com/products/dp/d-5-000-120 : 120 capsules, $39
- https://www.thorne.com/faqs/returns-and-exchanges : returns within 60 days; approved returns have a 25% restocking fee
- NSF listing id 1221010

## Fitness

**Nike Training Club**
- https://www.nike.com/ntc-app : free app; HIIT, yoga, bodyweight; programs with nutrition, recovery, mindset tips; scheduling, casting; iPhone and Android; no paid tier mentioned

**Apple Fitness+**
- https://www.apple.com/apple-fitness-plus/ : $9.99/month, $79.99/year, 1-month trial (3 months with eligible device), 12 workout types plus meditation, 5-45 min, iPhone 8+ / iOS 16.1+ or Apple Watch, Family Sharing with up to 5, metrics from Watch/AirPods Pro 3/HR monitors, Apple One bundle

**Fitbod**
- https://fitbod.me/faqs/ : $15.99/month, $95.99/year, 7-day trial, HSA/FSA with Letter of Medical Necessity, adaptive workouts, equipment options, cancellation steps (active to end of cycle), iOS/Android/web, integrations

**Peloton App**
- https://www.onepeloton.com/app (WebFetch plus the raw page source via curl): 30-day free trial, credit card required; App One $12.99/mo ($15.99 via Apple App Store) or $129/year (save $26); App+ $28.99/mo or $289/year (save $58); one disclaimer still says App+ is $24/mo; App One includes 3 equipment cardio classes a month; App+ unlimited cardio on any bike/treadmill/rower; some promotions need non-refundable upfront payment for 3 months

## Mental Wellness

**Headspace**
- https://apps.apple.com/us/app/headspace-sleep-meditation/id493145008 : in-app purchases $12.99 monthly, $69.99 annual, Headspace Plus $94.99
- https://www.headspace.com/subscriptions : free trial, annual auto-renews, cancel anytime, student and family plans
- https://www.headspace.com/ : offers online therapy that accepts insurance
- https://pubmed.ncbi.nlm.nih.gov/30596696/ : Champion 2018 pilot RCT, Headspace improved life satisfaction, stress, resilience vs wait-list; author employed by Headspace
- https://pubmed.ncbi.nlm.nih.gov/30294390/ : Economides 2018 RCT vs audiobook control; d about 0.44-0.47; authors employed by Headspace
- Linardon 2024, 988 (shared)

**Talkspace**
- https://www.talkspace.com/ (WebFetch and curl): "most insured members have a $0 copay" and "copay (typically $15)"; out of pocket from $69/week; insurers incl. Aetna, Cigna, Optum, Anthem, TRICARE, Medicare; 5,600+ licensed providers; licensed in your state; psychiatry and medication management; unlimited messaging "may vary by insurance coverage"; employer/EAP coverage; "If you are in a life threatening situation - don't use this site. Call 988"
- https://pubmed.ncbi.nlm.nih.gov/37384392/ : Song 2023 RCT (n=83), messaging noninferior to video; Talkspace employee authors
- https://pubmed.ncbi.nlm.nih.gov/39026468/ : Arean 2024 SMART trial (n=215) on Talkspace, no differences, no adverse events
- Carlbring 2018, 988 (shared)

**Calm**
- https://apps.apple.com/us/app/calm/id571800810 : Calm Premium in-app prices $14.99, $16.99, $29.99, $69.99, $79.99
- https://www.calm.com/ : platforms (iOS, Android, web, Apple TV, Apple Watch, Wear OS, Samsung Health); cancel trial or auto-renewal any time, with steps
- https://pubmed.ncbi.nlm.nih.gov/31237569/ : Huberty 2019 RCT (n=88), reduced stress, better mindfulness and self-compassion vs wait-list; lead author later Calm Director of Science
- Linardon 2024, 988 (shared)

**BetterHelp**
- https://www.betterhelp.com/faq/ : four contact modes; therapist credentials; cancel any time; not for urgent crisis or emergency (this page showed UK pricing, GBP 35-75/week, to our UK fetch location, so it was not used for US price)
- https://www.betterhelp.com/insurance/ : $70-100/week without insurance; avg $23 copay; one covered live session per week; does not directly accept Medicaid, Medicare or TRICARE; features limited with insurance
- https://www.betterhelp.com/online-therapy/ : $70-100/week; HSA/FSA for individual and teen therapy
- https://www.betterhelp.com/advice/general/how-much-does-better-help-cost-what-to-know-before-signing-up/ : $70-100/week billed every four weeks; price varies by location, referral source, preferences, promotions
- https://www.ftc.gov/news-events/news/press-releases/2023/03/ftc-ban-betterhelp-revealing-consumers-data-including-sensitive-mental-health-information-facebook : $7.8M refunds, ban on sharing health data for ads, March 2, 2023
- https://pubmed.ncbi.nlm.nih.gov/30674448/ : Marcelle 2019 observational study (n=318), no control, BetterHelp-linked authors
- Carlbring 2018, 988 (shared)

## Considered and left out
- Nordic Naturals Vitamin D3 Gummies Sport: on the NSF list, but nordic.com returned 403, so price and label were not confirmed on an official page.
- Nature Made Vitamin D3 (USP Verified): could not reach USP's own listing (403).
- Designs for Sport Vitamin D3 Pro and OIAM: these combine D3 with vitamin K, so they are not single-ingredient D3.
- NIH ODS vitamin D fact sheet and CDC activity pages returned 403. MedlinePlus and the ODPHP guideline PDF were used in their place.
