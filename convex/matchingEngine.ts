export type CandidateEdge = {
  left: string;
  right: string;
  // Lower score is better
  score: number;
};

export type CandidateTriplet = {
  n1: string; // n1 -> n2
  n2: string; // n2 -> n3
  n3: string; // n3 -> n1
  score: number;
};

export type MatchResult =
  | { type: "pair"; elements: [string, string] }
  | { type: "triplet"; elements: [string, string, string] };

export type SolveResult = {
  peopleSatisfied: number;
  totalScore: number;
  matches: MatchResult[];
};

const better = (a: SolveResult, b: SolveResult) => {
  if (a.peopleSatisfied !== b.peopleSatisfied) return a.peopleSatisfied > b.peopleSatisfied;
  return a.totalScore < b.totalScore;
};

const greedyFallback = (_nodes: string[], edges: CandidateEdge[], triplets: CandidateTriplet[]): SolveResult => {
  const used = new Set<string>();
  const matches: MatchResult[] = [];
  let totalScore = 0;
  let peopleSatisfied = 0;

  // We could just process triplets first if they offer better score density, but let's 
  // combine them and sort by score-per-person.
  type CombinedCandidate = 
    | { type: 'pair', scorePerPerson: number, data: CandidateEdge }
    | { type: 'triplet', scorePerPerson: number, data: CandidateTriplet };
    
  const candidates: CombinedCandidate[] = [];
  for (const edge of edges) {
    candidates.push({ type: 'pair', scorePerPerson: edge.score / 2, data: edge });
  }
  for (const trip of triplets) {
    candidates.push({ type: 'triplet', scorePerPerson: trip.score / 3, data: trip });
  }
  
  candidates.sort((a, b) => a.scorePerPerson - b.scorePerPerson);

  for (const cand of candidates) {
    if (cand.type === 'pair') {
      const e = cand.data as CandidateEdge;
      if (used.has(e.left) || used.has(e.right)) continue;
      used.add(e.left); used.add(e.right);
      matches.push({ type: 'pair', elements: [e.left, e.right] });
      totalScore += e.score;
      peopleSatisfied += 2;
    } else {
      const t = cand.data as CandidateTriplet;
      if (used.has(t.n1) || used.has(t.n2) || used.has(t.n3)) continue;
      used.add(t.n1); used.add(t.n2); used.add(t.n3);
      matches.push({ type: 'triplet', elements: [t.n1, t.n2, t.n3] });
      totalScore += t.score;
      peopleSatisfied += 3;
    }
  }

  return { peopleSatisfied, totalScore, matches };
};

