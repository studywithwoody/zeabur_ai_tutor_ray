# AP Macroeconomics knowledge graph — gaps report

Generated 2026-10-25 18:03 (Asia/Taipei). Source: Hsu Chun-Wei, Mankiw's *Principles of Economics* slides, Ch 23–33 (Drive folder "AP Macro", 22 PDFs; multi-part chapters are merged into one unit). Graph: `ap-macro.json`. It has 320 concept nodes, 11 unit nodes and 818 edges (101 of them cross-unit).

## 0. Chapters and AP Macro topics missing from the slide set

The folder covers Mankiw Ch 23–33. **Ch 34 (The Influence of Monetary and Fiscal Policy on Aggregate Demand), Ch 35 (The Short-Run Trade-off between Inflation and Unemployment) and Ch 36 are absent.** As a result, these AP Macro topics have no slides:

- **Fiscal policy and the multiplier.** "Fiscal policy" appears only as a bullet among AD shifters (`Chapter 33 Aggregate Demand and Aggregate Supply.pdf` p47) and as "unbalanced fiscal policy" (`Chapter 31 Open-Economy Macroeconomics.pdf` p31). The spending multiplier, tax multiplier, marginal propensity to consume and automatic stabilizers are never introduced.
- **The Phillips curve** (short-run and long-run, expectations, the natural-rate hypothesis). The word does not appear in any slide.
- **The money market / liquidity-preference theory.** The interest-rate effect (Ch 33 p37) says people hold less money and lend more, but money demand as a function of the interest rate and the Fed's interest-rate targeting are not modeled. Ch 30 models money demand only against the value of money (1/P) in the long run.
- **Monetary and fiscal policy effects on AD in the short run** (crowding out in the short run, monetary-policy transmission). Stabilization policy is mentioned in Ch 33 part 2 p13 only as a sketch.

## 1. Micro foundations used but never defined

Macro builds on micro tools that have no defining slide in this set. Following the build rules, these are **not** graph nodes; they are listed here for cross-linking to the AP Micro graph (`ap-micro.json`):

| Micro concept | Used in (file, page) | Slide wording |
|---|---|---|
| Supply and demand / market equilibrium | Chapter 23 Measuring a Nation’s Income.pdf p5; Chapter 26 … Financial System.pdf p17; Chapter 27 part 2.pdf p11; Chapter 30 Money Growth and Inflation.pdf p13; Chapter 32 A Macroeconomic Theory of the Open Economy.pdf p6 | “Tools such as supply and demand are important in both…”; “The model applies supply and demand analysis to an open economy.” |
| Shortage / surplus | Chapter 26 part 2.pdf p9 | “Shortage of loanable funds”, “Surplus of loanable funds” |
| Labor supply and labor demand | Chapter 28 Unemployment.pdf p33, p51 | “Labor supplied = Labor demanded”; “Firms demand fewer workers because labor is more expensive.” |
| Opportunity cost | Chapter 25 part 2.pdf p14 | “Like all investments, education has an opportunity cost.” |
| Public good (excludability/rivalry) | Chapter 25 part 2.pdf p28 | “Knowledge as a Public Good” (only the knowledge case; the general definition is not given) |
| Deadweight loss | Chapter 30 part 2.pdf p18 | “These behavioral changes can create deadweight losses.” |
| Cartel / antitrust | Chapter 28 part 2.pdf p8; Chapter 33 part 3.pdf p35 | “Most cartels are illegal under antitrust laws.”; “OPEC is a cartel of oil-producing countries.” |
| Market power | Chapter 28 part 2.pdf p12 | “unions can protect workers from firms’ market power.” |
| Perfect substitutes | Chapter 31 part 2.pdf p18 | “Goods Are Not Perfect Substitutes” |
| Specialization / gains from trade | Chapter 29 The Monetary System.pdf p5; Chapter 32 part 2.pdf p20 | “allowing people to specialize in what they do best”; “Trade restrictions interfere with gains from trade” |
| Incentives | Chapter 28 Unemployment.pdf p45 | “Incentive Effects of Unemployment Insurance” |
| Ten Principles of Economics (“People face trade-offs”) | Chapter 25 part 2.pdf p5 | “This illustrates one of the Ten Principles of Economics: People face…” |
| Infant-industry argument | Chapter 25 part 2.pdf p24 | “These policies are often justified by the infant-industry argument.” |

## 2. Concepts used in an earlier unit than the one that introduces them

This is an automatic scan of every slide *before* the concept's defining slide, in chapter order. Only uses in an earlier **unit** are listed.

