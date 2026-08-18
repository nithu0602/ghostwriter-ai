# Backend Integration Layer - Service Orchestration

## Overview

The service layer provides a unified orchestration point that connects the GitHub data ingestion layer to the analysis layer. It validates incoming GitHub data, ensures data integrity, and coordinates the execution of all analysis functions to produce a single, comprehensive analysis result.

## Architecture

```
GitHub REST API
        ↓
lib/github/ (data ingestion)
    ├─ client.ts      (API requests, auth)
    ├─ repository.ts  (repo metadata)
    ├─ contributors.ts
    ├─ commits.ts
    ├─ pullRequests.ts
    └─ types.ts       (GitHub data types)
        ↓
lib/service/ (orchestration)
    ├─ analyzer.ts      (validation, coordination)
    ├─ types.ts         (input/output types)
    └─ index.ts         (exports)
        ↓
lib/analysis/ (metrics calculation)
    ├─ contributors.ts  (contributor scoring)
    ├─ ownership.ts     (ownership concentration)
    ├─ collaboration.ts (collaboration graph)
    ├─ metrics.ts       (bus factor, silos, health)
    └─ types.ts         (analysis types)
        ↓
RepositoryAnalysis (unified result)
```

## Core Functions

### 1. `validateGitHubData(data: GitHubRepositoryData): ValidationResult`

**Purpose:** Validates GitHub repository data before analysis.

**Validation Rules:**
- ✅ Repository metadata must exist
- ✅ At least one contributor is required
- ✅ At least one commit is required
- ⚠️ Pull requests can be empty (new repos)
- ⚠️ Reviewers can be missing (warns about collaboration analysis impact)

**Returns:**
```typescript
{
  isValid: boolean,
  errors: string[],      // Critical validation failures
  warnings: string[]     // Data quality issues
}
```

### 2. `analyzeRepository(data: GitHubRepositoryData): RepositoryAnalysis`

**Purpose:** Orchestrates all analysis functions on validated GitHub data.

**Process:**
1. Validates input data
2. Runs all 6 analysis functions in sequence
3. Calculates engineering health score
4. Combines results into unified `RepositoryAnalysis` object
5. Preserves data quality information from each analysis

**Input:** `GitHubRepositoryData`
```typescript
{
  repository: RepositoryMetadata,
  contributors: GitHubContributor[],
  commits: GitHubCommit[],
  pullRequests: GitHubPullRequest[]
}
```

**Output:** `RepositoryAnalysis`
```typescript
{
  contributors: ContributorAnalysisResult,
  ownership: OwnershipAnalysisResult,
  busFactor: BusFactorResult,
  knowledgeSilos: KnowledgeSilosResult,
  collaboration: CollaborationAnalysisResult,
  engineeringHealth: EngineeringHealthResult,
  analyzedAt: string (ISO timestamp)
}
```

**Error Handling:**
- `ValidationError` - Invalid input data
- `InsufficientDataError` - Missing critical data
- `AnalysisServiceError` - Unexpected analysis failures

### 3. `analyzeRepositoryByName(owner: string, repo: string): Promise<RepositoryAnalysis>`

**Purpose:** Convenience wrapper that handles GitHub API calls end-to-end.

**Process:**
1. Fetches repository metadata, contributors, commits, and PRs in parallel
2. Validates the fetched data
3. Calls `analyzeRepository()` with the data
4. Returns unified analysis result

**Example Usage:**
```typescript
import { analyzeRepositoryByName } from '@/lib/service';

const analysis = await analyzeRepositoryByName('vercel', 'next.js');
console.log(analysis.engineeringHealth.healthScore);
```

### 4. `isValidGitHubUrl(url: string): boolean`

**Purpose:** Validates GitHub repository URL format.

**Supported Formats:**
- `https://github.com/owner/repo`
- `https://github.com/owner/repo.git`
- `github.com/owner/repo`
- `owner/repo` (when context is clear)

## Error Handling

### Error Hierarchy

```
Error
├─ AnalysisServiceError
│  ├─ ValidationError (invalid input)
│  ├─ InsufficientDataError (missing critical data)
│  └─ (other service errors)
├─ GitHubError (from API layer)
│  ├─ GitHubRateLimitError (403)
│  └─ GitHubNotFoundError (404)
└─ (analysis calculation errors)
```

### Example Error Handling

```typescript
import {
  analyzeRepository,
  ValidationError,
  InsufficientDataError,
  AnalysisServiceError
} from '@/lib/service';

try {
  const analysis = analyzeRepository(data);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Invalid data:', error.validationErrors);
  } else if (error instanceof InsufficientDataError) {
    console.error('Missing required data:', error.message);
  } else if (error instanceof AnalysisServiceError) {
    console.error('Service error:', error.message);
  }
}
```

## Data Quality Tracking

Every analysis result includes `dataQuality` fields tracking what data was available:

- **`"complete"`** - All expected data was available for accurate calculation
- **`"limited"`** - Some data was missing; result may be incomplete
- **`"unavailable"`** - Critical data missing; metric not calculated

### Quality Indicators