const solveExactForComponent = (nodes: string[], edges: CandidateEdge[], triplets: CandidateTriplet[]): SolveResult => {
  const n = nodes.length;
  if (n === 0) return { peopleSatisfied: 0, totalScore: 0, matches: [] };

  const indexByNode = new Map<string, number>();
  nodes.forEach((node, index) => indexByNode.set(node, index));

  const adjacencyEdges = new Map<number, Array<{ neighbor: number; score: number }>>();
  const adjacencyTrips = new Map<number, Array<{ n2: number; n3: number; score: number }>>();
  for (let i = 0; i < n; i++) {
    adjacencyEdges.set(i, []);
    adjacencyTrips.set(i, []);
  }

  for (const edge of edges) {
    const left = indexByNode.get(edge.left);
    const right = indexByNode.get(edge.right);
    if (left === undefined || right === undefined) continue;
    adjacencyEdges.get(left)!.push({ neighbor: right, score: edge.score });
    adjacencyEdges.get(right)!.push({ neighbor: left, score: edge.score });
  }

  for (const t of triplets) {
    const i1 = indexByNode.get(t.n1);
    const i2 = indexByNode.get(t.n2);
    const i3 = indexByNode.get(t.n3);
    if (i1 === undefined || i2 === undefined || i3 === undefined) continue;
    adjacencyTrips.get(i1)!.push({ n2: i2, n3: i3, score: t.score });
    adjacencyTrips.get(i2)!.push({ n2: i1, n3: i3, score: t.score });
    adjacencyTrips.get(i3)!.push({ n2: i1, n3: i2, score: t.score });
  }

  const fullMask = (1 << n) - 1;
  const memo = new Map<number, SolveResult>();

  const dfs = (mask: number): SolveResult => {
    if (mask === 0) return { peopleSatisfied: 0, totalScore: 0, matches: [] };
    const cached = memo.get(mask);
    if (cached) return cached;

    let first = 0;
    while (((mask >> first) & 1) === 0) first++;

    // Option A: first remains unmatched.
    let best = dfs(mask & ~(1 << first));

    // Option B: match first with an edge
    for (const edge of adjacencyEdges.get(first) || []) {
      if (((mask >> edge.neighbor) & 1) === 0) continue;
      const nextMask = mask & ~(1 << first) & ~(1 << edge.neighbor);
      const rest = dfs(nextMask);
      const candidate: SolveResult = {
        peopleSatisfied: rest.peopleSatisfied + 2,
        totalScore: rest.totalScore + edge.score,
        matches: [{ type: "pair", elements: [nodes[first], nodes[edge.neighbor]] }, ...rest.matches],
      };
      if (better(candidate, best)) best = candidate;
    }

    // Option C: match first with a triplet
    for (const trip of adjacencyTrips.get(first) || []) {
      if (((mask >> trip.n2) & 1) === 0) continue;
      if (((mask >> trip.n3) & 1) === 0) continue;
      const nextMask = mask & ~(1 << first) & ~(1 << trip.n2) & ~(1 << trip.n3);
      const rest = dfs(nextMask);
      const candidate: SolveResult = {
        peopleSatisfied: rest.peopleSatisfied + 3,
        totalScore: rest.totalScore + trip.score,
        matches: [{ type: "triplet", elements: [nodes[first], nodes[trip.n2], nodes[trip.n3]] }, ...rest.matches],
      };
      if (better(candidate, best)) best = candidate;
    }

    memo.set(mask, best);
    return best;
  };

  return dfs(fullMask);
};

const componentsFromEdgesAndTriplets = (nodes: string[], edges: CandidateEdge[], triplets: CandidateTriplet[]) => {
  const adjacency = new Map<string, string[]>();
  for (const node of nodes) adjacency.set(node, []);
  for (const edge of edges) {
    adjacency.get(edge.left)?.push(edge.right);
    adjacency.get(edge.right)?.push(edge.left);
  }
  for (const t of triplets) {
    adjacency.get(t.n1)?.push(t.n2, t.n3);
    adjacency.get(t.n2)?.push(t.n1, t.n3);
    adjacency.get(t.n3)?.push(t.n1, t.n2);
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

export const selectBestMatches = (
  nodes: string[],
  edges: CandidateEdge[],
  triplets: CandidateTriplet[],
  options?: { exactComponentLimit?: number },
): SolveResult => {
  const exactComponentLimit = options?.exactComponentLimit ?? 22; // DP limit
  const components = componentsFromEdgesAndTriplets(nodes, edges, triplets);

  let peopleSatisfied = 0;
  let totalScore = 0;
  const matches: MatchResult[] = [];

  for (const componentNodes of components) {
    const componentNodeSet = new Set(componentNodes);
    
    // Filter edges and triplets to this component
    const componentEdges = edges.filter(
      (edge) => componentNodeSet.has(edge.left) && componentNodeSet.has(edge.right)
    );
    const componentTrips = triplets.filter(
      (trip) => componentNodeSet.has(trip.n1) && componentNodeSet.has(trip.n2) && componentNodeSet.has(trip.n3)
    );

    const solved =
      componentNodes.length <= exactComponentLimit
        ? solveExactForComponent(componentNodes, componentEdges, componentTrips)
        : greedyFallback(componentNodes, componentEdges, componentTrips);

    peopleSatisfied += solved.peopleSatisfied;
    totalScore += solved.totalScore;
    matches.push(...solved.matches);
  }

  return { peopleSatisfied, totalScore, matches };
};
