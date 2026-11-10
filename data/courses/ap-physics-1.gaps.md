# AP Physics 1 knowledge graph — gaps report

Generated 2026-10-25 00:03 (Asia/Taipei). Source: Hsu Chun-Wei AP Physics 1 lecture PDFs (Drive folder "AP Physics 1"). Graph: `graph.json` — 180 concept nodes, 11 unit nodes, 479 edges (103 cross-unit).

## 1. Concepts used in an earlier lecture than the one that introduces them

Scan of every lecture page *before* the concept's defining slide (lectures in chapter order, ch01→ch11). Only uses in an earlier **unit** are listed.

| Concept | Introduced in | First earlier use | Quote | Units ahead |
|---|---|---|---|---|
| Pressure | Chapter 11 Fluids.pdf p11 (ch11) | Chapter 4 part2 Forces and Newton’s Laws of Motion.pdf p36 | “Physical picture: more pressure ⇒ more microscopic contacts ⇒” | 7 |
| Simple Pendulum | Chapter 10 part 2.pdf p22 (ch10) | Chapter 4 Forces and Newton’s Laws of Motion.pdf p9 | “pendulum inside the mechanism” | 6 |
| Tangential Speed and Angular Speed | Chapter 8 part1.pdf p43 (ch08) | Chapter 5 Uniform circular motion p56 | “The astronaut’s mass cancels out algebraically, and the required tangential” | 3 |
| Acceleration | Chapter 2 Kinematics in one dimension.pdf p12 (ch02) | Chapter 1 Introduction and Mathematical Concepts.pdf p9 | “starts from rest and accelerates to a speed v in a time t. Suppose we wish” | 1 |
| Work Done by a Constant Force | Chapter 6 work and energy p4 (ch06) | Chapter 5 Uniform circular motion p36 | “Interpretation: Although a larger-mass satellite requires more work to be” | 1 |

## 2. Ordering conflicts in prerequisite edges

Edges where the prerequisite is introduced *after* the concept that depends on it:

- **Pressure → Bulk Modulus** (cross-unit): bulk modulus (Ch 10, p35, `ΔV = −(V0/B)ΔP`) relies on pressure, which is only defined in Ch 11 part 1 p11. Biggest ordering gap — consider a one-slide preview of P = F/A in Ch 10.
- Within-lecture, adjacent-slide order (minor): Net Force used in Newton's First Law (ch04a p5 vs p6); Kinetic Energy defined (ch06a p19) after the Work–Energy Theorem slide (p17); Conservative Forces defined (p44) after Gravitational PE (p40); Lever Arm (ch09a p9) after Torque (p8); Coefficients of Friction (ch04 part2 p38) after Static Friction (p34). These are normal presentation order, listed for completeness.

## 3. Units with weak links

| Unit | Nodes | Internal edges | Cross in | Cross out | Cross edges / node | Linked units | Nodes with degree ≤ 1 |
|---|---|---|---|---|---|---|---|
| ch01 | 12 | 12 | 0 | 15 | 1.25 | ch02, ch03, ch04, ch06, ch07, ch08, ch10 | standard-prefixes, unit-vectors |
| ch02 | 14 | 16 | 3 | 21 | 1.71 | ch01, ch03, ch04, ch05, ch06, ch07, ch08, ch11 | average-speed, instantaneous-acceleration, acceleration-graphically |
| ch03 | 9 | 8 | 10 | 0 | 1.11 | ch01, ch02 | independence-of-motion |
| ch04 | 26 | 36 | 9 | 29 | 1.46 | ch01, ch02, ch05, ch06, ch07, ch09, ch10, ch11 | fictitious-forces, fundamental-forces |
| ch05 | 10 | 9 | 8 | 5 | 1.3 | ch02, ch04, ch08, ch09, ch10 | gps, synchronous-satellites |
| ch06 | 14 | 19 | 9 | 12 | 1.5 | ch01, ch02, ch04, ch07, ch09, ch10, ch11 | units-of-power, energy-transformation |
| ch07 | 12 | 13 | 7 | 4 | 0.92 | ch01, ch02, ch04, ch06, ch09 | momentum-strategy |
| ch08 | 15 | 15 | 10 | 8 | 1.2 | ch01, ch02, ch05, ch09, ch10 | rolling-motion |
| ch09 | 20 | 18 | 19 | 7 | 1.3 | ch04, ch05, ch06, ch07, ch08, ch10 | rigid-body-motion, lever-arm, finding-center-of-gravity, moments-of-inertia-table |
| ch10 | 27 | 25 | 20 | 0 | 0.74 | ch01, ch04, ch05, ch06, ch08, ch09, ch11 | types-of-damping |
| ch11 | 21 | 25 | 8 | 2 | 0.48 | ch02, ch04, ch06, ch10 | specific-gravity, gauge-pressure, bernoulli-applications |

