# FARO Rayos-X 🔦⚡
### The Multimodal Tenant Advocate & Rental Listing Forensic Auditor
**Meta Global AI Developer Hackathon 2026** · *Indie Developer Track*  
**Built with:** Meta Muse Spark 1.3 · Meta Segment Anything 3.1 (SAM 3.1) · Meta Muse Voice Transcribe 1.0 · Muse Code

---

## ⚖️ Official Hackathon Transparency Declaration (Discord FAQ Compliance)
> **Declaration of Prior Work vs. Hackathon Build:**  
> In May 2026, an exploratory 12-page conceptual study and static UI mockup (`FARO APP`) were conducted regarding rental search pain points in Chile.  
> **For the Meta Global AI Developer Hackathon 2026, this project (`FARO Rayos-X`) was created 100% from scratch in this new repository starting October 27, 2026.**  
> Zero lines of code were copied from prior mockups. The entire multimodal forensic pipeline, Meta Model API integration (`muse-spark-1.3`, `sam-3.1`, `muse-voice-transcribe-1.0`), deterministic TypeScript verification engine, epistemic contradiction graph, and Swiss-editorial workbench were designed and implemented specifically for this competition.

---

## 🎯 The Problem: Asymmetric Information in Rental Housing
Renting a home is typically the single largest recurring financial expenditure for individuals and families, consuming **30% to 50% of monthly income**. Yet, virtually all major PropTech portals (Zillow, Apartments.com, PortalInmobiliario, Idealista) suffer from a structural conflict of interest: **they are monetized by brokers and landlords**.

As a result, prospective tenants face severe information asymmetry:
1. **Unreliable Listing Copy:** Advertised as *"sunlit, remodeled, low HOA fees, pet-friendly"*.
2. **Camouflaged Visual Defects in Photos:** Wide-angle lenses conceal ceiling moisture, cracks, or windows facing dark interior ventilation shafts.
3. **Hidden Traps in PDF Leases:** Unannounced quarterly inflation indexation (UF/IPC), unstated broker commissions, illegal pet restrictions contradicting the ad, and asymmetric penalty clauses.
4. **Broken Feedback Loop:** After visiting multiple units, tenants lose track of critical red flags and cannot systematically update their search criteria.

---

## 💡 The Solution: FARO Rayos-X
**FARO Rayos-X** flips the script: it is the first **tenant-side multimodal forensic auditor** that puts Meta's state-of-the-art vision, reasoning, and voice models to work on behalf of the renter.

```
                              ┌───────────────────────────────────────────────┐
                              │  Tenant Inputs: Real Budget & Deal-Breakers   │
                              │     (Dictated via Muse Voice Transcribe)      │
                              └──────────────────────┬────────────────────────┘
                                                     │
               ┌─────────────────────────────────────┼─────────────────────────────────────┐
               ▼                                     ▼                                     ▼
     [Unreliable Ad Copy]                 [Apartment Photos]                    [PDF Draft Lease]
               │                                     │                                     │
               └─────────────────────────────────────┼─────────────────────────────────────┘
                                                     │
                                                     ▼
                             ┌────────────────────────────────────────────────┐
                             │       POST https://api.meta.ai/v1/responses    │
                             │             model: muse-spark-1.3              │
                             │  - Native PDF & Image Multimodal Ingestion     │
                             │  - Perception Grounding (0-1000 Bounding Boxes)│
                             │  - Contemplating Reasoning Summary (CoT)       │
                             │  - Strict JSON Schema Output                   │
                             └───────────────────────┬────────────────────────┘
                                                     │
                                                     ▼
                             ┌────────────────────────────────────────────────┐
                             │       POST https://api.meta.ai/v1/responses    │
                             │               model: sam-3.1                   │
                             │  - Pixel-exact segmentation of visual defects  │
                             │    (water stains, wall cracks, shafts)         │
                             └───────────────────────┬────────────────────────┘
                                                     │
                                                     ▼
                             ┌────────────────────────────────────────────────┐
                             │    Deterministic TypeScript Validation Layer   │
                             │  - True Monthly Cost Formula (amortized fees)  │
                             │  - Hard Deal-Breaker Veto Gate                 │
                             │  - Dual Scorecard (Fit Score vs Evidence Cov%) │
                             │  - Cross-Modal [CONTRADICTION] Graph Engine    │
                             └───────────────────────┬────────────────────────┘
                                                     │
                                                     ▼
                             ┌────────────────────────────────────────────────┐
                             │          Tenant Defense Action Pack            │
                             │  1. 1-Click WhatsApp Interrogation for Broker  │
                             │  2. Lease Redlines (Fair Counter-Clauses)      │
                             │  3. Post-Tour Voice Recalibration Loop         │
                             └────────────────────────────────────────────────┘
```

