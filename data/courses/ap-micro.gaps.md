# AP Microeconomics knowledge graph — gaps report

Generated 2026-10-25 13:56 (Asia/Taipei). Source: Hsu Chun-Wei, Mankiw's *Principles of Economics* slides, July 2025 (Drive folder "AP Micro / PPT"). Graph: `ap-micro.json`. It has 257 concept nodes, 16 unit nodes and 658 edges (113 of them cross-unit).

## 0. Chapters missing from the slide set

The PPT folder covers Ch 3, 4, 5, 6, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 21, 22. **Ch 1 (Ten Principles), Ch 2 (Thinking Like an Economist), Ch 7 (Consumers, Producers, and the Efficiency of Markets), Ch 12, 19, 20 are absent.** Ideas those chapters would normally introduce are used without a definition slide:

- **Efficiency.** "efficient" / "inefficient" is used from Ch 3 p3 (`Chap 3.pdf`) and Ch 6 p9 ("free markets ration goods efficiently through prices"), but efficiency is never defined. In Mankiw this is Ch 7.
- **Willingness to pay and consumer/producer surplus.** These first appear in Ch 8 p8 (`Chap 8.pdf`, "Measures of economic welfare") and p14 ("The demand curve reflects buyers' willingness to pay"), compressed into the tax chapter. Ch 7 would normally build them first. Ch 9 (trade), Ch 10 (externalities) and Ch 15 (monopoly DWL) then depend on them.
- **Marginal thinking.** "marginal buyers and sellers" appears in Ch 8 p24, but marginal cost and marginal product are only defined in Ch 13 (p18, p28). "Rational people think at the margin" (Ch 1) is never stated.
- **Opportunity cost and trade-offs.** These are used on Ch 3 p3–p7 (the PPF) before the definition slide at Ch 3 p14. Ch 1 would normally cover them first.

## 1. Concepts used in an earlier unit than the one that introduces them

This is a scan of every slide *before* the concept's defining slide, with lectures in chapter order. Only uses in an earlier **unit** are listed. Lines that refer to a later chapter ("in Chapter …") are skipped.

| Concept | Introduced in | First earlier use | Quote | Units ahead |
|---|---|---|---|---|
| Collusion and Cartels | Chap 17.pdf p14 (ch17) | Chap 5 part 2.pdf p13 | “Key Insight: Cartel Power Weakens Over Time” | 10 |
| Advertising and Monopolistic Competition | Chap 16 part 2.pdf p4 (ch16) | Chap 4.pdf p18 | “bans on advertising aim to reduce the quantity demanded at every” | 10 |
| Price Taker | Chap 14.pdf p6 (ch14) | Chap 4.pdf p4 | “Participants are price takers.” | 8 |
| Economies and Diseconomies of Scale | Chap 13.pdf p42 (ch13) | Chap 9.pdf p51 | “Benefit 2: Lower Costs through Economies of Scale” | 3 |
| World Price | Chap 9.pdf p11 (ch09) | Chap 5 part 2.pdf p9 | “In the 1970s, OPEC members attempted to raise the world price of oil by” | 3 |
| Cost–Benefit Analysis | Chap 11.pdf p20 (ch11) | Chap 10.pdf p31 | “Cost-Benefit Tradeoff” | 1 |

Also noted by hand:
- **Market power** is used in Ch 9 p52 ("Free trade reduces the market power of protected domestic firms") and Ch 9 part 2 p6. It is only explained in Ch 14/15.
- **Cartel / OPEC.** OPEC's "Cartel Power" is analyzed in Ch 5 part 2 p9–p13 with elasticities, but cartels are defined in Ch 17 p14. Ch 17 p37 then revisits OPEC with the Prisoners' Dilemma. This is a good forward link, but students meet the term 12 chapters early.
- **Price taker / perfect competition.** "Participants are price takers" is stated in Ch 4 p4 and used again in Ch 9 p10 (small economy), but the competitive firm is only formalized in Ch 14 p6.