| Metric | Quality | When Limited |
|--------|---------|--------------|
| Contributors | Complete | If no commits matched contributors |
| Ownership | Complete | If commit author data missing |
| Bus Factor | Complete | Always (commit data available) |
| Knowledge Silos | Limited | File-level paths not available |
| Collaboration | Complete/Limited | Limited if no reviewers found |
| Engineering Health | Complete | Calculated from other metrics |

## Integration Points

### With GitHub Data Ingestion Layer
- Uses `RepositoryMetadata`, `GitHubContributor`, `GitHubCommit`, `GitHubPullRequest` types
- Calls `getRepository()`, `getContributors()`, `getCommits()`, `getPullRequests()`
- Handles GitHub API errors and rate limiting

### With Analysis Layer
- Calls all analysis functions: `analyzeContributors()`, `analyzeOwnership()`, `analyzeCollaboration()`, `calculateBusFactor()`, `calculateKnowledgeSilos()`, `calculateEngineeringHealth()`
- Preserves analysis formulas unchanged
- Aggregates data quality information
- Returns unified `RepositoryAnalysis` type

## Testing

### Test Coverage

1. **Data Validation**
   - Valid complete data
   - Missing repository
   - Empty contributors
   - Empty commits
   - Missing PRs (warns)
   - Missing reviewers (warns)

2. **Analysis Execution**
   - Complete repository analysis
   - Single contributor repository
   - Balanced contributor distribution
   - Data quality propagation
   - Deterministic output

3. **Error Handling**
   - Invalid data throws `ValidationError`
   - Missing commits throws `ValidationError`
   - Works with empty PRs

4. **URL Validation**
   - Valid GitHub URLs
   - Invalid URLs rejected

### Running Tests

```bash
npm test -- lib/service/analyzer.test.ts
```

## Usage Examples

### Basic Repository Analysis

```typescript
import {
  analyzeRepository,
  GitHubRepositoryData
} from '@/lib/service';
import {
  getRepository,
  getContributors,
  getCommits,
  getPullRequests
} from '@/lib/github';

// Fetch GitHub data
const repository = await getRepository('owner', 'repo');
const contributors = await getContributors('owner', 'repo');
const commits = await getCommits('owner', 'repo');
const pullRequests = await getPullRequests('owner', 'repo');

// Compose data bundle
const data: GitHubRepositoryData = {
  repository,
  contributors,
  commits,
  pullRequests
};

// Analyze
const analysis = analyzeRepository(data);

// Display results
console.log('Health Score:', analysis.engineeringHealth.healthScore);
console.log('Bus Factor:', analysis.busFactor.busFactor);
console.log('Top Contributor:', analysis.ownership.topContributor);
```

### With Error Handling

```typescript
import { analyzeRepository, ValidationError } from '@/lib/service';

try {
  const analysis = analyzeRepository(data);
  
  // Check data quality
  if (analysis.collaboration.dataQuality === 'limited') {
    console.warn('Collaboration data incomplete');
  }
  
  // Display results with caveats
  displayAnalysis(analysis);
} catch (error) {
  if (error instanceof ValidationError) {
    showErrorsToUser(error.validationErrors);
  } else {
    showGenericError(error.message);
  }
}
```

### With Warnings

```typescript
import { validateGitHubData, analyzeRepository } from '@/lib/service';

const validation = validateGitHubData(data);

if (!validation.isValid) {
  // Handle errors
  throw new Error(validation.errors.join(', '));
}

if (validation.warnings.length > 0) {
  // Log warnings but continue
  console.warn('Analysis warnings:', validation.warnings);
}

const analysis = analyzeRepository(data);
```

## Design Principles

1. **No Fabrication** - Never invents GitHub data
2. **Explicit Quality** - All results marked with data quality
3. **Determinism** - Same input always produces same output
4. **Integrity** - Validates data before analysis
5. **Transparency** - All formulas and processes documented
6. **Single Responsibility** - Orchestration only, no calculation

## Current Limitations

- **File-level analysis** - GitHub API doesn't provide per-commit file paths; knowledge silos use commit concentration as proxy
- **Historical trends** - Fetches recent data only; no trend analysis
- **Review quality** - Counts reviewers but doesn't assess review depth
- **Performance metrics** - No integration with performance data

## Future Enhancements

- [ ] Fetch full commit history for trend analysis
- [ ] Add file-level ownership mapping
- [ ] Integrate review comment depth
- [ ] Add contributor activity status tracking
- [ ] Support custom analysis configurations
- [ ] Add caching layer for repeated analyses

## Files

### Service Layer Files
- `lib/service/types.ts` - Input/output types and error classes
- `lib/service/analyzer.ts` - Orchestration logic and validation
- `lib/service/analyzer.test.ts` - Comprehensive test suite
- `lib/service/index.ts` - Public exports

### Supporting Files
- `lib/github/index.ts` - GitHub module exports (created for convenience)
- `lib/analysis/index.ts` - Analysis module exports
- `ANALYSIS_LAYER.md` - Analysis layer documentation

## Build Status

✅ TypeScript compilation: All types checked
✅ No `any` types used
✅ Strict mode enabled
✅ Test file excluded from build
✅ Ready for integration with API routes and frontend
