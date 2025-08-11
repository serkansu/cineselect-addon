const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");
const fs = require("fs");
const path = require("path");

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
  const data = fs.readFileSync(path.join(__dirname, "favorites.json"), "utf8");
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
          options: ["Top", ...movieYears],
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
      extraSupported: ["skip", "limit", "year", "sortField", "sortOrder"]
    },
    {
      type: "series",
      id: "serkan-watchagain-series",
      name: "📺 Serkan's Watch Again Series",
      extra: [
        {
          name: "year",
          isRequired: false,
          options: ["Top", ...seriesYears],
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
      extraSupported: ["skip", "limit", "year", "sortField", "sortOrder"]
    }
  ],
  idPrefixes: ["tt", "tmdb"]
};

const builder = new addonBuilder(manifest);

// catalog handler
builder.defineCatalogHandler((args) => {
  const skip = parseInt(args.skip || 0);
  const limit = 10000; // force single-page response: return up to 10k items in one request
  let year = args.extra?.year ? String(args.extra.year) : undefined;
  if (year === "Top") year = undefined;
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
            aVal = Number(a.cineselectRating) || 0;
            bVal = Number(b.cineselectRating) || 0;
            break;
          case "imdb":
            aVal = Number(a.imdbRating) || 0;
            bVal = Number(b.imdbRating) || 0;
            break;
          case "rt":
            aVal = Number(a.rt) || 0;
            bVal = Number(b.rt) || 0;
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
    // Apply sortOrder appropriately
    if (["cineselect", "imdb", "rt", "year"].includes(sortField)) {
      if (sortOrder === "asc") filtered = filtered.slice().reverse();
    } else if (sortField === "title_az" && sortOrder === "desc") {
      filtered = filtered.slice().reverse();
    } else if (sortField === "title_za" && sortOrder === "asc") {
      filtered = filtered.slice().reverse();
    }
    return filtered;
  }

  if (args.id === "serkan-watchagain-movies") {
    const sorted = getSortedFiltered(movieList, "movie");
    const metas = sorted
      .slice(skip, skip + limit)
      .map((movie, i) => {
        const id = (movie.imdb && movie.imdb.startsWith("tt"))
          ? movie.imdb
          : (movie.id ? String(movie.id)
          : (movie.title ? (movie.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + (movie.year || ""))
          : ("noid-" + (skip + i))));

        return {
          id,
          type: "movie",
          name: movie.title,
          poster: movie.poster || "",
          description: movie.description || "",
          releaseInfo: movie.year ? String(movie.year) : undefined,
          year: movie.year ? parseInt(movie.year, 10) : undefined
        };
      });
    console.log("[catalog] movies skip=", skip, "limit=", limit, "returning=", metas.length);
    return Promise.resolve({ metas });
  }

  if (args.id === "serkan-watchagain-series") {
    const sorted = getSortedFiltered(seriesList, "series");
    const metas = sorted
      .slice(skip, skip + limit)
      .map((series, i) => {
        const id = (series.imdb && series.imdb.startsWith("tt"))
          ? series.imdb
          : (series.id ? String(series.id)
          : (series.title ? (series.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + (series.year || ""))
          : ("noid-" + (skip + i))));

        return {
          id,
          type: "series",
          name: series.title,
          poster: series.poster || "",
          description: series.description || "",
          releaseInfo: series.year ? String(series.year) : undefined,
          year: series.year ? parseInt(series.year, 10) : undefined
        };
      });
    console.log("[catalog] series skip=", skip, "limit=", limit, "returning=", metas.length);
    return Promise.resolve({ metas });
  }

  return Promise.resolve({ metas: [] });
});

// HTTP sunucusu (Render veya yerel çalışma için)
serveHTTP(builder.getInterface(), { port: process.env.PORT || 7010 });