## 2. Ordering conflicts in prerequisite edges

These are edges where the prerequisite is introduced *after* the concept that depends on it. All of them are inside one lecture, and none crosses units:

- Opportunity Cost (Chap 3.pdf p14) → Production Possibilities Frontier (p5)
- Comparative Advantage (Chap 3.pdf p16) → Gains from Trade (p11)
- Law of Demand (Chap 4.pdf p8) → Demand Curve (p7)
- World Price (Chap 9.pdf p11) → Small Economy Assumption (Price Taker) (p10)
- Social Value (Chap 10.pdf p21) → Socially Optimal Quantity (p14)
- The Efficient Quantity (Chap 15 part 2.pdf p8) → Deadweight Loss of Monopoly (p7)
- Factors of Production (Chap 18.pdf p40) → Derived Demand (p4)

These reflect normal presentation order (an example comes first, and the formal definition follows a few slides later).

## 3. Units with weak links

| Unit | Nodes | Internal edges | Cross in | Cross out | Cross edges / node | Linked units | Nodes with degree ≤ 1 |
|---|---|---|---|---|---|---|---|
| ch03 | 8 | 10 | 0 | 8 | 1.0 | ch09, ch13, ch18, ch21 | absolute-advantage |
| ch04 | 28 | 38 | 1 | 38 | 1.39 | ch05, ch06, ch08, ch09, ch10, ch14, ch15, ch16, ch18, ch21 | market, determinants-of-supply |
| ch05 | 14 | 16 | 15 | 5 | 1.43 | ch04, ch06, ch08, ch13, ch14, ch15 | midpoint-method, variety-of-supply-curves |
| ch06 | 13 | 12 | 9 | 4 | 1.0 | ch04, ch05, ch08, ch09 | minimum-wage, payroll-tax, luxury-tax-case |
| ch08 | 13 | 15 | 7 | 8 | 1.15 | ch04, ch05, ch06, ch09, ch10, ch15 | deadweight-loss-labor-taxes, supply-side-economics |
| ch09 | 15 | 15 | 10 | 0 | 0.67 | ch03, ch04, ch06, ch08, ch13 | national-security-argument, infant-industry-argument, unfair-competition-argument, bargaining-chip-argument, trade-agreements-wto |
| ch10 | 15 | 19 | 3 | 6 | 0.6 | ch04, ch08, ch11, ch16, ch22 | transaction-costs |
| ch11 | 13 | 16 | 4 | 2 | 0.46 | ch10, ch17 | club-goods, important-public-goods, value-of-life, cow-not-extinct |
| ch13 | 18 | 21 | 4 | 15 | 1.06 | ch03, ch05, ch09, ch14, ch15, ch16, ch18 | cost-of-capital |
| ch14 | 17 | 17 | 12 | 13 | 1.47 | ch04, ch05, ch13, ch15, ch16, ch18 | sunk-costs, upward-sloping-lr-supply |
| ch15 | 25 | 24 | 12 | 6 | 0.72 | ch04, ch05, ch08, ch13, ch14, ch16, ch17 | monopoly-resources, monopoly-drugs-generics, arbitrage, imperfect-price-discrimination, price-discrimination-examples, average-cost-pricing, public-ownership |
| ch16 | 17 | 19 | 7 | 3 | 0.59 | ch04, ch10, ch13, ch14, ch15, ch17, ch22 | eyeglasses-case, brand-names |
| ch17 | 16 | 18 | 8 | 2 | 0.62 | ch11, ch15, ch16, ch22 | arms-race, predatory-pricing, microsoft-case |
| ch18 | 13 | 16 | 8 | 3 | 0.85 | ch03, ch04, ch13, ch14, ch21 | black-death-case |
| ch21 | 14 | 16 | 9 | 0 | 0.64 | ch03, ch04, ch18 | utility |
| ch22 | 18 | 16 | 4 | 0 | 0.22 | ch10, ch16, ch17 | screening, arrows-impossibility-theorem, median-voter-theorem, politicians-self-interest, default-options, left-digit-bias, time-inconsistency |

