# Ghostwriter AI - Analysis Layer Documentation

## Overview

The analysis layer provides deterministic, explainable repository analysis based on real GitHub data. All metrics are calculated from data already fetched by the GitHub ingestion layer and contain no fabricated values.

## Architecture

```
lib/analysis/
├── types.ts                 # TypeScript types and interfaces
├── contributors.ts          # Contributor analysis
├── ownership.ts            # Ownership concentration analysis
├── collaboration.ts        # Collaboration graph analysis
├── metrics.ts              # Bus factor, knowledge silos, health score
├── index.ts                # Public API
├── analysis.test.ts        # Comprehensive unit tests
└── examples.ts             # Usage examples
```

## Core Concepts

### Data Quality Tracking

Every analysis result includes a `dataQuality` field:
- `"complete"` - All expected data was available
- `"limited"` - Some data was missing (e.g., reviewer info)
- `"unavailable"` - Critical data was not available

This allows the UI to communicate what was actually measured versus what couldn't be assessed.

### Determinism

All calculations are deterministic:
- Same input → same output (every time)
- No random values or external state
- Results are reproducible and auditable

### No Data Fabrication

If GitHub data doesn't support a metric:
- The metric is marked with `dataQuality: "limited"` or `"unavailable"`
- A best-effort calculation is provided with supporting metadata
- The UI can explain the limitation to users

---

## Analysis Functions

### 1. Contributor Analysis

**Module:** `lib/analysis/contributors.ts`

**Function:** `analyzeContributors(contributors, commits, pullRequests)`

**Purpose:** Scores each contributor on engineering impact, not just commit count.

**Output:**
```typescript
{
  topContributors: AnalyzedContributor[],
  totalContributors: number,
  dataQuality: DataQuality
}
```

**Scoring Formula (0-100):**
```
engineeringScore = 
  (commitScore × 0.40) +      // 40% - Code contribution
  (prScore × 0.30) +          // 30% - Initiative (PRs created)
  (mergedPrScore × 0.20) +    // 20% - Quality (PRs merged)
  (reviewScore × 0.10)        // 10% - Collaboration (reviews)
```

**Rationale:**
- Commit count alone doesn't measure engineering quality
- PR merges indicate code review and approval
- Review participation shows collaboration
- Weights are normalized per contributor

**Example:**
- Alice: 100 commits, 10 PRs, 8 merged, 2 reviews → High score
- Bob: 50 commits, 50 PRs, 2 merged, 0 reviews → Lower score (low quality)

---

### 2. Ownership Analysis

**Module:** `lib/analysis/ownership.ts`

**Function:** `analyzeOwnership(commits, contributors)`

**Purpose:** Measures how concentrated repository ownership is.

**Output:**
```typescript
{
  topContributor: string,
  topContributorShare: number,          // 0-100 percentage
  ownershipConcentration: number,       // 0-100 HHI-based
  distribution: Array<{login, percentage}>
}
```

**Concentration Formula (Herfindahl-Hirschman Index):**
```
HHI = Σ(share_i)² for each contributor
normalized = (HHI - min_HHI) / (max_HHI - min_HHI) × 100

0-20:   Very distributed (healthy)
21-40:  Well distributed
41-60:  Moderate concentration
61-80:  Concentrated
81-100: Highly concentrated (risky)
```

**Example:**
- 1 contributor with 100%: concentration = 100 (high risk)
- 5 equal contributors (20% each): concentration ≈ 20 (healthy)

---

### 3. Bus Factor

**Module:** `lib/analysis/metrics.ts`

**Function:** `calculateBusFactor(commits)`

**Purpose:** Identifies critical dependency risks.

**Definition:** The minimum number of contributors whose cumulative contribution accounts for ≥50% of repository activity.

**Output:**
```typescript
{
  busFactor: number,           // 1, 2, 3, ...
  contributorsFor50Percent: Array<{login, percentage, cumulative}>,
  riskLevel: "high" | "medium" | "low"
}
```

**Risk Levels:**
- `"high"`: 1-2 people (critical risk)
- `"medium"`: 3-5 people (acceptable)
- `"low"`: 6+ people (healthy)

**Example:**
- Alice: 40%, Bob: 20%, Charlie: 15%, ...
- Bus factor = 2 (A + B = 60% ≥ 50%)

---

### 4. Knowledge Silos

**Module:** `lib/analysis/metrics.ts`

**Function:** `calculateKnowledgeSilos(commits)`

**Purpose:** Identifies contributors at risk of becoming critical blockers.

**Output:**
```typescript
{
  silos: KnowledgeSilo[],
  overallRisk: "low" | "medium" | "high",
  dataQuality: "limited"  // File paths not yet available
}
```

**Silo Criteria:**
- Contributor has >15% of commits (significant activity)
- Concentration score >50 marks as high risk

**Limitation:** Current GitHub data only provides aggregate file-change counts, not file paths. UI should explain this limitation.

**Example:**
```
Alice: 35% of commits → high concentration silo
Bob: 2% of commits → not flagged
```

---

### 5. Collaboration Analysis

**Module:** `lib/analysis/collaboration.ts`

**Function:** `analyzeCollaboration(pullRequests)`

**Purpose:** Maps collaboration patterns and identifies key connectors.

**Output:**
```typescript
{
  edges: CollaborationEdge[],  // {source, target, weight}
  collaborationDensity: number, // 0-100
  mostConnectedContributor: string,
  mostConnectedCount: number,
  dataQuality: DataQuality
}
```

