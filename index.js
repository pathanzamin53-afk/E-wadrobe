/* ==========================================================================
       1. INITIALIZATION & STATE MANAGEMENT (LOCAL STORAGE PERSISTENCE)
       ========================================================================== */
const STORAGE_KEY = "e_wardrobe_items_v2";
const PROFILE_STORAGE_KEY = "e_wardrobe_profile_v1";
const EMPTY_PROFILE = {
  name: "",
  style: "any",
  colors: "",
  avoid: "",
  notes: "",
};

// Sample Starter Data (Base64 SVG Placeholders for seamless rendering)
const SAMPLE_STARTER_ITEMS = [
  {
    id: "sample-1",
    title: "Classic Blue Snapback Cap",
    category: "cap",
    color: "#0284c7",
    pattern: "solid",
    season: "all",
    image:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="%230284c7" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a9 9 0 0 0-9 9c0 2.5 1 4.5 3 6l13 1c2-1.5 3-3.5 3-6a9 9 0 0 0-9-9z"/><path d="M2 17h20"/></svg>',
  },
  {
    id: "sample-2",
    title: "White Cotton Summer Tee",
    category: "top",
    color: "#f8fafc",
    pattern: "solid",
    season: "summer",
    image:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></svg>',
  },
  {
    id: "sample-3",
    title: "Dark Denim Jeans",
    category: "bottom",
    color: "#1e3a8a",
    pattern: "solid",
    season: "all",
    image:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="%231e3a8a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 2h16l-1 20h-5l-2-10-2 10H5L4 2z"/></svg>',
  },
  {
    id: "sample-4",
    title: "Minimalist White Sneakers",
    category: "shoes",
    color: "#ffffff",
    pattern: "solid",
    season: "summer",
    image:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="%2364748b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 18h20v2H2z"/><path d="M4 18V9c0-1.1.9-2 2-2h4l4 4h6a2 2 0 0 1 2 2v5"/></svg>',
  },
  {
    id: "sample-5",
    title: "Heavy Fleece Winter Hoodie",
    category: "layering",
    color: "#475569",
    pattern: "solid",
    season: "winter",
    image:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="%23475569" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3a4 4 0 0 0-8 0L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-5-3z"/></svg>',
  },
  {
    id: "sample-6",
    title: "Beanie Wool Cap",
    category: "cap",
    color: "#7c3aed",
    pattern: "solid",
    season: "winter",
    image:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="%237c3aed" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18h12a4 4 0 0 0 4-4 8 8 0 0 0-16 0 4 4 0 0 0 4 4z"/><path d="M12 2v4"/></svg>',
  },
];

let wardrobeItems = [];
let currentCategoryFilter = "all";
let currentSeasonFilter = "all";
let userProfile = { ...EMPTY_PROFILE };

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

// Initialize Application
window.addEventListener("DOMContentLoaded", () => {
  loadSavedWardrobe();
  loadProfile();
  initTheme();
  drawColorWheel();
  document.querySelectorAll(".modal-backdrop").forEach((modal) => {
    modal.addEventListener("click", (event) => {
      if (event.target !== modal) return;
      if (modal.id === "upload-modal") closeUploadModal();
      if (modal.id === "profile-modal") closeProfileModal();
    });
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (!document.getElementById("upload-modal").classList.contains("hidden")) {
      closeUploadModal();
    }
    if (
      !document.getElementById("profile-modal").classList.contains("hidden")
    ) {
      closeProfileModal();
    }
  });
});

function loadProfile() {
  const savedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
  if (savedProfile) {
    try {
      const parsedProfile = JSON.parse(savedProfile);
      if (
        parsedProfile &&
        typeof parsedProfile === "object" &&
        !Array.isArray(parsedProfile)
      ) {
        userProfile = {
          ...EMPTY_PROFILE,
          ...Object.fromEntries(
            Object.keys(EMPTY_PROFILE).map((key) => [
              key,
              typeof parsedProfile[key] === "string"
                ? parsedProfile[key]
                : EMPTY_PROFILE[key],
            ]),
          ),
        };
        if (
          ![
            "any",
            "minimal",
            "classic",
            "casual",
            "streetwear",
            "sporty",
            "formal",
          ].includes(userProfile.style)
        ) {
          userProfile.style = "any";
        }
      }
    } catch (error) {
      console.error("Could not load the saved style profile.", error);
    }
  }
  updateProfileButton();
}

function updateProfileButton() {
  const label = document.getElementById("profile-button-label");
  if (!label) return;
  label.textContent = userProfile.name.trim() || "Profile";
  label.title = userProfile.name.trim()
    ? `${userProfile.name.trim()}'s style profile`
    : "Your style profile";
}

