export type CandidateEdge = {
  left: string;
  right: string;
  // Lower score is better (sum of priorities).
  score: number;
};

type SolveResult = { pairCount: number; totalScore: number; pairs: Array<[string, string]> };

const better = (a: SolveResult, b: SolveResult) => {
  if (a.pairCount !== b.pairCount) return a.pairCount > b.pairCount;
  return a.totalScore < b.totalScore;
};

const greedyFallback = (nodes: string[], edges: CandidateEdge[]): SolveResult => {
  const ordered = [...edges].sort((a, b) => a.score - b.score);
  const used = new Set<string>();
  const pairs: Array<[string, string]> = [];
  let totalScore = 0;
  for (const edge of ordered) {
    if (used.has(edge.left) || used.has(edge.right)) continue;
    used.add(edge.left);
    used.add(edge.right);
    pairs.push([edge.left, edge.right]);
    totalScore += edge.score;
  }
  return { pairCount: pairs.length, totalScore, pairs };
};

const solveExactForComponent = (nodes: string[], edges: CandidateEdge[]): SolveResult => {
  const n = nodes.length;
  if (n === 0) return { pairCount: 0, totalScore: 0, pairs: [] };

  const indexByNode = new Map<string, number>();
  nodes.forEach((node, index) => indexByNode.set(node, index));

  const adjacency = new Map<number, Array<{ neighbor: number; score: number }>>();
  for (let i = 0; i < n; i++) adjacency.set(i, []);
  for (const edge of edges) {
    const left = indexByNode.get(edge.left);
    const right = indexByNode.get(edge.right);
    if (left === undefined || right === undefined) continue;
    adjacency.get(left)!.push({ neighbor: right, score: edge.score });
    adjacency.get(right)!.push({ neighbor: left, score: edge.score });
  }

  const fullMask = (1 << n) - 1;
  const memo = new Map<number, SolveResult>();

  const dfs = (mask: number): SolveResult => {
    if (mask === 0) return { pairCount: 0, totalScore: 0, pairs: [] };
    const cached = memo.get(mask);
    if (cached) return cached;

    let first = 0;
    while (((mask >> first) & 1) === 0) first++;

    // Option A: first remains unmatched.
    let best = dfs(mask & ~(1 << first));

    // Option B: match first with any available neighbor.
    for (const edge of adjacency.get(first) || []) {
      if (((mask >> edge.neighbor) & 1) === 0) continue;
      const nextMask = mask & ~(1 << first) & ~(1 << edge.neighbor);
      const rest = dfs(nextMask);
      const candidate: SolveResult = {
        pairCount: rest.pairCount + 1,
        totalScore: rest.totalScore + edge.score,
        pairs: [[nodes[first], nodes[edge.neighbor]], ...rest.pairs],
      };
      if (better(candidate, best)) best = candidate;
    }

    memo.set(mask, best);
    return best;
  };

  return dfs(fullMask);
};

const componentsFromEdges = (nodes: string[], edges: CandidateEdge[]) => {
  const adjacency = new Map<string, string[]>();
  for (const node of nodes) adjacency.set(node, []);
  for (const edge of edges) {
    adjacency.get(edge.left)?.push(edge.right);
    adjacency.get(edge.right)?.push(edge.left);
  }

  const visited = new Set<string>();
  const components: string[][] = [];
  for (const node of nodes) {
    if (visited.has(node)) continue;
    const stack = [node];
    const component: string[] = [];
    visited.add(node);
    while (stack.length > 0) {
      const current = stack.pop()!;
      component.push(current);
      for (const neighbor of adjacency.get(current) || []) {
        if (visited.has(neighbor)) continue;
        visited.add(neighbor);
        stack.push(neighbor);
      }
    }
    components.push(component);
  }
  return components;
};

export const selectBestPairs = (
  nodes: string[],
  edges: CandidateEdge[],
  options?: { exactComponentLimit?: number },
): SolveResult => {
  const exactComponentLimit = options?.exactComponentLimit ?? 22;
  const components = componentsFromEdges(nodes, edges);

  const byNodeEdge = new Map<string, CandidateEdge[]>();
  for (const node of nodes) byNodeEdge.set(node, []);
  for (const edge of edges) {
    byNodeEdge.get(edge.left)?.push(edge);
    byNodeEdge.get(edge.right)?.push(edge);
  }

  let pairCount = 0;
  let totalScore = 0;
  const pairs: Array<[string, string]> = [];

  for (const componentNodes of components) {
    const componentNodeSet = new Set(componentNodes);
    const componentEdges = edges.filter(
      (edge) => componentNodeSet.has(edge.left) && componentNodeSet.has(edge.right),
    );
    const solved =
      componentNodes.length <= exactComponentLimit
        ? solveExactForComponent(componentNodes, componentEdges)
        : greedyFallback(componentNodes, componentEdges);
    pairCount += solved.pairCount;
    totalScore += solved.totalScore;
    pairs.push(...solved.pairs);
  }

  return { pairCount, totalScore, pairs };
};