Observations:

- **Ch 11 Fluids** has the fewest cross-unit links (0.48 per node). Ties come only through force/weight/equilibrium (Ch 4), work–energy (Ch 6, Bernoulli), free fall (Ch 2, Torricelli) and bulk modulus (Ch 10). Nothing in the slides links continuity/flow to momentum or rotation.
- **Ch 10 SHM & Elasticity** has no outgoing cross-unit edges apart from the pressure dependency. It mostly *consumes* earlier ideas (reference circle ← Ch 5/8, energy ← Ch 6, torque/I ← Ch 9).
- **Ch 3 Kinematics 2D** links only to Ch 1–2. Projectile motion is not reused later in the slides; e.g. Ch 6 energy and Ch 7 momentum examples are not tied back to projectiles.
- **Ch 7 Impulse & Momentum** (0.92 per node): impulse–momentum is linked to Newton's 2nd law only by inference, and momentum is never mentioned in Ch 4–6.
- Weakly attached nodes (degree ≤ 1) are mostly reasoning-strategy slides, tables, or application examples (GPS, synchronous satellites, specific gravity, gauge pressure, Bernoulli applications).

## 4. Inferred edges needing teacher review

50 of 299 semantic edges are `inferred`. That means standard physics dependencies with no explicit slide statement. Cross-unit inferred edges:

- Equations of Kinematics for Constant Acceleration —prerequisite→ Equations of Kinematics in Two Dimensions: same equations per axis
- Reasoning Strategy: Applying the Equations of Kinematics —prerequisite→ Reasoning Strategy: Applying 2D Kinematics Equations: same five-step strategy extended to 2D
- Symmetry in Upward and Downward Motion —applies_to→ Hang Time: up time = down time
- Average Velocity —prerequisite→ Relative Velocity: 
- Addition of Vectors by Components —applies_to→ Relative Velocity in Two Dimensions: 
- Instantaneous Velocity —prerequisite→ Uniform Circular Motion: constant speed, changing direction
- Freely Falling Bodies —prerequisite→ Apparent Weightlessness and Artificial Gravity: orbit is like free fall
- Force and Mass —prerequisite→ Work Done by a Constant Force: 
- Equations of Kinematics for Constant Acceleration —prerequisite→ The Work–Energy Theorem: uses v² = v0² + 2as
- Conservation of Mechanical Energy —applies_to→ Freely Falling Bodies: 
- Instantaneous Velocity —prerequisite→ Linear Momentum: p = mv
- Average Velocity —prerequisite→ Average Angular Velocity: rotational analog
- Instantaneous Velocity —prerequisite→ Instantaneous Angular Velocity: analog of v = lim Δx/Δt
- Reasoning Strategy: Applying the Equations of Kinematics —prerequisite→ Reasoning Strategy: Rotational Kinematics: same strategy as linear
- Equations of Rotational Kinematics (Constant α) —prerequisite→ Translational and Rotational Motion of Rigid Objects: 
- Reasoning Strategy: Analyzing Equilibrium Situations —prerequisite→ Reasoning Strategy: Rigid-Body Equilibrium: 
- Newton’s Second Law for Rotational Motion —contrasts_with→ Newton’s Second Law of Motion: τ↔F, I↔m
- Comparison: Rotational and Linear Kinematics —prerequisite→ Analogies Between Rotational and Translational Quantities: 
- Satellites in Circular Orbits —prerequisite→ Kepler’s Second Law: orbits
- Force and Mass —prerequisite→ Ideal Spring: 
- Newton’s Third Law of Motion —applies_to→ Restoring Force of an Ideal Spring: spring force is reaction to applied force
- sin θ, cos θ, tan θ —applies_to→ Displacement in SHM: x = A cos ωt
- Tangential Speed and Angular Speed —applies_to→ Velocity in SHM: v_T = Aω projected
- Newton’s Second Law of Motion —applies_to→ Frequency of Vibration (Mass–Spring): −kx = ma with a = −ω²x
- Work Done by a Constant Force —prerequisite→ Elastic Potential Energy: work done by spring force
- Conservative Versus Nonconservative Forces —prerequisite→ Elastic Potential Energy: spring force is conservative
- Force and Mass —prerequisite→ Pressure: 

