import test from "node:test";
import assert from "node:assert/strict";
import {
  filterCatalogItems,
  filterChannels,
  findNextEpisode,
  formatEpisodeCode,
  formatRemainingTime,
  formatSecondsToClock,
  validateSourceInput,
} from "./catalogLogic";
import type { CatalogItem, Channel, MediaDetails } from "../types";

const sampleItems: CatalogItem[] = [
  {
    id: "1",
    title: "Dune: Part Two",
    year: 2024,
    type: "movie",
    poster: "slate-arch",
    rating: 8.6,
    providers: ["moviebox", "4khdhub"],
    categories: ["Trending Now", "Top Movies"],
  },
  {
    id: "2",
    title: "Severance",
    year: 2022,
    type: "series",
    poster: "graphite-grid",
    rating: 8.7,
    providers: ["moviebox"],
    categories: ["Trending Now", "Top Series"],
  },
  {
    id: "3",
    title: "Frieren: Beyond Journey's End",
    year: 2023,
    type: "series",
    poster: "mist-horizon",
    rating: 9.1,
    isAnime: true,
    providers: ["dramachi", "moviebox"],
    categories: ["Top Rated"],
  },
];

test("formatSecondsToClock formats mm:ss and h:mm:ss cleanly", () => {
  assert.equal(formatSecondsToClock(42), "00:42");
  assert.equal(formatSecondsToClock(3665), "1:01:05");
  assert.equal(formatSecondsToClock(-5), "00:00");
});

test("formatRemainingTime formats minutes and hours left", () => {
  assert.equal(
    formatRemainingTime({
      percent: 50,
      currentSeconds: 1800,
      totalSeconds: 3600,
    }),
    "30m left"
  );
  assert.equal(
    formatRemainingTime({
      percent: 25,
      currentSeconds: 1800,
      totalSeconds: 7200,
    }),
    "1h 30m left"
  );
});

test("formatEpisodeCode pads season and episode numbers", () => {
  assert.equal(formatEpisodeCode(1, 4), "S01E04");
  assert.equal(formatEpisodeCode(12, 10), "S12E10");
  assert.equal(formatEpisodeCode(undefined, 2), "");
});

test("filterCatalogItems filters by media type, anime flag, provider, and query", () => {
  assert.equal(
    filterCatalogItems(sampleItems, { filter: "movies" }).length,
    1
  );
  assert.equal(
    filterCatalogItems(sampleItems, { filter: "series" }).length,
    1
  );
  assert.equal(
    filterCatalogItems(sampleItems, { filter: "anime" }).length,
    1
  );
  assert.equal(
    filterCatalogItems(sampleItems, { provider: "4khdhub" })[0]?.id,
    "1"
  );
  assert.equal(
    filterCatalogItems(sampleItems, { query: "frieren" })[0]?.id,
    "3"
  );
});

test("filterChannels filters by category and search query", () => {
  const channels: Channel[] = [
    {
      id: "ch1",
      name: "World News 24",
      category: "News",
      logoText: "WN",
      now: "Global Briefing",
      next: "Market Desk",
      progress: 40,
    },
    {
      id: "ch2",
      name: "Arena Sports One",
      category: "Sports",
      logoText: "AS",
      now: "Champions Highlights",
      next: "Post-Match",
      progress: 70,
    },
  ];
  assert.equal(filterChannels(channels, "Sports", "").length, 1);
  assert.equal(filterChannels(channels, "All", "market").length, 1);
  assert.equal(filterChannels(channels, "Music", "").length, 0);
});

test("findNextEpisode advances within season and across seasons", () => {
  const series: MediaDetails = {
    id: "s1",
    title: "Severance",
    year: 2022,
    type: "series",
    poster: "graphite-grid",
    rating: 8.7,
    synopsis: "Test",
    genres: ["Sci-Fi"],
    cast: [],
    director: "Ben Stiller",
    runtime: "50m",
    audio: ["English"],
    streams: [],
    seasons: [
      {
        number: 1,
        episodes: [
          { number: 1, title: "Good News", synopsis: "", duration: "57m", durationSeconds: 3420 },
          { number: 2, title: "Half Loop", synopsis: "", duration: "47m", durationSeconds: 2820 },
        ],
      },
      {
        number: 2,
        episodes: [
          { number: 1, title: "Hello, Ms. Cobel", synopsis: "", duration: "55m", durationSeconds: 3300 },
        ],
      },
    ],
  };

  assert.deepEqual(findNextEpisode(series, 1, 1), {
    season: 1,
    episode: 2,
    title: "Half Loop",
    durationSeconds: 2820,
  });
  assert.deepEqual(findNextEpisode(series, 1, 2), {
    season: 2,
    episode: 1,
    title: "Hello, Ms. Cobel",
    durationSeconds: 3300,
  });
  assert.equal(findNextEpisode(series, 2, 1), null);
});

test("validateSourceInput accepts http/https URLs and local paths and rejects invalid input", () => {
  assert.equal(validateSourceInput("").valid, false);
  assert.equal(validateSourceInput("not a path").valid, false);
  assert.equal(validateSourceInput("https://example.com/list.m3u").valid, true);
  assert.equal(validateSourceInput("/storage/emulated/0/tv.m3u").valid, true);
});
