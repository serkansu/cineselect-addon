const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");
const fs = require("fs");

const manifest = {
  id: "community.cineselect",
  version: "1.0.0",
  name: "CineSelect",
  description: "Custom curated movie list from Görkem",
  resources: ["catalog"],
  types: ["movie"],
  catalogs: [
    {
      type: "movie",
      id: "cineselect",
      name: "CineSelect Picks"
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

// catalog handler
builder.defineCatalogHandler((args) => {
  if (args.id !== "cineselect") {
    return Promise.resolve({ metas: [] });
  }

  const metas = favorites.map((movie) => ({
    id: movie.imdb,
    type: "movie",
    name: movie.title,
    poster: movie.poster || "",
    description: movie.description || "",
  }));

  return Promise.resolve({ metas });
});

// HTTP sunucusunu başlat (Render için şart!)
serveHTTP(builder.getInterface(), { port: 7010 });
