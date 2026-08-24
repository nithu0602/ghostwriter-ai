/**
 * Analysis types for Ghostwriter AI
 * Represents structured analysis results with data quality tracking
 */

/**
 * Data quality indicator
 * Helps frontend communicate what data was used for calculations
 */
export type DataQuality = "complete" | "limited" | "unavailable";

/**
 * Contributor analysis result
 */
export interface AnalyzedContributor {
  login: string;
  name: string | null;
  avatarUrl: string;
  contributions: number;
  commitCount: number;
  prCount: number;
  mergedPrCount: number;
  reviewParticipation: number;
  contributionPercentage: number;
  engineeringScore: number; // 0-100
}

export interface ContributorAnalysisResult {
  topContributors: AnalyzedContributor[];
  totalContributors: number;
  dataQuality: DataQuality;
}

/**
 * Ownership analysis result
 */
export interface OwnershipAnalysisResult {
  topContributor: string;
  topContributorShare: number; // 0-100
  ownershipConcentration: number; // 0-100 (higher = more concentrated)
  distribution: Array<{
    login: string;
    percentage: number;
  }>;
  dataQuality: DataQuality;
}

/**
 * Bus factor analysis
 * Minimum number of contributors needed to account for 50%+ of activity
 */
export interface BusFactorResult {
  busFactor: number;
  contributorsFor50Percent: Array<{
    login: string;
    percentage: number;
    cumulativePercentage: number;
  }>;
  riskLevel: "low" | "medium" | "high"; // high = 1-2 people, medium = 3-5, low = 6+
  dataQuality: DataQuality;
}

/**
 * Knowledge silo analysis
 */
export interface KnowledgeSilo {
  login: string;
  concentrationScore: number; // 0-100
  riskLevel: "low" | "medium" | "high";
  description: string;
}

export interface KnowledgeSilosResult {
  silos: KnowledgeSilo[];
  overallRisk: "low" | "medium" | "high";
  dataQuality: DataQuality;
}

/**
 * Collaboration graph node and edge
 */
export interface CollaborationEdge {
  source: string;
  target: string;
  weight: number; // number of interactions
}

export interface CollaborationAnalysisResult {
  edges: CollaborationEdge[];
  collaborationDensity: number; // 0-100
  mostConnectedContributor: string | null;
  mostConnectedCount: number;
  dataQuality: DataQuality;
}

/**
 * Engineering health score
 * MVP heuristic based on multiple signals
 */
export interface EngineeringHealthResult {
  healthScore: number; // 0-100
  factors: {
    ownershipConcentration: number;
    busFactorRisk: number;
    collaborationDensity: number;
    contributorDiversity: number;
  };
  riskAreas: string[];
  dataQuality: DataQuality;
}

/**
 * Repository metadata surfaced to consumers of RepositoryAnalysis
 * Subset of RepositoryMetadata needed for display purposes
 */
export interface RepositoryAnalysisMetadata {
  language: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  updatedAt: string;
  visibility: "Public" | "Private";
}

/**
 * Complete repository analysis
 */
export interface RepositoryAnalysis {
  repository: RepositoryAnalysisMetadata;
  contributors: ContributorAnalysisResult;
  ownership: OwnershipAnalysisResult;
  busFactor: BusFactorResult;
  knowledgeSilos: KnowledgeSilosResult;
  collaboration: CollaborationAnalysisResult;
  engineeringHealth: EngineeringHealthResult;
  analyzedAt: string; // ISO timestamp
}
