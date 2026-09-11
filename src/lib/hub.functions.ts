import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getMatches = createServerFn({ method: "GET" }).handler(async () => {
  const { loadMatches } = await import("./filgoal.server");
  return loadMatches();
});

export const getSquad = createServerFn({ method: "GET" }).handler(async () => {
  const { loadSquad } = await import("./filgoal.server");
  return loadSquad();
});

export const getStandings = createServerFn({ method: "GET" }).handler(async () => {
  const { loadStandings } = await import("./filgoal.server");
  return loadStandings();
});

export const getNews = createServerFn({ method: "GET" }).handler(async () => {
  const { loadNews } = await import("./filgoal.server");
  return loadNews();
});

export const getMatchDetail = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ matchId: z.number() }).parse(data))
  .handler(async ({ data }) => {
    const { loadMatchDetail } = await import("./filgoal.server");
    return loadMatchDetail(data.matchId);
  });