**Edge Definition:**
- PR author ↔ reviewer: weight +1
- Multiple reviewers on same PR: weight +0.5 between each pair

**Collaboration Density Formula:**
```
density = (actual_edges / potential_edges) × 100
potential_edges = n × (n-1) / 2 for n contributors
```

**Data Quality:**
- `"complete"`: Reviewer data available
- `"limited"`: No reviewers found (but PRs existed)
- `"unavailable"`: No PR data

---

### 6. Engineering Health

**Module:** `lib/analysis/metrics.ts`

**Function:** `calculateEngineeringHealth(ownershipConcentration, busFactor, collaborationDensity, contributorCount, totalCommits)`

**Purpose:** Holistic health assessment combining multiple signals.

**Output:**
```typescript
{
  healthScore: number,          // 0-100
  factors: {
    ownershipConcentration: number,
    busFactorRisk: number,
    collaborationDensity: number,
    contributorDiversity: number
  },
  riskAreas: string[],
  dataQuality: "complete"
}
```

**Health Score Formula:**
```
score = 
  (100 - ownershipConcentration) × 0.35 +
  busFactor_health × 0.30 +
  min(collaborationDensity, 50) × 0.20 +
  diversityScore × 0.15

busFactor_health = min(80, (busFactor - 1) × 20)
diversityScore = min(100, (contributors / avgCommitsPerContributor) × 50)
```

**Weights:**
- 35% - Ownership distribution
- 30% - Bus factor (dependency risk)
- 20% - Collaboration density
- 15% - Contributor diversity

**Example Risk Areas:**
- "High ownership concentration" (>70%)
- "Low bus factor (critical dependency risk)" (≤2)
- "Low collaboration density" (<20%)
- "Very few contributors" (≤2)

---

## Data Quality Guarantees

### What We Measure
- ✅ Contributor commit counts (from GitHub API)
- ✅ Pull request metadata (author, state, merged status)
- ✅ Reviewer participation (when available)
- ✅ Commit dates and authorship
- ✅ File change counts (aggregate, per commit)

### What We Cannot Yet Measure
- ❌ Detailed file-level ownership (requires pagination through all commit details)
- ❌ Code review depth/quality
- ❌ Test coverage
- ❌ Performance impact
- ❌ Technical debt

### What We Never Invent
- ❌ Random contributor names
- ❌ Fake commit dates
- ❌ Fabricated review relationships
- ❌ Guessed file ownership

---

## Limitations & Future Improvements

### Current Limitations
1. **File-level knowledge silos** - We have aggregate changed-file counts but not detailed paths
   - *Workaround*: Mark as `dataQuality: "limited"` and explain to UI

2. **Historical analysis** - We fetch recent commits/PRs only, not full history
   - *Workaround*: Results are snapshots, marked appropriately

3. **Code review quality** - We count reviewers but not review depth
   - *Workaround*: Can be improved with GitHub Comments API

4. **Inactive contributors** - Archived repos/dormant projects show old patterns
   - *Workaround*: Add `lastActivityDate` tracking

### Planned Improvements
- [ ] Fetch full commit history for historical bus factor trends
- [ ] Map file paths to contributors for detailed silos
- [ ] Integrate review comments API for collaboration depth
- [ ] Track contributor active/inactive status
- [ ] Add trend analysis (bus factor over time)
- [ ] Correlate test coverage with contributors

---

## Testing

**Test File:** `lib/analysis/analysis.test.ts`

**Test Coverage:**
1. Empty data handling
2. Single contributor repository
3. Balanced contributor distribution
4. Concentrated ownership
5. Bus factor calculations (1, 2, 5+)
6. Knowledge silo identification
7. Collaboration edge creation
8. Health score penalties
9. Missing reviewer data
10. Determinism verification

**Running Tests:**
```bash
npm test -- lib/analysis/analysis.test.ts
```

---

## Usage Example

```typescript
import {
  analyzeContributors,
  analyzeOwnership,
  analyzeCollaboration,
  calculateBusFactor,
  calculateKnowledgeSilos,
  calculateEngineeringHealth,
} from '@/lib/analysis';

// After fetching from GitHub API:
const analysis = {
  contributors: analyzeContributors(ghContributors, ghCommits, ghPRs),
  ownership: analyzeOwnership(ghCommits, ghContributors),
  busFactor: calculateBusFactor(ghCommits),
  silos: calculateKnowledgeSilos(ghCommits),
  collaboration: analyzeCollaboration(ghPRs),
};

// Calculate health score
const health = calculateEngineeringHealth(
  analysis.ownership.ownershipConcentration,
  analysis.busFactor.busFactor,
  analysis.collaboration.collaborationDensity,
  analysis.contributors.totalContributors,
  ghCommits.length
);
```

---

## Design Principles

1. **Transparency** - All formulas are documented and explainable
2. **Determinism** - Same input always produces same output
3. **Integrity** - Never fabricate data; always mark quality
4. **Pragmatism** - Use best available data, not perfect data
5. **Actionability** - Results enable real engineering decisions
6. **Evolution** - Formulas can improve without breaking results

---

## API Completeness

**✅ Fully Implemented:**
- Contributor analysis with weighted scores
- Ownership concentration (HHI-based)
- Bus factor calculation
- Knowledge silo detection
- Collaboration graph building
- Engineering health scoring

**✅ Ready for Dashboard:**
- All types are fully typed (no `any`)
- Data quality is tracked throughout
- Results are deterministic
- No external dependencies required

**🚀 Next Steps:**
- Integrate with `/api/analyze` route
- Display results in dashboard
- Add UI explanations for data quality limitations