Observations:

- **Ch 22 Frontiers** is the weakest unit, with 0.22 cross-unit edges per node. Asymmetric information links only to signaling (advertising, Ch 16); political economy links only to market failure (Ch 10); behavioral economics links only to game theory (ultimatum game, Ch 17). In the graph, moral hazard, adverse selection and screening have no links to other units. The voting theorems (Condorcet, Arrow, median voter) and the behavioral topics (defaults, left-digit bias, time inconsistency) stand alone too. These are candidates for explicit back-references, e.g. adverse selection ↔ market failure (Ch 10), or median voter ↔ public goods (Ch 11).
- **Ch 11 Public Goods & Common Resources** (0.46) connects only to Ch 10 externalities and the Ch 17 common-resources game. Cost–benefit analysis and the value of life are not tied to consumer surplus (Ch 8).
- **Ch 16 Monopolistic Competition** (0.59) and **Ch 17 Oligopoly** (0.62) mostly consume ideas from Ch 13–15. Ch 17b's antitrust topics (resale price maintenance, predatory pricing, tying, Microsoft) are only loosely connected.
- **Ch 21 Consumer Choice** (0.64) and **Ch 9 International Trade** (0.67) have no outgoing cross-unit edges. Ch 21 derives the demand curve and Giffen goods, but those results are not fed back into Ch 4/5. Ch 9's protectionism arguments (p18–p36) are self-contained.
- **Ch 3** has no incoming links. Comparative advantage is reused in Ch 9, and opportunity cost in Ch 13, Ch 18 and Ch 21, but nothing earlier feeds Ch 3 because Ch 1–2 are missing.

## 4. Inferred edges needing teacher review

14 of 401 semantic edges are `inferred`. These are standard economics dependencies with no explicit slide statement nearby:

- Law of Demand —contrasts_with→ Law of Supply: demand slopes down, supply slopes up
- Three Steps to Analyzing Changes in Equilibrium —applies_to→ Simultaneous Shifts in Supply and Demand: apply the steps when both curves shift
- Shifts in Curves versus Movements along Curves —prerequisite→ Simultaneous Shifts in Supply and Demand
- Elasticity along a Linear Demand Curve —contrasts_with→ The Variety of Demand Curves: slope ≠ elasticity
- Elasticity and Tax Incidence —contrasts_with→ Determinants of the Deadweight Loss: elasticity decides who pays vs how much is lost
- Comparative Advantage —prerequisite→ World Price: world vs domestic price reveals comparative advantage
- Total Surplus —applies_to→ Gains and Losses of an Exporting Country: welfare changes measured with surplus
- Social Value —prerequisite→ Socially Optimal Quantity: optimum where social value = supply
- Corrective Taxes and Subsidies —contrasts_with→ Tradable Pollution Permits: price-based vs quantity-based
- Free-Rider Problem —contrasts_with→ Tragedy of the Commons: underprovision vs overuse
- Consumer Surplus —prerequisite→ Price Discrimination: willingness to pay differs across buyers
- Deadweight Loss of Monopoly —prerequisite→ Antitrust Laws: policy toward monopoly welfare cost
- Advertising as a Signal of Quality —contrasts_with→ Brand Names
- Long-Run Equilibrium in Monopolistic Competition —prerequisite→ Market Structures Compared

Also, 387 grounded edges include 12 of kind `label_mention_nearby`. Their evidence is only that the other concept's name appears within ±4 slides, so it is weaker than `targeted_phrase`.

## 5. Equations not verifiable in extracted slide text

None. All 50 nodes with equations have formulas that appear in the extracted slide text. They are written close to the slide wording, e.g. `Total Revenue = P × Q` or `Consumer Surplus = Value to buyers − Amount paid by buyers`. Glyphs were mapped from the PDF font encoding (e.g. “→=, ´→−, ě→≥).
