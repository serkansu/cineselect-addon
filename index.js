const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");
const fs = require("fs");

const manifest = {
  id: "community.serkanswatchagain",
  version: "1.0.0",
  name: "Serkan's Watch Again Movies & Series",
  description: "A handpicked library of films and series that deserve a second (or third!) viewing. These are not just favorites — they are timeless rewatchables curated by Serkan himself. Perfect for movie nights, nostalgic weekends, or discovering gems worth looping forever.",
  logo: "https://raw.githubusercontent.com/serkansu/cineselect-addon/main/cineselect-logo.png",
  resources: ["catalog"],
  types: ["movie", "series"],
  catalogs: [
    {
      type: "movie",
      id: "serkan-watchagain-movies",
      name: "🎬 Serkan's Watch Again Movies",
      extraSupported: ["skip"]
    },
    {
      type: "series",
      id: "serkan-watchagain-series",
      name: "📺 Serkan's Watch Again Series",
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
  const limit = parseInt(args.limit || 100);

  if (args.id === "serkan-watchagain-movies") {
    const metas = movieList
      .slice(skip, skip + limit)
      .map((movie) => ({
        id: movie.imdb.startsWith("tt") ? movie.imdb : "tt" + movie.imdb.replace(/\D/g, ""),
        type: "movie",
        name: movie.title,
        poster: movie.poster || "",
        description: movie.description || ""
      }));
    return Promise.resolve({ metas });
  }

  if (args.id === "serkan-watchagain-series") {
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

// HTTP sunucusu (Render veya yerel çalışma için)
serveHTTP(builder.getInterface(), { port: 7010 });
