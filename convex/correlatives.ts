import { query } from "./_generated/server";
import { CORRELATIVES_EDGES, CORRELATIVES_NODES } from "../src/data/correlativas";

export const getMap = query({
  args: {},
  handler: async () => {
    return {
      nodes: CORRELATIVES_NODES,
      edges: CORRELATIVES_EDGES,
    };
  },
});