Also, 249 grounded edges include 65 of kind `label_mention_nearby`. Their evidence is only that the other concept's name appears within ±4 slides, so it is weaker than `targeted_phrase`.

## 5. Equations not verifiable in extracted slide text

These equations were transcribed from slide context, but the formula itself did not survive PDF text extraction. Check them against the slides:

- Dimensional Analysis (Chapter 1 Introduction and Mathematical Concepts.pdf p9): `[v]=\frac{[L]}{[T]}`
- sin θ, cos θ, tan θ (Chapter 1 Introduction and Mathematical Concepts.pdf p13): `\sin\theta=\frac{h_o}{h}`, `\cos\theta=\frac{h_a}{h}`, `\tan\theta=\frac{h_o}{h_a}`
- Freely Falling Bodies (Chapter 2 part2  Kinematics for Constant Acceleration.pdf p17): `g=9.80\ \mathrm{m/s^2}`
- Position–Time Graph (Chapter 2 part2  Kinematics for Constant Acceleration.pdf p29): `\text{Slope}=\frac{\Delta x}{\Delta t}=\bar v`
- Equations of Kinematics in Two Dimensions (Chapter 3 Kinematics in Two Dimensions.pdf p8): `v_x=v_{0x}+a_xt`, `x=v_{0x}t+\tfrac12a_xt^2`, `v_y=v_{0y}+a_yt`, `y=v_{0y}t+\tfrac12a_yt^2`
- Newton’s Second Law of Motion (Chapter 4 Forces and Newton’s Laws of Motion.pdf p12): `\Sigma\vec F=m\vec a`
- Satellites in Circular Orbits (Chapter 5 Uniform circular motion p34): `v=\sqrt{\frac{GM_E}{r}}`
- Orbital Period of a Satellite (Chapter 5 Uniform circular motion p43): `T=\frac{2\pi r^{3/2}}{\sqrt{GM_E}}`
- Angular Displacement (Chapter 8 part1.pdf p7): `\Delta\theta=\theta-\theta_0`
- Frequency of Vibration (Mass–Spring) (Chapter 10 Simple Harmonic Motion and Elasticity.pdf p51): `\omega=\sqrt{\frac{k}{m}}`
- Total Mechanical Energy (with Spring) (Chapter 10 part 2.pdf p7): `E=\tfrac12mv^2+\tfrac12I\omega^2+mgh+\tfrac12ky^2`
- Frequency of a Simple Pendulum (Chapter 10 part 2.pdf p26): `\omega=\sqrt{\frac{g}{L}}`
- Physical Pendulum (Chapter 10 part 2.pdf p31): `f=\frac{1}{2\pi}\sqrt{\frac{mgL}{I}}`