| Concept | Introduced in | First earlier use | Quote | Chapters ahead |
|---|---|---|---|---|
| Recession and Depression | Chapter 33 Aggregate Demand and Aggregate Supply.pdf p4 (ch33) | Chapter 23 part 2.pdf p18 | “Case Study: Growth and Recessions” | 10 |
| Purchasing Power | Chapter 31 part 2.pdf p8 (ch31) | Chapter 24 Measuring the Cost of Living.pdf p20 | “A dollar today does not have the same purchasing power as a” | 7 |
| Tariff | Chapter 32 part 2.pdf p13 (ch32) | Chapter 25 part 2.pdf p24 | “Policies that restrict trade, such as tariffs and quotas, to protect” | 7 |
| Import Quota | Chapter 32 part 2.pdf p13 (ch32) | Chapter 25 part 2.pdf p24 | “Policies that restrict trade, such as tariffs and quotas, to protect” | 7 |
| Aggregate-Demand Curve | Chapter 33 Aggregate Demand and Aggregate Supply.pdf p32 (ch33) | Chapter 26 part 2.pdf p35 | “Reduced lending lowers investment and aggregate demand.” | 7 |
| Deflation | Chapter 30 Money Growth and Inflation.pdf p3 (ch30) | Chapter 24 Measuring the Cost of Living.pdf p31 | “Deflation: Purchasing power rises more than the interest rate.” | 6 |
| Stock | Chapter 26 Saving, Investment, and the Financial System.pdf p14 (ch26) | Chapter 23 Measuring a Nation’s Income.pdf p34 | “It does not mean buying financial assets such as stocks, bonds, or” | 3 |
| Bond | Chapter 26 Saving, Investment, and the Financial System.pdf p11 (ch26) | Chapter 23 Measuring a Nation’s Income.pdf p34 | “It does not mean buying financial assets such as stocks, bonds, or” | 3 |
| Interest Rate as Price of Loanable Funds | Chapter 26 part 2.pdf p6 (ch26) | Chapter 24 Measuring the Cost of Living.pdf p29 | “Real and Nominal Interest Rates” | 2 |

Notes:
- **Purchasing power** is used from Ch 24 (inflation adjustment, real interest rate) and in Ch 30, but its definition slide comes in Ch 31 part 2 p8 (PPP).
- **Tariffs and quotas** appear in Ch 25 part 2 p24 (inward-oriented policies) but are defined in Ch 32 part 2 p13.
- **Recession** and **aggregate demand** are used in Ch 23 and Ch 26 but are only formalized in Ch 33. This is expected for a survey course, but a forward pointer would help.
- Adverse selection, moral hazard and utility are defined in Ch 27 where they are first used, so they are not gaps.

## 3. Duplicated slides

- `Chapter 30 part 2.pdf` p4–p10 are identical (after whitespace normalization) to `Chapter 30 Money Growth and Inflation.pdf` p57–p63 (The Fisher Effect). Nodes cite the first occurrence.

## 4. Ordering conflicts in prerequisite edges

These are edges where the prerequisite is introduced *after* the concept that depends on it:

