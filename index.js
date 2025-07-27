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

// favorites.json dosyasından verileri oku
let favorites = [];
try {
  const data = fs.readFileSync("favorites.json", "utf8");
  favorites = JSON.parse(data).movies || [];
} catch (err) {
  console.error("favorites.json okunamadı:", err);
}

// movie vs. series ayrımı
function isSeries(imdbId) {
  // IMDb ID'ye göre ayırt edemeyiz, ama isimden ayırt etmek zor.
  // Geçici çözüm: title içinde "S01", "Season", "Episode", vs. yoksa movie varsayalım.
  // Ancak biz daha iyisini yapalım: dizileri `favorites.series` diye ayrı tutacağız (ileride).
  // Şimdilik hardcode: diziler IMDb ID'leri ile filtrelenebilir.
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

// catalog handler
builder.defineCatalogHandler((args) => {
  if (args.id === "cine-select-movies") {
    const metas = favorites
      .filter(movie => !isSeries(movie.imdb))
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

// HTTP sunucusunu başlat (Render için şart!)
serveHTTP(builder.getInterface(), { port: 7010 });