function openProfileModal() {
  document.getElementById("profile-name").value = userProfile.name;
  document.getElementById("profile-style").value = userProfile.style;
  document.getElementById("profile-colors").value = userProfile.colors;
  document.getElementById("profile-avoid").value = userProfile.avoid;
  document.getElementById("profile-notes").value = userProfile.notes;
  document.getElementById("profile-save-status").classList.add("hidden");
  document.getElementById("profile-save-status").classList.remove("is-error");
  document.getElementById("profile-modal").classList.remove("hidden");
  document.getElementById("profile-name").focus();
}

function closeProfileModal() {
  const modal = document.getElementById("profile-modal");
  if (modal) modal.classList.add("hidden");
}

function saveProfile(event) {
  event.preventDefault();
  const updatedProfile = {
    name: document.getElementById("profile-name").value.trim(),
    style: document.getElementById("profile-style").value,
    colors: document.getElementById("profile-colors").value.trim(),
    avoid: document.getElementById("profile-avoid").value.trim(),
    notes: document.getElementById("profile-notes").value.trim(),
  };

  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updatedProfile));
    userProfile = updatedProfile;
    updateProfileButton();
    const status = document.getElementById("profile-save-status");
    status.textContent =
      "Profile saved. New outfit suggestions will use these preferences.";
    status.classList.remove("hidden", "is-error");
    if (document.querySelector("#ai-outfits-container .outfit-card")) {
      runAIGenerator();
    }
  } catch (error) {
    console.error("Could not save the style profile.", error);
    const status = document.getElementById("profile-save-status");
    status.textContent =
      "Could not save your profile. Check browser storage and try again.";
    status.classList.remove("hidden");
    status.classList.add("is-error");
  }
}

function loadSavedWardrobe() {
  const storedData = localStorage.getItem(STORAGE_KEY);
  if (storedData) {
    try {
      wardrobeItems = JSON.parse(storedData);
    } catch (e) {
      wardrobeItems = [...SAMPLE_STARTER_ITEMS];
    }
  } else {
    wardrobeItems = [...SAMPLE_STARTER_ITEMS];
    saveWardrobeToStorage();
  }
  renderWardrobeGrid();
  updateBadgeCounts();
}

function saveWardrobeToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(wardrobeItems));
  updateBadgeCounts();
  drawColorWheel();
}

function resetToDefaultData() {
  if (confirm("Restore sample wardrobe starter pack?")) {
    wardrobeItems = [...SAMPLE_STARTER_ITEMS];
    saveWardrobeToStorage();
    renderWardrobeGrid();
  }
}

function updateBadgeCounts() {
  document.getElementById("saved-count-badge").innerText =
    `${wardrobeItems.length} items`;
  document.getElementById("items-count-tag").innerText = wardrobeItems.length;
}

/* ==========================================================================
       2. UI & FILTERING FUNCTIONS
       ========================================================================== */
function setCategoryFilter(cat) {
  currentCategoryFilter = cat;
  document.querySelectorAll(".cat-filter-btn").forEach((btn) => {
    const isActive = btn.id === `cat-btn-${cat}`;
    btn.classList.toggle("is-active", isActive);
    btn.setAttribute("aria-pressed", String(isActive));
  });
  renderWardrobeGrid();
}

function setSeasonFilter(season) {
  currentSeasonFilter = season;
  document.querySelectorAll(".season-filter-btn").forEach((btn) => {
    const isActive = btn.id === `season-btn-${season}`;
    btn.classList.toggle("is-active", isActive);
    btn.setAttribute("aria-pressed", String(isActive));
  });
  renderWardrobeGrid();
}