- Market Value (Chapter 23 Measuring a Nation’s Income.pdf p16) → Gross Domestic Product (GDP) (Chapter 23 Measuring a Nation’s Income.pdf p15)
- Final Goods (Chapter 23 Measuring a Nation’s Income.pdf p19) → Gross Domestic Product (GDP) (Chapter 23 Measuring a Nation’s Income.pdf p15)
- Current Production (Used Goods Excluded) (Chapter 23 Measuring a Nation’s Income.pdf p22) → Gross Domestic Product (GDP) (Chapter 23 Measuring a Nation’s Income.pdf p15)
- Production within a Country (Chapter 23 Measuring a Nation’s Income.pdf p23) → Gross Domestic Product (GDP) (Chapter 23 Measuring a Nation’s Income.pdf p15)
- GDP as a Flow over a Period of Time (Chapter 23 Measuring a Nation’s Income.pdf p24) → Gross Domestic Product (GDP) (Chapter 23 Measuring a Nation’s Income.pdf p15)
- Consumption (C) (Chapter 23 Measuring a Nation’s Income.pdf p31) → GDP Identity (Y = C + I + G + NX) (Chapter 23 Measuring a Nation’s Income.pdf p29)
- Investment (I) (Chapter 23 Measuring a Nation’s Income.pdf p32) → GDP Identity (Y = C + I + G + NX) (Chapter 23 Measuring a Nation’s Income.pdf p29)
- Government Purchases (G) (Chapter 23 Measuring a Nation’s Income.pdf p35) → GDP Identity (Y = C + I + G + NX) (Chapter 23 Measuring a Nation’s Income.pdf p29)
- Net Exports (NX) (Chapter 23 Measuring a Nation’s Income.pdf p37) → GDP Identity (Y = C + I + G + NX) (Chapter 23 Measuring a Nation’s Income.pdf p29)
- Base Year (Chapter 23 part 2.pdf p9) → Real GDP (Chapter 23 part 2.pdf p5)
- Physical Capital (Chapter 25 Production and Growth.pdf p17) → Determinants of Productivity (Chapter 25 Production and Growth.pdf p16)
- Natural Resources (Chapter 25 Production and Growth.pdf p21) → Determinants of Productivity (Chapter 25 Production and Growth.pdf p16)
- Technological Knowledge (Chapter 25 Production and Growth.pdf p23) → Determinants of Productivity (Chapter 25 Production and Growth.pdf p16)
- Human Capital (Chapter 25 Production and Growth.pdf p19) → Determinants of Productivity (Chapter 25 Production and Growth.pdf p16)
- Diminishing Marginal Utility (Chapter 27 The Basic Tools of Finance.pdf p31) → Risk Aversion (Chapter 27 The Basic Tools of Finance.pdf p29)
- Job Search (Chapter 28 Unemployment.pdf p37) → Frictional Unemployment (Chapter 28 Unemployment.pdf p34)
- Sectoral Shifts (Chapter 28 Unemployment.pdf p39) → Frictional Unemployment (Chapter 28 Unemployment.pdf p34)
- Duration of Unemployment (Chapter 28 Unemployment.pdf p32) → Natural Rate of Unemployment (Chapter 28 Unemployment.pdf p19)
- **[cross-unit]** Purchasing Power (Chapter 31 part 2.pdf p8) → Inflation Fallacy (Chapter 30 part 2.pdf p13)
- Purchasing Power (Chapter 31 part 2.pdf p8) → Purchasing-Power Parity (PPP) (Chapter 31 part 2.pdf p7)
- **[cross-unit]** Tariff (Chapter 32 part 2.pdf p13) → Inward- vs. Outward-Oriented Policies (Chapter 25 part 2.pdf p24)
- Natural Level of Output (Chapter 33 part 2.pdf p9) → Long-Run Aggregate-Supply Curve (LRAS) (Chapter 33 part 2.pdf p7)
- Expected Price Level and SRAS (Chapter 33 part 2.pdf p39) → Shifts in Short-Run Aggregate Supply (Chapter 33 part 2.pdf p37)

The within-lecture cases reflect normal presentation order (an example comes first, and the formal definition follows a few slides later). The 2 cross-unit case(s) are the forward uses described in §2. There are no prerequisite cycles.

## 5. Units with weak links

| Unit | Nodes | Internal edges | Cross in | Cross out | Cross edges / node | Linked units | Nodes with degree ≤ 1 |
|---|---|---|---|---|---|---|---|
| ch23 | 37 | 47 | 2 | 31 | 0.89 | ch24, ch25, ch26, ch28, ch30, ch31, ch33 | seasonal-adjustment, accounting-identity |
| ch24 | 14 | 17 | 5 | 9 | 1.0 | ch23, ch26, ch30, ch31, ch32 | ppi |
| ch25 | 29 | 38 | 5 | 6 | 0.38 | ch23, ch26, ch27, ch28, ch32, ch33 | capital-accumulation-tradeoff, saving-long-run-growth, catch-up-effect, health-and-nutrition, property-rights |
| ch26 | 36 | 51 | 11 | 14 | 0.69 | ch23, ch24, ch25, ch27, ch29, ch31, ch32, ch33 | debt-to-gdp |
| ch27 | 22 | 22 | 5 | 3 | 0.36 | ch25, ch26 | discounting, utility, informational-efficiency, market-irrationality |
| ch28 | 27 | 38 | 2 | 4 | 0.22 | ch23, ch25, ch33 | strike, right-to-work-laws, worker-health-theory, worker-turnover-theory, worker-effort-theory |
| ch29 | 40 | 52 | 2 | 8 | 0.25 | ch26, ch30, ch33 | barter, gold-standard, term-auction-facility, deposit-insurance |
| ch30 | 28 | 29 | 14 | 12 | 0.93 | ch23, ch24, ch29, ch31, ch33 | inflation-fallacy, capital-gain, inflation-confusion |
| ch31 | 24 | 23 | 11 | 13 | 1.0 | ch23, ch24, ch26, ch30, ch32, ch33 | exchange-rate-index, arbitrage |
| ch32 | 20 | 23 | 15 | 1 | 0.8 | ch24, ch25, ch26, ch31 | open-economy-model-assumptions |
| ch33 | 43 | 57 | 29 | 0 | 0.67 | ch23, ch25, ch26, ch28, ch29, ch30, ch31 | fluctuations-irregular |

