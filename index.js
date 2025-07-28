const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");
const fs = require("fs");

const manifest = {
  id: "community.cineselect",
  version: "1.0.0",
  name: "CineSelect",
  description: "Custom curated movie and series list from Serkan",
  resources: ["catalog"],
  types: ["movie", "series"],
  catalogs: [
    {
      type: "movie",
      id: "cine-select-movies",
      name: "🎬 CineSelect Movies",
      extraSupported: ["skip"]
    },
    {
      type: "series",
      id: "cine-select-series",
      name: "📺 CineSelect Series",
      extraSupported: ["skip"]
    }
  ],
  idPrefixes: ["tt"]
};

const builder = new addonBuilder(manifest);

// favorites.json verilerini oku
let movieList = [];
let seriesList = [];
try {
  const data = fs.readFileSync("favorites.json", "utf8");
  const parsed = JSON.parse(data);
  movieList = parsed.movies || [];
  seriesList = parsed.series || [];
  console.log(`🎬 ${movieList.length} movies, 📺 ${seriesList.length} series loaded.`);
} catch (err) {
  console.error("favorites.json okunamadı:", err);
}

// catalog handler
builder.defineCatalogHandler((args) => {
  const skip = parseInt(args.skip || 0);
  const limit = parseInt(args.limit || 100); // varsayılan 100 item göster

  if (args.id === "cine-select-movies") {
    const metas = movieList
      .slice(skip, skip + limit)
      .map((movie) => ({
        id: movie.imdb.startsWith("tt") ? movie.imdb : "tt" + movie.imdb.replace(/\D/g, ""), // IMDb ID formatı düzeltme
        type: "movie",
        name: movie.title,
        poster: movie.poster || "",
        description: movie.description || ""
      }));
    return Promise.resolve({ metas });
  }

  if (args.id === "cine-select-series") {
    const metas = seriesList
      .slice(skip, skip + limit)
      .map((series) => ({
        id: series.imdb.startsWith("tt") ? series.imdb : "tt" + series.imdb.replace(/\D/g, ""),
        type: "series",
        name: series.title,
        poster: series.poster || "",
        description: series.description || ""
      }));
    return Promise.resolve({ metas });
  }

  return Promise.resolve({ metas: [] });
});

serveHTTP(builder.getInterface(), { port: 7010 });