---

## ⚡ Core Meta AI Tooling Integration

| Meta Tool / Model | Endpoint / Harness | Role in FARO Rayos-X |
|---|---|---|
| **`muse-spark-1.3`** | `POST https://api.meta.ai/v1/responses` | **Core Multimodal Reasoning Engine:** Simultaneously ingests ad copy, apartment photos, and PDF lease documents. Employs *Perception Grounding* (`0-1000` normalized coordinates) to detect visual defects, extracts financial clauses, outputs visible *Contemplating* reasoning summaries, and strictly conforms to a typed JSON Schema. |
| **`sam-3.1` (Segment Anything 3.1)** | `POST https://api.meta.ai/v1/responses` | **Pixel-Exact Defect Segmentation:** Takes visual findings flagged by Muse Spark (e.g., *"water stain"*, *"wall crack"*) and returns binary masks decoded via `@meta-sam/parser` to draw precise SVG overlays on property photos ($0.0025/image). |
| **`muse-voice-transcribe-1.0`** | `POST https://api.meta.ai/v1/asr/transcribe` | **Voice-Driven Search & Post-Tour Feedback:** Transcribes spoken tenant constraints and spontaneous voice notes recorded right after physical apartment visits (`DIARIZATION` enabled), feeding the reactive profile recalibration loop. |
| **`Muse Code` & `OpenCode`** | Local Development CLI | **Development Harness:** Project scaffolded and iterated using Meta's official coding harnesses configured with `muse-spark-1.3`. |

---

## 🛡️ Deterministic Guardrails (`CONSTRAINTS.md`)
To prevent hallucinations and protect renter finances:
1. **No LLM Math:** Rental calculations (True Monthly Cost, UF/IPC indexation, amortized 50%+VAT broker commissions) are strictly computed by deterministic TypeScript functions.
2. **Dual Scorecard (Inspired by `AgriciDaniel/claude-ads`):** Separates **Verified Fit Score (0–100)** from **Evidence Coverage %**. If an ad hides HOA fees or bathroom photos, those checks remain `UNKNOWN` (never guessed), penalizing opaque listings.
3. **Cross-Modal Contradiction Graph (Inspired by `Graphify-Labs/graphify`):** Flags explicit collisions between what the broker wrote, what the photos show, and what the PDF contract mandates.
4. **Local Budget Guard:** Built-in `node:sqlite` transaction ledger that strictly enforces a hard spend cap (`US$10.00` in dev) on Meta API calls.

---

## 🚀 Quickstart

### Prerequisites
- Node.js `v24.14.0+`
- Meta Model API Key (`META_API_KEY`)

```bash
# 1. Clone repository
git clone https://github.com/alonsinhoiu/faro-rayosx-meta-hackathon-2026.git
cd faro-rayosx-meta-hackathon-2026

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env and insert your META_API_KEY

# 4. Run deterministic validation tests
npm test

# 5. Run API smoke tests (read-only fixtures)
npm run smoke:meta

# 6. Start developer workbench
npm run dev
```

---

## 👥 Author
**Alonso Jesús González Céspedes** (*Dabrianta*)  
Psychology Student & Independent Developer · Santiago, Chile  
GitHub: [@alonsinhoiu](https://github.com/alonsinhoiu)
