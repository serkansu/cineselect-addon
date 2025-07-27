const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");
const fs = require("fs");

const manifest = {
  id: "community.cineselect",
  version: "1.0.0",
  name: "CineSelect",
  description: "Custom curated movie list from Görkem",
  resources: ["catalog"],
  types: ["movie", "series"],
  catalogs: [
    {
      type: "movie",
      id: "cine-select-movies",
      name: ".cine-select movies"
    },
    {
      type: "series",
      id: "cine-select-series",
      name: ".cine-select series"
    }
  ],
  idPrefixes: ["tt"]
};

const builder = new addonBuilder(manifest);

// Read data from favorites.json
let favorites = [];
try {
  const data = fs.readFileSync("favorites.json", "utf8");
  favorites = JSON.parse(data).movies || [];
} catch (err) {
  console.error("Could not read favorites.json:", err);
}

// Series detection by known IMDb IDs
function isSeries(imdbId) {
  const knownSeries = [
    "tt0903747", // Breaking Bad
    "tt0944947", // Game of Thrones
    "tt1796960", // Homeland
    "tt0455275", // Prison Break
    "tt2085059", // Black Mirror
    "tt0411008", // Lost
    "tt3032476", // Better Call Saul
    "tt2707408", // Narcos
    "tt5071412", // Ozark
    "tt7057856"  // The Spy
  ];
  return knownSeries.includes(imdbId);
}

// Catalog handler with pagination (skip/limit support)
builder.defineCatalogHandler((args) => {
  const skip = parseInt(args.extra?.skip || 0);
  const limit = parseInt(args.extra?.limit || 100);

  if (args.id === "cine-select-movies") {
    const metas = favorites
      .filter(movie => !isSeries(movie.imdb))
      .slice(skip, skip + limit)
      .map((movie) => ({
        id: movie.imdb,
        type: "movie",
        name: movie.title,
        poster: movie.poster || "",
        description: movie.description || ""
      }));
    return Promise.resolve({ metas });
  }

  if (args.id === "cine-select-series") {
    const metas = favorites
      .filter(movie => isSeries(movie.imdb))
      .slice(skip, skip + limit)
      .map((movie) => ({
        id: movie.imdb,
        type: "series",
        name: movie.title,
        poster: movie.poster || "",
        description: movie.description || ""
      }));
    return Promise.resolve({ metas });
  }

  return Promise.resolve({ metas: [] });
});

// Start HTTP server (required for Render)
serveHTTP(builder.getInterface(), { port: 7010 });