function renderWardrobeGrid() {
  const grid = document.getElementById("wardrobe-grid");
  grid.innerHTML = "";

  const filtered = wardrobeItems.filter((item) => {
    const matchesCategory =
      currentCategoryFilter === "all" ||
      item.category === currentCategoryFilter;
    const matchesSeason =
      currentSeasonFilter === "all" ||
      item.season === "all" ||
      item.season === currentSeasonFilter;
    return matchesCategory && matchesSeason;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
          <div class="empty-state">
            <i class="fa-regular fa-folder-open" aria-hidden="true"></i>
            <p>No pieces match these filters. Try another season or category.</p>
          </div>
        `;
    return;
  }

  filtered.forEach((item) => {
    const card = document.createElement("article");
    card.className = "wardrobe-card";

    const seasonLabel =
      item.season === "summer"
        ? "Summer"
        : item.season === "winter"
          ? "Winter"
          : item.season === "rainy"
            ? "Rainy"
            : "All-season";

    card.innerHTML = `
          <div class="wardrobe-card__media">
            <img src="${escapeHTML(item.image)}" alt="${escapeHTML(item.title)}">
            <span class="wardrobe-card__season">${seasonLabel}</span>
            <button type="button" class="delete-item-btn" aria-label="Delete ${escapeHTML(item.title)}" title="Delete item">
              <i class="fa-solid fa-xmark" aria-hidden="true"></i>
            </button>
          </div>
          <div class="wardrobe-card__details">
            <span class="wardrobe-card__category">${escapeHTML(item.category)}</span>
            <h3 class="wardrobe-card__title" title="${escapeHTML(item.title)}">${escapeHTML(item.title)}</h3>
            <div class="wardrobe-card__meta">
              <span class="color-swatch" style="background-color: ${escapeHTML(item.color)}" aria-hidden="true"></span>
              <span>${escapeHTML(item.pattern)}</span>
            </div>
          </div>
        `;

    card
      .querySelector(".delete-item-btn")
      .addEventListener("click", () => deleteItem(item.id));
    grid.appendChild(card);
  });
}

function deleteItem(id) {
  if (confirm("Delete this garment from wardrobe?")) {
    wardrobeItems = wardrobeItems.filter((item) => item.id !== id);
    saveWardrobeToStorage();
    renderWardrobeGrid();
  }
}

/* ==========================================================================
       3. AI OUTFIT GENERATION ENGINE & COLOR HARMONY CALCULATOR
       ========================================================================== */
function hexToHsl(hex) {
  let r = parseInt(hex.substring(1, 3), 16) / 255;
  let g = parseInt(hex.substring(3, 5), 16) / 255;
  let b = parseInt(hex.substring(5, 7), 16) / 255;

  let max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h,
    s,
    l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function calculateColorHarmony(colorsHex) {
  if (colorsHex.length < 2) return 85;
  const hsls = colorsHex.map(hexToHsl);
  let totalScore = 0;
  let count = 0;

  for (let i = 0; i < hsls.length; i++) {
    for (let j = i + 1; j < hsls.length; j++) {
      const [hueA, saturationA, lightnessA] = hsls[i];
      const [hueB, saturationB, lightnessB] = hsls[j];
      const chromaA =
        (saturationA * Math.min(lightnessA, 100 - lightnessA)) / 50;
      const chromaB =
        (saturationB * Math.min(lightnessB, 100 - lightnessB)) / 50;
      let pairScore = 88;

      if (chromaA >= 14 && chromaB >= 14) {
        let hueDiff = Math.abs(hueA - hueB);
        if (hueDiff > 180) hueDiff = 360 - hueDiff;

        if (hueDiff <= 12) pairScore = 82;
        else if (hueDiff <= 35) pairScore = 94;
        else if (hueDiff <= 70) pairScore = 84;
        else if (hueDiff <= 115) pairScore = 68;
        else if (hueDiff <= 150) pairScore = 82;
        else pairScore = 91;
      }

      const lightnessDiff = Math.abs(lightnessA - lightnessB);
      if (lightnessDiff >= 12 && lightnessDiff <= 55) pairScore += 4;
      else if (lightnessDiff < 7) pairScore -= 5;

      totalScore += Math.min(98, pairScore);
      count++;
    }
  }

  return Math.round(totalScore / count);
}

function getOccasionBonus(item, occasion) {
  const title = item.title.toLowerCase();
  const isPrint = ["graphic", "striped", "checkered"].includes(item.pattern);

  if (occasion === "formal") {
    if (item.category === "cap") return -30;
    if (
      /\b(blazer|suit|dress shirt|button[- ]?down|slacks|trousers|loafer|oxford|derby)\b/.test(
        title,
      )
    )
      return 8;
    if (
      item.category === "top" &&
      /\b(tee|t-shirt|hoodie|sweatshirt|sweater|tank top)\b/.test(title)
    )
      return -24;
    if (
      item.category === "bottom" &&
      /\b(jeans|shorts|sweatpants|joggers)\b/.test(title)
    )
      return -26;
    if (
      item.category === "bottom" &&
      /\b(chinos|trousers|slacks)\b/.test(title)
    )
      return 4;
    if (
      item.category === "shoes" &&
      /\b(sneaker|trainer|running|sandals|flip-flops)\b/.test(title)
    )
      return -20;
    if (
      item.category === "layering" &&
      /\b(hoodie|puffer|bomber|windbreaker)\b/.test(title)
    )
      return -14;
    if (isPrint && item.pattern === "graphic") return -10;
    if (item.pattern === "striped" || item.pattern === "checkered") return -3;
  } else if (occasion === "streetwear") {
    if (item.category === "cap") return 5;
    if (
      /\b(hoodie|bomber|oversized|denim jacket|graphic|high[- ]?top)\b/.test(
        title,
      )
    )
      return 7;
    if (item.pattern === "graphic") return 5;
    if (/\b(dress shirt|suit|slacks|loafer|derby)\b/.test(title)) return -8;
  } else if (occasion === "sporty") {
    if (
      /\b(running|runner|trainer|training|athletic|sport|sneaker)\b/.test(title)
    )
      return 10;
    if (item.category === "shoes" || item.category === "cap") return 3;
  } else if (occasion === "party") {
    if (/\b(blazer|heels|loafer|leather|satin|party|evening)\b/.test(title))
      return 8;
    if (item.pattern === "graphic") return 2;
  } else if (occasion === "casual") {
    if (/\b(tee|t-shirt|jeans|sneaker|hoodie|casual)\b/.test(title)) return 5;
  }

  return 0;
}

function getColorFamily(hex) {
  const [hue, saturation, lightness] = hexToHsl(hex);
  if (saturation < 16) {
    if (lightness < 18) return "black";
    if (lightness > 87) return "white";
    return "gray";
  }
  if (hue < 15 || hue >= 345) return "red";
  if (hue < 40) return lightness < 38 ? "brown" : "orange";
  if (hue < 68) return lightness > 67 ? "beige" : "yellow";
  if (hue < 165) return "green";
  if (hue < 195) return "teal";
  if (hue < 255) return lightness < 38 ? "navy" : "blue";
  if (hue < 290) return "purple";
  return "pink";
}

function profileColorMatches(preferredColor, itemColorFamily) {
  const colorFamily = preferredColor.toLowerCase();
  if (colorFamily === "blue")
    return itemColorFamily === "blue" || itemColorFamily === "navy";
  if (colorFamily === "grey") return itemColorFamily === "gray";
  if (colorFamily === "neutral")
    return ["black", "white", "gray", "beige", "brown", "navy"].includes(
      itemColorFamily,
    );
  return colorFamily === itemColorFamily;
}

function getProfileAvoidPenalty(item) {
  const title = item.title.toLowerCase();
  const category = item.category;
  const profileAvoid = userProfile.avoid.toLowerCase();
  const notes = userProfile.notes.toLowerCase();
  const colorFamily = getColorFamily(item.color);
  let penalty = 0;

  const avoidRules = [
    {
      pattern: /\b(caps?|hats?|beanies?|headwear)\b/,
      matches: category === "cap",
    },
    {
      pattern: /\b(shoes?|sneakers?|footwear)\b/,
      matches: category === "shoes",
    },
    {
      pattern: /\b(jackets?|outerwear|layers?)\b/,
      matches: category === "layering",
    },
    {
      pattern: /\b(prints?|graphic prints?|patterns?)\b/,
      matches: item.pattern !== "solid",
    },
    {
      pattern: /\b(bright colors?|bright|neon)\b/,
      matches: hexToHsl(item.color)[1] > 65,
    },
    {
      pattern:
        /\b(red|orange|yellow|green|teal|blue|navy|purple|pink|brown|beige|white|black|gray|grey)\b/,
      matches: false,
    },
  ];

  avoidRules.forEach(({ pattern, matches }) => {
    if (matches && pattern.test(profileAvoid)) penalty -= 20;
  });

  const colorNames = [
    "red",
    "orange",
    "yellow",
    "green",
    "teal",
    "blue",
    "navy",
    "purple",
    "pink",
    "brown",
    "beige",
    "white",
    "black",
    "gray",
    "grey",
    "neutral",
  ];
  const avoidedColors = colorNames.filter((color) =>
    new RegExp(`\\b${color}\\b`).test(profileAvoid),
  );
  if (avoidedColors.some((color) => profileColorMatches(color, colorFamily))) {
    penalty -= 20;
  }

  const noteAvoidsCaps =
    /\b(no|avoid|without|don't like|do not like)\s+(?:any\s+)?(caps?|hats?|beanies?|headwear)\b/.test(
      notes,
    );
  const noteAvoidsPrints =
    /\b(no|avoid|without|don't like|do not like)\s+(?:any\s+)?(prints?|patterns?)\b/.test(
      notes,
    );
  if (noteAvoidsCaps && category === "cap") penalty -= 16;
  if (noteAvoidsPrints && item.pattern !== "solid") penalty -= 16;

  return penalty;
}

function getProfilePreferenceScore(item) {
  const style = userProfile.style;
  const title = item.title.toLowerCase();
  const notes = userProfile.notes.toLowerCase();
  const pattern = item.pattern;
  const colorFamily = getColorFamily(item.color);
  const colorNames = [
    "red",
    "orange",
    "yellow",
    "green",
    "teal",
    "blue",
    "navy",
    "purple",
    "pink",
    "brown",
    "beige",
    "white",
    "black",
    "gray",
    "grey",
    "neutral",
  ];
  const preferredColors = colorNames.filter((color) =>
    new RegExp(`\\b${color}\\b`).test(userProfile.colors.toLowerCase()),
  );
  let score = 0;

  if (
    preferredColors.some((color) => profileColorMatches(color, colorFamily))
  ) {
    score += 6;
  }

  const styleRules = {
    minimal: pattern === "solid" ? 5 : pattern === "graphic" ? -7 : 0,
    classic: /\b(oxford|blazer|chinos|trousers|loafers?|classic|denim)\b/.test(
      title,
    )
      ? 5
      : 0,
    casual: /\b(tee|t-shirt|jeans|sneakers?|hoodie|casual)\b/.test(title)
      ? 5
      : 0,
    streetwear:
      /\b(hoodie|bomber|oversized|graphic|high[- ]?top|cap)\b/.test(title) ||
      item.category === "cap"
        ? 6
        : 0,
    sporty: /\b(running|runner|trainer|training|athletic|sport|sneaker)\b/.test(
      title,
    )
      ? 6
      : 0,
    formal:
      /\b(blazer|suit|dress shirt|button[- ]?down|slacks|trousers|loafer|oxford|derby)\b/.test(
        title,
      )
        ? 6
        : 0,
  };
  score += styleRules[style] || 0;

  if (/\b(simple|minimal|clean|plain)\b/.test(notes) && pattern === "solid")
    score += 3;
  if (
    /\b(light layers?|layering)\b/.test(notes) &&
    item.category === "layering"
  )
    score += 4;
  return score + getProfileAvoidPenalty(item);
}

function scoreOutfit(combo, occasion) {
  const coreHarmony = calculateColorHarmony([
    combo.top.color,
    combo.bottom.color,
  ]);
  const fullHarmony = calculateColorHarmony(
    combo.items.map((item) => item.color),
  );
  let score = Math.round(coreHarmony * 0.65 + fullHarmony * 0.35);
  const statementPatterns = combo.items.filter((item) =>
    ["graphic", "striped", "checkered"].includes(item.pattern),
  ).length;

  score +=
    statementPatterns === 0
      ? 2
      : statementPatterns > 1
        ? -(statementPatterns - 1) * 7
        : 0;
  const occasionBonuses = combo.items.map((item) =>
    getOccasionBonus(item, occasion),
  );
  const positiveStyleBonus = occasionBonuses
    .filter((bonus) => bonus > 0)
    .reduce((total, bonus) => total + bonus, 0);
  const stylePenalty = occasionBonuses
    .filter((bonus) => bonus < 0)
    .reduce((total, bonus) => total + bonus, 0);
  score += Math.round(positiveStyleBonus * 0.15 + stylePenalty * 0.65);
  score += combo.items.reduce(
    (total, item) => total + getProfilePreferenceScore(item),
    0,
  );

  if (currentSeasonFilter === "all") {
    const seasonalItems = combo.items.filter((item) => item.season !== "all");
    for (let i = 0; i < seasonalItems.length; i++) {
      for (let j = i + 1; j < seasonalItems.length; j++) {
        if (seasonalItems[i].season !== seasonalItems[j].season) score -= 10;
      }
    }
  } else if (combo.layering) {
    if (currentSeasonFilter === "winter" || currentSeasonFilter === "rainy")
      score += 4;
    if (currentSeasonFilter === "summer") score -= 5;
  }

  return Math.min(99, Math.max(45, score));
}

function getAccessoryOptions(items, top, bottom, category, occasion) {
  const bestOptions = items
    .map((item, index) => ({
      item,
      index,
      score: scoreOutfit(
        {
          items: [top, bottom, item],
          top,
          bottom,
          shoe: category === "shoes" ? item : null,
          cap: category === "cap" ? item : null,
          layering: category === "layering" ? item : null,
        },
        occasion,
      ),
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 2)
    .map(({ item }) => item);

  return [null, ...bestOptions];
}

function chooseDiverseOutfits(candidates) {
  const selected = [];
  const remaining = [...candidates].sort((a, b) => b.score - a.score);

  while (selected.length < 3 && remaining.length) {
    let bestIndex = 0;
    let bestRank = -Infinity;

    remaining.forEach((candidate, index) => {
      const candidateIds = new Set(candidate.items.map((item) => item.id));
      const diversityPenalty = selected.reduce((penalty, previous) => {
        const sameCore =
          candidate.top.id === previous.top.id &&
          candidate.bottom.id === previous.bottom.id;
        const sharedItems = previous.items.filter((item) =>
          candidateIds.has(item.id),
        ).length;
        return Math.max(penalty, (sameCore ? 14 : 0) + sharedItems * 2);
      }, 0);
      const rank = candidate.score - diversityPenalty;

      if (rank > bestRank) {
        bestRank = rank;
        bestIndex = index;
      }
    });

    selected.push(remaining.splice(bestIndex, 1)[0]);
  }

  return selected;
}

function setAIGeneratorStatus(message, isError = false) {
  const status = document.getElementById("ai-status");
  status.textContent = message;
  status.classList.toggle("is-error", isError);
}

function setAIGeneratorLoading(isLoading) {
  const button = document.getElementById("generate-btn");
  button.disabled = isLoading;
  button.querySelector("span").textContent = isLoading
    ? "Finding outfit ideas..."
    : "Suggest outfits";
}

function runAIGenerator() {
  if (document.getElementById("generate-btn").disabled) return;
  const selectedOccasion = document.getElementById("ai-occasion-select").value;

  const seasonItems = wardrobeItems.filter(
    (item) =>
      currentSeasonFilter === "all" ||
      item.season === "all" ||
      item.season === currentSeasonFilter,
  );

  const isFormalReady = (item) => {
    const title = item.title.toLowerCase();
    if (item.pattern === "graphic") return false;
    if (item.category === "top") {
      return !/\b(tee|t-shirt|hoodie|sweatshirt|sweater|tank top)\b/.test(
        title,
      );
    }
    if (item.category === "bottom") {
      return !/\b(jeans|shorts|sweatpants|joggers)\b/.test(title);
    }
    if (item.category === "shoes") {
      return !/\b(sneakers?|trainers?|running|sandals?|flip-flops)\b/.test(
        title,
      );
    }
    if (item.category === "layering") {
      return !/\b(hoodie|puffer|bomber|windbreaker)\b/.test(title);
    }
    return item.category !== "cap";
  };
  const availableItems =
    selectedOccasion === "formal"
      ? seasonItems.filter(isFormalReady)
      : seasonItems;

  const caps = availableItems.filter((i) => i.category === "cap");
  const tops = availableItems.filter((i) => i.category === "top");
  const bottoms = availableItems.filter((i) => i.category === "bottom");
  const shoes = availableItems.filter((i) => i.category === "shoes");
  const layerings = availableItems.filter((i) => i.category === "layering");

  if (tops.length === 0 || bottoms.length === 0) {
    alert(
      selectedOccasion === "formal"
        ? "No formal-ready Top and Bottom found. Add items such as a shirt and chinos, or choose another occasion."
        : "Please add at least 1 Top and 1 Bottom to generate outfit combinations.",
    );
    setAIGeneratorStatus("Add at least one top and one bottom to get outfit ideas.", true);
    return;
  }

  setAIGeneratorStatus("");
  setAIGeneratorLoading(true);

  const candidates = [];

  tops.forEach((top) => {
    bottoms.forEach((bottom) => {
      const shoeOptions = shoes.length
        ? getAccessoryOptions(
            shoes,
            top,
            bottom,
            "shoes",
            selectedOccasion,
          ).filter(Boolean)
        : [null];
      const capOptions =
        selectedOccasion === "formal"
          ? [null]
          : getAccessoryOptions(caps, top, bottom, "cap", selectedOccasion);
      const layeringOptions = getAccessoryOptions(
        layerings,
        top,
        bottom,
        "layering",
        selectedOccasion,
      );

      shoeOptions.forEach((shoe) => {
        capOptions.forEach((cap) => {
          layeringOptions.forEach((layering) => {
            const combo = {
              items: [top, bottom, shoe, cap, layering].filter(Boolean),
              top,
              bottom,
              shoe,
              cap,
              layering,
            };
            combo.score = scoreOutfit(combo, selectedOccasion);
            candidates.push(combo);
          });
        });
      });
    });
  });

  const localOutfits = chooseDiverseOutfits(candidates);
  renderTopOutfits(localOutfits, selectedOccasion, "local");
  requestGroqOutfits(availableItems, selectedOccasion, localOutfits);
}

async function requestGroqOutfits(availableItems, occasion, localOutfits) {
  try {
    const response = await fetch("/api/outfits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        occasion,
        profile: {
          style: userProfile.style,
          colors: userProfile.colors,
          avoid: userProfile.avoid,
        },
        items: availableItems.map(({ id, title, category, color, pattern, season }) => ({
          id,
          title,
          category,
          color,
          pattern,
          season,
        })),
      }),
    });

    let result;
    try {
      result = await response.json();
    } catch {
      throw new Error("The outfit server returned an invalid response.");
    }

    if (!response.ok) {
      throw new Error(
        typeof result.error === "string"
          ? result.error
          : `The outfit server returned HTTP ${response.status}.`,
      );
    }
    if (!Array.isArray(result.outfits) || result.outfits.length === 0 || result.outfits.length > 3) {
      throw new Error("The outfit server returned an invalid outfit list.");
    }

    const itemsById = new Map(availableItems.map((item) => [item.id, item]));
    const aiOutfits = result.outfits.map((suggestion) => {
      if (
        !suggestion ||
        !Array.isArray(suggestion.itemIds) ||
        suggestion.itemIds.length < 2 ||
        suggestion.itemIds.length > 5 ||
        new Set(suggestion.itemIds).size !== suggestion.itemIds.length ||
        typeof suggestion.reason !== "string"
      ) {
        throw new Error("The outfit server returned an invalid outfit.");
      }

      const items = suggestion.itemIds.map((id) => {
        if (!itemsById.has(id)) {
          throw new Error("The outfit server selected an item outside your wardrobe.");
        }
        return itemsById.get(id);
      });
      const categories = items.map((item) => item.category);
      if (
        categories.filter((category) => category === "top").length !== 1 ||
        categories.filter((category) => category === "bottom").length !== 1 ||
        new Set(categories).size !== categories.length
      ) {
        throw new Error("The outfit server returned an invalid outfit combination.");
      }

      const combo = {
        items,
        top: items.find((item) => item.category === "top"),
        bottom: items.find((item) => item.category === "bottom"),
        shoe: items.find((item) => item.category === "shoes") || null,
        cap: items.find((item) => item.category === "cap") || null,
        layering: items.find((item) => item.category === "layering") || null,
        reason: suggestion.reason.slice(0, 240),
      };
      combo.score = scoreOutfit(combo, occasion);
      return combo;
    });

    renderTopOutfits(aiOutfits, occasion, "groq");
    setAIGeneratorStatus("Groq picked these combinations from your wardrobe.");
  } catch (error) {
    console.error("Could not generate Groq outfit suggestions.", error);
    renderTopOutfits(localOutfits, occasion, "local");
    document.getElementById("combos-found-tag").textContent =
      `${localOutfits.length} outfits · Local picks`;
    const message = error instanceof TypeError
      ? "Could not reach the outfit server. Run node --env-file=.env.local server.js, then open http://127.0.0.1:3000."
      : `${error.message} Showing locally ranked picks instead.`;
    setAIGeneratorStatus(message, true);
  } finally {
    setAIGeneratorLoading(false);
  }
}

function renderTopOutfits(combos, occasion, source = "groq") {
  const container = document.getElementById("ai-outfits-container");
  container.innerHTML = "";

  document.getElementById("combos-found-tag").innerText =
    `${combos.length} ${combos.length === 1 ? "outfit" : "outfits"} · ${source === "groq" ? "Groq AI" : "Local picks"}`;

  combos.forEach((combo, index) => {
    const card = document.createElement("div");
    card.className = "outfit-card";

    card.innerHTML = `
          <div class="outfit-card__header">
            <span class="outfit-card__rank">
              <span class="outfit-card__number">${String(index + 1).padStart(2, "0")}</span>
              <span>${source === "groq" ? "Groq stylist" : "Suggested look"}</span>
            </span>
            <div class="outfit-card__score">
              <i class="fa-solid fa-circle-check" aria-hidden="true"></i>
              <span>Score ${combo.score}/100</span>
            </div>
          </div>

          <div class="outfit-card__items">
            ${combo.items
              .map(
                (item) => `
              <div class="outfit-item">
                <img src="${escapeHTML(item.image)}" alt="${escapeHTML(item.title)}">
                <span title="${escapeHTML(item.title)}">${escapeHTML(item.title)}</span>
              </div>
            `,
              )
              .join("")}
          </div>

          <p class="outfit-card__note">${escapeHTML(combo.reason || generateStylingTip(combo, occasion))}</p>
        `;

    container.appendChild(card);
  });
}

function generateStylingTip(combo, occasion) {
  const occasionLabels = {
    casual: "Everyday",
    streetwear: "Streetwear",
    formal: "Work & formal",
    sporty: "Sport & active",
    party: "Evening",
  };
  const occasionLabel = occasionLabels[occasion] || "Outfit";
  return `${occasionLabel}: ${combo.items.map((item) => item.title).join(" + ")}.`;
}

/* ==========================================================================
       4. CANVAS COLOR WHEEL VISUALIZER
       ========================================================================== */
function drawColorWheel() {
  const canvas = document.getElementById("color-wheel-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const radius = canvas.width / 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw chromatic radial gradient
  for (let angle = 0; angle < 360; angle += 1) {
    let startAngle = ((angle - 2) * Math.PI) / 180;
    let endAngle = ((angle + 2) * Math.PI) / 180;
    ctx.beginPath();
    ctx.moveTo(radius, radius);
    ctx.arc(radius, radius, radius - 4, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = `hsl(${angle}, 80%, 55%)`;
    ctx.fill();
  }

  // Draw Inner Circle cutout
  ctx.beginPath();
  ctx.arc(radius, radius, radius - 18, 0, 2 * Math.PI);
  ctx.fillStyle =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--surface")
      .trim() || "#fffefa";
  ctx.fill();

  // Plot wardrobe color points
  wardrobeItems.forEach((item) => {
    const [h, s, l] = hexToHsl(item.color);
    const rad = ((h - 90) * Math.PI) / 180;
    const dist = radius - 11;
    const x = radius + dist * Math.cos(rad);
    const y = radius + dist * Math.sin(rad);

    ctx.beginPath();
    ctx.arc(x, y, 4, 0, 2 * Math.PI);
    ctx.fillStyle = item.color;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5;
    ctx.fill();
    ctx.stroke();
  });
}

/* ==========================================================================
       5. MODAL & IMAGE FILE HANDLING
       ========================================================================== */
let currentUploadedDataUrl = null;

function openUploadModal() {
  document.getElementById("upload-modal").classList.remove("hidden");
  document.getElementById("item-title").focus();
}

function closeUploadModal() {
  document.getElementById("upload-modal").classList.add("hidden");
  clearPreviewImage();
}

function previewSelectedImage(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    currentUploadedDataUrl = e.target.result;
    document.getElementById("image-preview").src = currentUploadedDataUrl;
    document.getElementById("upload-placeholder").classList.add("hidden");
    document.getElementById("preview-wrapper").classList.remove("hidden");

    // Auto extract dominant color using Canvas HTML5
    extractDominantColor(currentUploadedDataUrl);
  };
  reader.readAsDataURL(file);
}

function clearPreviewImage(event) {
  if (event) event.stopPropagation();
  currentUploadedDataUrl = null;
  document.getElementById("item-image-file").value = "";
  document.getElementById("upload-placeholder").classList.remove("hidden");
  document.getElementById("preview-wrapper").classList.add("hidden");
}

function extractDominantColor(dataUrl) {
  const img = new Image();
  img.onload = function () {
    const cvs = document.createElement("canvas");
    const ctx = cvs.getContext("2d");
    cvs.width = 50;
    cvs.height = 50;
    ctx.drawImage(img, 0, 0, 50, 50);

    const imgData = ctx.getImageData(0, 0, 50, 50).data;
    let r = 0,
      g = 0,
      b = 0,
      count = 0;

    for (let i = 0; i < imgData.length; i += 16) {
      r += imgData[i];
      g += imgData[i + 1];
      b += imgData[i + 2];
      count++;
    }

    r = Math.round(r / count);
    g = Math.round(g / count);
    b = Math.round(b / count);

    const hex =
      "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    document.getElementById("item-color").value = hex;
    document.getElementById("color-hex-text").innerText = hex;
  };
  img.src = dataUrl;
}

function handleFormSubmit(event) {
  event.preventDefault();

  const title = document.getElementById("item-title").value.trim();
  const category = document.getElementById("item-category").value;
  const color = document.getElementById("item-color").value;
  const pattern = document.getElementById("item-pattern").value;
  const season = document.getElementById("item-season").value;

  const defaultPlaceholderSvg =
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="%236366f1" stroke-width="1.5"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></svg>';

  const newItem = {
    id: "item-" + Date.now(),
    title: title || "Garment Item",
    category,
    color,
    pattern,
    season,
    image: currentUploadedDataUrl || defaultPlaceholderSvg,
  };

  wardrobeItems.unshift(newItem);
  saveWardrobeToStorage();
  renderWardrobeGrid();
  closeUploadModal();
}

/* ==========================================================================
       6. BACKUP / EXPORT / IMPORT (JSON DATA PERSISTENCE)
       ========================================================================== */
function exportWardrobeData() {
  const dataStr =
    "data:text/json;charset=utf-8," +
    encodeURIComponent(JSON.stringify(wardrobeItems, null, 2));
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute(
    "download",
    `e_wardrobe_backup_${new Date().toISOString().slice(0, 10)}.json`,
  );
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

function importWardrobeData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (Array.isArray(imported)) {
        wardrobeItems = imported;
        saveWardrobeToStorage();
        renderWardrobeGrid();
        alert("Wardrobe backup successfully restored!");
      }
    } catch (err) {
      alert("Invalid JSON backup file format.");
    }
  };
  reader.readAsText(file);
}

/* ==========================================================================
       7. THEME MANAGER
       ========================================================================== */
function initTheme() {
  const themeToggleBtn = document.getElementById("theme-toggle");
  if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    document.documentElement.classList.add("dark");
  }
  themeToggleBtn.setAttribute(
    "aria-pressed",
    String(document.documentElement.classList.contains("dark")),
  );
  themeToggleBtn.addEventListener("click", () => {
    document.documentElement.classList.toggle("dark");
    themeToggleBtn.setAttribute(
      "aria-pressed",
      String(document.documentElement.classList.contains("dark")),
    );
    drawColorWheel();
  });
}

document.getElementById("item-color").addEventListener("input", (e) => {
  document.getElementById("color-hex-text").innerText = e.target.value;
});
