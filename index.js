const { addonBuilder } = require("stremio-addon-sdk");
const fs = require("fs");

const favorites = JSON.parse(fs.readFileSync("favorites.json", "utf8"));

const builder = new addonBuilder({
  id: "org.cineselect.catalog",
  version: "1.0.0",
  name: "CineSelect",
  description: "Your custom CineSelect movies and shows",
  catalogs: [
    { type: "movie", id: "cineselect_movies", name: "CineSelect Movies" },
    { type: "series", id: "cineselect_shows", name: "CineSelect Shows" },
  ],
  resources: ["catalog", "meta"],
  types: ["movie", "series"],
});

builder.defineCatalogHandler(({ type, id }) => {
  let metas = [];

  if (type === "movie" && id === "cineselect_movies") {
    metas = favorites.movies.map((item) => ({
      id: item.id,
      type: "movie",
      name: item.title,
      year: item.year,
      description: item.description,
      poster: item.poster,
    }));
  }

  if (type === "series" && id === "cineselect_shows") {
    metas = favorites.shows.map((item) => ({
      id: item.id,
      type: "series",
      name: item.title,
      year: item.year,
      description: item.description,
      poster: item.poster,
    }));
  }

  return Promise.resolve({ metas });
});

builder.defineMetaHandler(({ id }) => {
  const allItems = [...favorites.movies, ...favorites.shows];
  const item = allItems.find((el) => el.id === id);
  if (!item) return Promise.resolve({ meta: null });

  return Promise.resolve({
    meta: {
      id: item.id,
      name: item.title,
      description: item.description,
      poster: item.poster,
      type: item.year.length === 4 ? "movie" : "series",
    },
  });
});

// 🔧 SERVER KURULUMU - HATALAR BURADAYDI
const addonInterface = builder.getInterface();

require("http")
  .createServer(addonInterface)  // ← middleware yok, direkt fonksiyon!
  .listen(7010, () => {
    console.log("✅ CineSelect Addon çalışıyor: http://localhost:7010/stremio/v1");
  });
