const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");
const fs = require("fs");

// Helper functions to extract years and build extras
function getYears(list) {
  // Extract all years, filter out invalid, unique, sorted desc
  return Array.from(
    new Set(
      list
        .map(item => parseInt(item.year, 10))
        .filter(y => !isNaN(y))
    )
  ).sort((a, b) => b - a).map(String);
}

// These are the same for both movie and series
const sortFieldOptions = ["Default","CineSelect","IMDb","RottenTomatoes","Year","Title A-Z","Title Z-A"];
const sortOrderOptions = ["Descending","Ascending"];


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

// Build dynamic extras for years
const movieYears = getYears(movieList);
const seriesYears = getYears(seriesList);

function yearsToSortOptions(yearsArr) {
  return ["Top", ...yearsArr];
}

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
      extra: [
        {
          name: "year",
          isRequired: false,
          options: movieYears,
          optionsLimit: 200
        },
        {
          name: "sortField",
          isRequired: false,
          options: sortFieldOptions,
          id: "sortField"
        },
        {
          name: "sortOrder",
          isRequired: false,
          options: sortOrderOptions,
          id: "sortOrder"
        }
      ],
      extraSupported: ["skip", "year", "sortField", "sortOrder"]
    },
    {
      type: "series",
      id: "serkan-watchagain-series",
      name: "📺 Serkan's Watch Again Series",
      extra: [
        {
          name: "year",
          isRequired: false,
          options: seriesYears,
          optionsLimit: 200
        },
        {
          name: "sortField",
          isRequired: false,
          options: sortFieldOptions,
          id: "sortField"
        },
        {
          name: "sortOrder",
          isRequired: false,
          options: sortOrderOptions,
          id: "sortOrder"
        }
      ],
      extraSupported: ["skip", "year", "sortField", "sortOrder"]
    }
  ],
  idPrefixes: ["tt"]
};

const builder = new addonBuilder(manifest);

// catalog handler
builder.defineCatalogHandler((args) => {
  const skip = parseInt(args.skip || 0);
  const limit = parseInt(args.limit || 100);
  const year = args.extra?.year ? String(args.extra.year) : undefined;
  const sortFieldLabel = args.extra?.sortField || "Default";
  const sortFieldMap = {
    "Default": "default",
    "CineSelect": "cineselect",
    "IMDb": "imdb",
    "RottenTomatoes": "rt",
    "Year": "year",
    "Title A-Z": "title_az",
    "Title Z-A": "title_za"
  };
  const sortField = sortFieldMap[sortFieldLabel] || "default";
  const sortOrder = (args.extra?.sortOrder === "Ascending") ? "asc" : "desc";
  console.log("catalog params => year:", year, "| sortField:", sortFieldLabel, "| sortOrder:", sortOrder);

  function getSortedFiltered(list, type) {
    // Filter by year if provided
    let filtered = list;
    if (year) {
      filtered = filtered.filter(item => String(item.year) === String(year));
    }

    // Sorting logic
    if (sortField && sortField !== "default") {
      filtered = filtered.slice(); // shallow copy
      filtered.sort((a, b) => {
        let aVal, bVal;
        switch (sortField) {
          case "cineselect":
            aVal = a.cineselect ?? 0;
            bVal = b.cineselect ?? 0;
            break;
          case "imdb":
            aVal = a.imdb_rating ?? 0;
            bVal = b.imdb_rating ?? 0;
            break;
          case "rt":
            aVal = a.rt ?? 0;
            bVal = b.rt ?? 0;
            break;
          case "year":
            aVal = parseInt(a.year, 10) || 0;
            bVal = parseInt(b.year, 10) || 0;
            break;
          case "title_az":
            aVal = (a.title || "").toLowerCase();
            bVal = (b.title || "").toLowerCase();
            if (aVal < bVal) return -1;
            if (aVal > bVal) return 1;
            return 0;
          case "title_za":
            aVal = (a.title || "").toLowerCase();
            bVal = (b.title || "").toLowerCase();
            if (aVal < bVal) return 1;
            if (aVal > bVal) return -1;
            return 0;
          default:
            aVal = 0;
            bVal = 0;
        }
        // For numeric sorts
        if (
          ["cineselect", "imdb", "rt", "year"].includes(sortField)
        ) {
          return (bVal - aVal); // default: descending
        }
        // For title_az and title_za handled above
        return 0;
      });
    }
    // Apply sortOrder if needed (for numeric sorts and title sorts)
    if (sortOrder === "asc") {
      filtered = filtered.slice().reverse();
    }
    return filtered;
  }

  if (args.id === "serkan-watchagain-movies") {
    const sorted = getSortedFiltered(movieList, "movie");
    const metas = sorted
      .slice(skip, skip + limit)
      .map((movie) => ({
        id: movie.imdb && movie.imdb.startsWith("tt") ? movie.imdb : "tt" + String(movie.imdb || "").replace(/\D/g, ""),
        type: "movie",
        name: movie.title,
        poster: movie.poster || "",
        description: movie.description || "",
        releaseInfo: movie.year ? String(movie.year) : undefined
      }));
    return Promise.resolve({ metas });
  }

  if (args.id === "serkan-watchagain-series") {
    const sorted = getSortedFiltered(seriesList, "series");
    const metas = sorted
      .slice(skip, skip + limit)
      .map((series) => ({
        id: series.imdb && series.imdb.startsWith("tt") ? series.imdb : "tt" + String(series.imdb || "").replace(/\D/g, ""),
        type: "series",
        name: series.title,
        poster: series.poster || "",
        description: series.description || "",
        releaseInfo: series.year ? String(series.year) : undefined
      }));
    return Promise.resolve({ metas });
  }

  return Promise.resolve({ metas: [] });
});

// HTTP sunucusu (Render veya yerel çalışma için)
serveHTTP(builder.getInterface(), { port: 7010 });