Observations:

- **Ch 28 Unemployment** has 0.22 cross-unit edges per node (linked to ch23, ch25, ch33).
- **Ch 29 The Monetary System** has 0.25 cross-unit edges per node (linked to ch26, ch30, ch33).
- **Ch 27 The Basic Tools of Finance** has 0.36 cross-unit edges per node (linked to ch25, ch26).
- **Ch 28 Unemployment** hardly connects to the rest of the course: its natural rate feeds LRAS (Ch 33), but unions, efficiency wages and job search are self-contained. The short-run unemployment–inflation link would normally come from the Phillips curve (Ch 35, missing).
- **Ch 27 Basic Tools of Finance** has few cross-unit links (diversification ties back to mutual funds in Ch 26). On the slides, present value is not tied back to investment demand in the loanable-funds market (Ch 26) or to the interest-rate effect (Ch 33); the PV → investment-demand link is recorded as an inferred edge.
- **Ch 33** is the main sink. It draws on Ch 23 (GDP components), Ch 29–30 (money, neutrality), Ch 31 (exchange rates) and Ch 28 (natural rate), but nothing follows it because Ch 34–35 are missing.

## 6. Inferred edges needing teacher review

10 of 498 semantic edges are `inferred`. These are standard economics dependencies with no explicit slide statement nearby:

- Diminishing Returns to Capital —contrasts_with→ Capital Dilution
- Real Interest Rate —prerequisite→ Interest Rate as Price of Loanable Funds: the market sets the real interest rate
- Index Fund —applies_to→ Random Walk: EMH → passive index funds beat active managers
- Human Capital —prerequisite→ Worker Quality (Efficiency Wages): quality of the workforce
- Present Value and Investment Decisions —applies_to→ Demand for Loanable Funds: higher r lowers PV of projects, so less investment demand
- Risk–Return Trade-off —contrasts_with→ Bond Term and Credit Risk: riskier bonds/stocks pay higher returns
- Structural Unemployment —prerequisite→ Efficiency Wages
- Duration of Unemployment —prerequisite→ Natural Rate of Unemployment: long spells explain persistent unemployment
- Investment Incentives (Investment Tax Credit) —applies_to→ AD Shifts from Changes in Investment: investment tax credit shifts AD
- Cyclical Unemployment —applies_to→ Contraction in Aggregate Demand: recession raises cyclical unemployment

Also, the 488 grounded edges include 5 of kind `label_mention_nearby`. Their evidence is only that the other concept's name appears within ±4 slides, so it is weaker than `targeted_phrase`. Even `targeted_phrase` evidence can be generic (e.g. a slide title), so spot checks are advised.

## 7. Equations not verifiable in extracted slide text

44 nodes carry LaTeX equations. They were checked token-by-token against the extracted text of the cited slide and the next two slides (glyph-mapped; split fractions were checked in extraction order). 2 could not be verified and are flagged with `equations_verified_in_slide_text: false`:

- Constant Returns to Scale (Chapter 25 Production and Growth.pdf p27): `xY=A\,F(xL,xK,xH,xN)`, `\frac{Y}{L}=A\,F\!\left(1,\frac{K}{L},\frac{H}{L},\frac{N}{L}\right)`. The PDF text layer scrambles this formula's layout, so it was transcribed from the slide's structure and should be checked against the slide image.
- PPP and the Nominal Exchange Rate (Chapter 31 part 2.pdf p11): `\frac{1}{P}=\frac{e}{P^{*}}`, `e=\frac{P^{*}}{P}`. The PDF text layer scrambles this formula's layout, so it was transcribed from the slide's structure and should be checked against the slide image.

## 8. Title-only or figure-only slides

Some case-study and figure slides carry almost no extractable text, so concepts on them could not be grounded from text: e.g. `Chapter 23 part 2.pdf` p18 (Growth and Recessions), `Chapter 24 Measuring the Cost of Living.pdf` p33 (Interest Rates in the U.S. Economy), `Chapter 33 part 3.pdf` p23 (The World War II Boom), plus most graph slides (AD/AS, loanable funds and FX-market diagrams). Content shown only in figures is not represented in the graph.
