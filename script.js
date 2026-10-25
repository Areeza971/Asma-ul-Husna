
const arabicName = document.getElementById("arabicName");
const englishName = document.getElementById("englishName");
const meaning = document.getElementById("meaning");
const reflection = document.getElementById("reflection");
const actionText = document.getElementById("action");
const nameNumber = document.getElementById("nameNumber");

const favoriteButton = document.getElementById("favoriteButton");
const shuffleButton = document.getElementById("shuffleButton");
const searchInput = document.getElementById("searchInput");
const nameGrid = document.getElementById("nameGrid");
const resultCount = document.getElementById("resultCount");
const emptyMessage = document.getElementById("emptyMessage");
const favoritesFilter = document.getElementById("favoritesFilter");

let names = [];
let currentName = null;
let previousNumber = null;
let showingFavorites = false;

function loadFavorites() {
  try {
    const saved = JSON.parse(
      localStorage.getItem("asmaFavorites") || "[]"
    );

    if (!Array.isArray(saved)) {
      return new Set();
    }

    return new Set(
      saved.filter(
        number => Number.isInteger(number) &&
        number >= 1 &&
        number <= 99
      )
    );
  } catch (error) {
    console.warn("Could not read saved favorites.", error);
    return new Set();
  }
}

let favorites = loadFavorites();

function saveFavorites() {
  try {
    localStorage.setItem(
      "asmaFavorites",
      JSON.stringify([...favorites])
    );
  } catch (error) {
    console.warn("Could not save favorites.", error);
  }
}

function showName(name) {
  if (!name) return;

  currentName = name;

  arabicName.textContent = name.arabic;
  englishName.textContent = name.transliteration;
  meaning.textContent = name.meaning;
  reflection.textContent = name.reflection;
  actionText.textContent = name.action;

  nameNumber.textContent =
    `${String(name.number).padStart(2, "0")} / 99`;

  const isFavorite = favorites.has(name.number);

  favoriteButton.textContent = isFavorite ? "♥" : "♡";
  favoriteButton.setAttribute(
    "aria-pressed",
    String(isFavorite)
  );

  favoriteButton.setAttribute(
    "aria-label",
    isFavorite
      ? "Remove from favorites"
      : "Add to favorites"
  );
}

function shuffleName() {
  if (names.length === 0) return;

  let choices = names.filter(
    name => name.number !== previousNumber
  );

  if (choices.length === 0) {
    choices = names;
  }

  const randomIndex = Math.floor(Math.random() * choices.length);
  const chosenName = choices[randomIndex];

  previousNumber = chosenName.number;
  showName(chosenName);

  // Keep the featured card visible without jumping the page.
  document.getElementById("featured").scrollIntoView({
    behavior: window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches ? "auto" : "smooth",
    block: "center"
  });
}

function toggleFavorite() {
  if (!currentName) return;

  const number = currentName.number;

  if (favorites.has(number)) {
    favorites.delete(number);
  } else {
    favorites.add(number);
  }

  saveFavorites();
  showName(currentName);
  renderNames();
}

function createNameCard(name) {
  const tile = document.createElement("button");

  tile.type = "button";
  tile.className = "name-tile";

  tile.setAttribute(
    "aria-label",
    `${name.transliteration}: ${name.meaning}`
  );

  const number = document.createElement("span");
  number.className = "tile-number";
  number.textContent = String(name.number).padStart(2, "0");

  const arabic = document.createElement("div");
  arabic.className = "tile-arabic";
  arabic.lang = "ar";
  arabic.dir = "rtl";
  arabic.textContent = name.arabic;

  const title = document.createElement("div");
  title.className = "tile-title";
  title.textContent = name.transliteration;

  const description = document.createElement("div");
  description.className = "tile-meaning";
  description.textContent = name.meaning;

  tile.append(number, arabic, title, description);

  tile.addEventListener("click", () => {
    showName(name);

    document.getElementById("featured").scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  });

  return tile;
}

function renderNames() {
  const query = searchInput.value.trim().toLowerCase();

  const filteredNames = names.filter(name => {
    const matchesSearch = [
      name.arabic,
      name.transliteration,
      name.meaning
    ].some(value =>
      String(value).toLowerCase().includes(query)
    );

    const matchesFavorites =
      !showingFavorites || favorites.has(name.number);

    return matchesSearch && matchesFavorites;
  });

  const cards = filteredNames.map(createNameCard);

  nameGrid.replaceChildren(...cards);

  resultCount.textContent =
    `${filteredNames.length} ${
      filteredNames.length === 1 ? "name" : "names"
    }`;

  emptyMessage.hidden = filteredNames.length !== 0;
}

function toggleFavoritesFilter() {
  showingFavorites = !showingFavorites;

  favoritesFilter.setAttribute(
    "aria-pressed",
    String(showingFavorites)
  );

  favoritesFilter.textContent =
    showingFavorites ? "♥ Showing Favorites" : "♡ Favorites";

  renderNames();
}

async function initialize() {
  try {
    resultCount.textContent = "Loading names...";

    const response = await fetch("data/names.json");

    if (!response.ok) {
      throw new Error(
        `Could not load names.json: HTTP ${response.status}`
      );
    }

    const loadedNames = await response.json();

    if (!Array.isArray(loadedNames) || loadedNames.length !== 99) {
      throw new Error(
        "Expected a JSON array containing exactly 99 entries."
      );
    }

    const numbers = new Set();

    for (const name of loadedNames) {
      if (
        !Number.isInteger(name.number) ||
        name.number < 1 ||
        name.number > 99 ||
        typeof name.arabic !== "string" ||
        typeof name.transliteration !== "string" ||
        typeof name.meaning !== "string" ||
        typeof name.reflection !== "string" ||
        typeof name.action !== "string"
      ) {
        throw new Error(
          "A name entry is missing required fields or has invalid data."
        );
      }

      if (numbers.has(name.number)) {
        throw new Error(`Duplicate name number: ${name.number}`);
      }

      numbers.add(name.number);
    }

    if (numbers.size !== 99) {
      throw new Error(
        "Name numbers must cover all positions from 1 to 99."
      );
    }

    names = loadedNames.slice().sort(
      (a, b) => a.number - b.number
    );

    showName(names[0]);
    renderNames();
  } catch (error) {
    console.error("Asma ul Husna loading error:", error);

    resultCount.textContent = "Unable to load the names.";

    emptyMessage.hidden = false;
    emptyMessage.textContent =
      "Check that data/names.json contains 99 valid entries and run this site with VS Code Live Server.";
  }
}

shuffleButton.addEventListener("click", shuffleName);
favoriteButton.addEventListener("click", toggleFavorite);
searchInput.addEventListener("input", renderNames);
favoritesFilter.addEventListener("click", toggleFavoritesFilter);

initialize();
