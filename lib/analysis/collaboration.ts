/**
 * Collaboration analysis
 * Builds a collaboration graph from PR and reviewer data
 */

import { GitHubPullRequest } from "../github/types";
import { CollaborationAnalysisResult, CollaborationEdge, DataQuality } from "./types";

/**
 * Analyzes collaboration patterns from PR data
 *
 * Collaboration is represented as edges between contributors who:
 * - Author creates PR, reviewer reviews it → edge weight += 1
 * - Multiple reviewers on same PR → edges between all reviewers += 0.5
 *
 * Collaboration Density:
 * = (actual edges / potential edges) * 100
 * Potential edges = n * (n - 1) / 2 for n unique contributors
 */
export function analyzeCollaboration(
  pullRequests: GitHubPullRequest[]
): CollaborationAnalysisResult {
  if (pullRequests.length === 0) {
    return {
      edges: [],
      collaborationDensity: 0,
      mostConnectedContributor: null,
      mostConnectedCount: 0,
      dataQuality: "unavailable",
    };
  }

  // Track edges as map: "source->target" => weight
  const edgeMap = new Map<string, number>();
  const contributors = new Set<string>();

  let reviewerDataAvailable = false;

  pullRequests.forEach((pr) => {
    if (pr.author) {
      contributors.add(pr.author);
    }

    // Add edges for PR author <-> reviewer interactions
    if (pr.reviewers && pr.reviewers.length > 0) {
      reviewerDataAvailable = true;

      pr.reviewers.forEach((reviewer) => {
        contributors.add(reviewer);

        if (pr.author && pr.author !== reviewer) {
          // Edge between author and reviewer
          const key1 = `${pr.author}->${reviewer}`;
          const key2 = `${reviewer}->${pr.author}`;
          const existingKey = edgeMap.has(key1) ? key1 : key2;

          edgeMap.set(
            existingKey || key1,
            (edgeMap.get(existingKey || key1) || 0) + 1
          );
        }
      });

      // Add edges between reviewers (collaboration on same PR)
      if (pr.reviewers.length > 1) {
        for (let i = 0; i < pr.reviewers.length; i++) {
          for (let j = i + 1; j < pr.reviewers.length; j++) {
            const rev1 = pr.reviewers[i];
            const rev2 = pr.reviewers[j];
            const key = rev1 < rev2 ? `${rev1}->${rev2}` : `${rev2}->${rev1}`;
            edgeMap.set(key, (edgeMap.get(key) || 0) + 0.5);
          }
        }
      }
    }
  });

  // Convert edge map to list of edges
  const edges: CollaborationEdge[] = Array.from(edgeMap.entries()).map(
    ([key, weight]) => {
      const [source, target] = key.split("->");
      return {
        source,
        target,
        weight: Math.round(weight * 10) / 10,
      };
    }
  );

  // Calculate collaboration density
  const n = contributors.size;
  const potentialEdges = Math.max(1, (n * (n - 1)) / 2);
  const collaborationDensity =
    n > 1 ? Math.round((edges.length / potentialEdges) * 1000) / 10 : 0;

  // Find most connected contributor
  const connectionCount = new Map<string, number>();
  edges.forEach((edge) => {
    connectionCount.set(
      edge.source,
      (connectionCount.get(edge.source) || 0) + edge.weight
    );
    connectionCount.set(
      edge.target,
      (connectionCount.get(edge.target) || 0) + edge.weight
    );
  });

  const mostConnected = Array.from(connectionCount.entries()).sort(
    (a, b) => b[1] - a[1]
  );

  const mostConnectedContributor = mostConnected[0]?.[0] || null;
  const mostConnectedCount = Math.round((mostConnected[0]?.[1] || 0) * 10) / 10;

  // Determine data quality
  const dataQuality: DataQuality = reviewerDataAvailable
    ? "complete"
    : "limited";

  return {
    edges,
    collaborationDensity,
    mostConnectedContributor,
    mostConnectedCount,
    dataQuality,
  };
}
