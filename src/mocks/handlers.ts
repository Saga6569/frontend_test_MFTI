import { rest } from "msw";

import graphs from "./graphs";

export const handlers = [
  rest.get("/api/graphs", (req, res, ctx) =>
    res(ctx.json(graphs.map((_, idx) => idx)))
  ),
  rest.get("/api/graphs/:id", (req, res, ctx) => {
    const { id } = req.params;
    const graph = graphs.find((_, gid) => gid === parseInt(id as string));
    if (graph) return res(ctx.json(graph));
    else return res(ctx.status(404), ctx.text("Not found"));
  }),
];
