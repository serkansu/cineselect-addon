const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");
const fs = require("fs");

const manifest = {
  id: "community.serkansfavorites",
  version: "1.0.0",
  name: "Serkan's Favorites",
  description: "A collection of movies worth watching again and again.",
  logo: "https://raw.githubusercontent.com/serkansu/cineselect-addon/main/cineselect-logo.png",
  resources: ["catalog"],
  types: ["movie", "series"],
  catalogs: [
    {
      type: "movie",
      id: "serkan-favorite-movies",
      name: "🎬 Serkan's Favorite Movies",
      extraSupported: ["skip"]
    },
    {
      type: "series",
      id: "serkan-favorite-series",
      name: "📺 Serkan's Favorite Series",
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

  if (args.id === "serkan-favorite-movies") {
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

  if (args.id === "serkan-favorite-series") {
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
