// --- Global Game State Variables ---
let gameMode = 'classic';           // Current game mode (classic, blitz, endless, hardcore)
let score = 0;                      // Player's score
let lives = 3;                      // Player's lives
let currency = 0;                   // In-game currency
let timer = 30;     // Time left in timed modes
let timerInterval;                  // Interval ID for the game timer
let currentLevel = 1;               // Current level for classic mode AND other modes
let targetScore = 0;                // Score needed to complete a classic level
let shapeSpawnIntervalId;           // Interval ID for automated shape spawning in non-classic modes
let currentCountdownSpeed = 1000;          // The actual interval duration for the main timer (in milliseconds)
let isPaused = false;               // New variable to track pause state
let pausedTimerValue;               // Store timer value when paused
let pausedShapeSpawnInterval;       // Store original spawn interval when paused
let currentTheme = localStorage.getItem('selectedTheme') || 'neon'; // Load saved theme or default to 'neon'

// New: User related variable
let userName = localStorage.getItem('userName') || 'Guest'; // Load saved name or 'Guest'




// Ad-related variables
let gamesPlayedSinceLastAd = parseInt(localStorage.getItem('gamesPlayedSinceLastAd') || '0');
const AD_INTERVAL_GAMES = 3; // Show ad after every 3 gameplay actions (level wins or losses)
const AD_DISPLAY_DURATION = 5000; // 5 seconds for simulated ad


// --- Tone.js Sound References ---
// Initialize Tone.js Synths for sound effects (connected directly to destination)
const correctSynth = new Tone.MembraneSynth().toDestination();
const wrongSynth = new Tone.NoiseSynth().toDestination();
const levelUpSynth = new Tone.Synth().toDestination();
const winSynth = new Tone.Synth().toDestination();
const loseSynth = new Tone.Synth().toDestination();
const clickSynth = new Tone.Synth().toDestination(); // New: Synth for button clicks



// New: Tone.Volume node specifically for background music (connected to master output)
let bgmVolumeNode = new Tone.Volume(-10).toDestination(); // -10dB default volume for BGM

// New: Dedicated synth for background music, connected to its volume node
const bgmSynth = new Tone.MembraneSynth().connect(bgmVolumeNode); // BGM synth connects to its dedicated volume node

// Background Music Loop - declared globally, initialized in startToneContext
let backgroundMusicLoop = null;

// Set initial volumes for Tone.js synths
correctSynth.volume.value = -10; // dB
wrongSynth.volume.value = -10;
levelUpSynth.volume.value = -8;
winSynth.volume.value = -6;
loseSynth.volume.value = -6;
clickSynth.volume.value = -15; // Set volume for button clicks


// --- Sound Controls UI Elements ---
const bgMusicToggle = document.getElementById("bg-music-toggle");
const bgMusicVolume = document.getElementById("bg-music-volume");


// --- Centralized Theme Data (Skins) ---
const allThemes = {
  neon: {
    name: "Neon",
    cost: 0, // Free
    shapeColors: {
      circle: { color: "#00ffff", shadow: "#00ffff" },     // Cyan
      cube: { color: "#ff00ff", shadow: "#ff00ff" },       // Pink
      triangle: { color: "#ffff00", shadow: "#ffff00" },   // Yellow
      diamond: { color: "#ff6600", shadow: "#ff6600" },    // Safety Orange
      hex: { color: "#00ff00", shadow: "#00ff00" },        // Green
      star: { color: "#ff4444", shadow: "#ff4444" }        // Crimson Red
    },
    background: '#0d0d0d',
    buttonShadow: '#00ffff'
  },
  pastel: {
    name: "Pastel",
    cost: 100, // Example cost
    shapeColors: {
      circle: { color: "#a7edeb", shadow: "#7fc9c7" },     // Pastel Cyan
      cube: { color: "#fccde2", shadow: "#d9b3cb" },       // Pastel Pink
      triangle: { color: "#fff7b0", shadow: "#e6d78c" },   // Pastel Yellow
      diamond: { color: "#ffcf99", shadow: "#d9ae80" },    // Pastel Orange
      hex: { color: "#b3ffb3", shadow: "#99d999" },        // Pastel Green
      star: { color: "#ff9999", shadow: "#d98080" }        // Pastel Red
    },
    background: '#f0f4f8',
    buttonShadow: '#a7edeb'
  },
  cyberpunk: {
    name: "Cyberpunk",
    cost: 250,
    shapeColors: {
        circle: { color: "#39ff14", shadow: "#39ff14" },   // Neon Green
        cube: { color: "#da00ff", shadow: "#da00ff" },     // Cyber Purple
        triangle: { color: "#00ffff", shadow: "#00ffff" }, // Aqua
        diamond: { color: "#ff4d4d", shadow: "#ff4d4d" },  // Glitch Red
        hex: { color: "#ffee00", shadow: "#ffee00" },      // Electric Yellow
        star: { color: "#ff007f", shadow: "#ff007f" }      // Deep Pink
    },
    background: '#1a0f2b', // Dark, moody background
    buttonShadow: '#00ffee'
  },
  forest: {
    name: "Forest",
    cost: 400,
    shapeColors: {
        circle: { color: "#8bc34a", shadow: "#689f38" },   // Light Green
        cube: { color: "#4caf50", shadow: "#388e3c" },     // Medium Green
        triangle: { color: "#2e7d32", shadow: "#1b5e20" }, // Dark Green
        diamond: { color: "#aed581", shadow: "#7cb342" },  // Lime Green
        hex: { color: "#cddc39", shadow: "#afb42b" },      // Yellow Green
        star: { color: "#6d4c41", shadow: "#4e342e" }      // Brown
    },
    background: '#33691e', // Deep forest green
    buttonShadow: '#8bc34a'
  },
  ocean: {
    name: "Ocean",
    cost: 600,
    shapeColors: {
        circle: { color: "#2196f3", shadow: "#1976d2" },   // Blue
        cube: { color: "#03a9f4", shadow: "#0288d1" },     // Light Blue
        triangle: { color: "#00bcd4", shadow: "#0097a7" }, // Cyan
        diamond: { color: "#81d4fa", shadow: "#4fc3f7" },  // Sky Blue
        hex: { color: "#4db6ac", shadow: "#26a69a" },      // Teal
        star: { color: "#00796b", shadow: "#004d40" }      // Dark Teal
    },
    background: '#01579b', // Deep ocean blue
    buttonShadow: '#2196f3'
  },
  lava: {
    name: "Lava",
    cost: 850,
    shapeColors: {
        circle: { color: "#ffab00", shadow: "#ff6f00" },   // Amber
        cube: { color: "#ff6d00", shadow: "#e65100" },     // Orange
        triangle: { color: "#ff3d00", shadow: "#dd2c00" }, // Deep Orange
        diamond: { color: "#d50000", shadow: "#b71c1c" },  // Red
        hex: { color: "#f4511e", shadow: "#bf360c" },      // Burnt Orange
        star: { color: "#ffcc80", shadow: "#ffb74d" }      // Light Orange
    },
    background: '#3e2723', // Dark magma
    buttonShadow: '#ff6d00'
  },
  galaxy: {
    name: "Galaxy",
    cost: 1200,
    shapeColors: {
        circle: { color: "#7b1fa2", shadow: "#4a148c" },   // Deep Purple
        cube: { color: "#1a237e", shadow: "#0d47a1" },     // Dark Blue
        triangle: { color: "#8e24aa", shadow: "#6a1b9a" }, // Amethyst
        diamond: { color: "#42a5f5", shadow: "#2196f3" },  // Bright Blue
        hex: { color: "#fbc02d", shadow: "#f9a825" },      // Gold
        star: { color: "#c2185b", shadow: "#880e4f" }      // Raspberry
    },
    background: '#0f021f', // Very dark space
    buttonShadow: '#42a5f5'
  },
  candyLand: {
    name: "Candy Land",
    cost: 1600,
    shapeColors: {
        circle: { color: "#ffc0cb", shadow: "#e0b0c0" },   // Pink
        cube: { color: "#add8e6", shadow: "#98c8e0" },     // Light Blue
        triangle: { color: "#90ee90", shadow: "#7ac07a" }, // Light Green
        diamond: { color: "#ffffa0", shadow: "#e0e08c" },  // Light Yellow
        hex: { color: "#ffa07a", shadow: "#e08c6a" },      // Light Salmon
        star: { color: "#d8bfd8", shadow: "#bda9bd" }      // Thistle
    },
    background: '#ffe0f0', // Very light pink
    buttonShadow: '#ffc0cb'
  },
  darkMatter: {
    name: "Dark Matter",
    cost: 2000,
    shapeColors: {
        circle: { color: "#263238", shadow: "#1a1a1a" },   // Dark Grey
        cube: { color: "#455a64", shadow: "#2f4858" },     // Medium Grey
        triangle: { color: "#607d8b", shadow: "#455a64" }, // Grey Blue
        diamond: { color: "#90a4ae", shadow: "#78909c" },  // Light Grey Blue
        hex: { color: "#b0bec5", shadow: "#90a4ae" },      // Pale Grey
        star: { color: "#cfd8dc", shadow: "#b0bec5" }      // Very Pale Grey
    },
    background: '#000000', // Absolute black
    buttonShadow: '#607d8b'
  },
  rainbow: {
    name: "Rainbow",
    cost: 3000,
    shapeColors: { // These will be assigned dynamically based on the shape itself
        circle: { color: "#ff0000", shadow: "#cc0000" }, // Red
        cube: { color: "#ff7f00", shadow: "#cc6600" },   // Orange
        triangle: { color: "#ffff00", shadow: "#cccc00" }, // Yellow
        diamond: { color: "#00ff00", shadow: "#00cc00" }, // Green
        hex: { color: "#0000ff", shadow: "#0000cc" },   // Blue
        star: { color: "#4b0082", shadow: "#330066" }    // Indigo
    },
    background: 'linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)',
    buttonShadow: 'rgba(255,255,255,0.7)'
  }
};

// Apply initial theme on load
function applyTheme(themeName) {
    const theme = allThemes[themeName];
    if (!theme) {
        console.error(`Theme "${themeName}" not found.`);
        return;
    }
    currentTheme = themeName;
    localStorage.setItem('selectedTheme', themeName);

    // Apply body background
    // For rainbow theme, apply gradient directly
    if (themeName === 'rainbow') {
        document.body.style.background = theme.background;
    } else {
        document.body.style.background = theme.background || '#0d0d0d';
    }
    document.body.style.backgroundAttachment = 'fixed'; // Ensure background gradient doesn't scroll

    // Update button shadows (using a loop to catch all buttons)
    document.querySelectorAll('button').forEach(btn => {
      btn.style.boxShadow = `0 0 15px ${theme.buttonShadow || allThemes.neon.buttonShadow}`;
    });

    // Update jar mode option box shadows and colors
    document.querySelectorAll('.jar-mode').forEach(jar => {
        const defaultJarColor = '#00ffff'; // Default color if not specified
        const defaultJarShadow = '#00ffffaa'; // Default shadow if not specified

        // Use the theme's buttonShadow for consistency, or fall back
        const jarColor = theme.buttonShadow || defaultJarColor;
        const jarShadow = theme.buttonShadow ? `${theme.buttonShadow}aa` : defaultJarShadow;

        jar.style.borderColor = jarColor;
        jar.style.boxShadow = `0 0 20px ${jarShadow}`;
        jar.style.color = jarColor;
    });

    // Re-render current shapes and bins if in game (or on home screen for previews)
    updateCurrentVisualsForTheme();
    console.log(`Theme set to: ${themeName}`);
}

// Function to update visual elements (shapes and bins) to the current theme
function updateCurrentVisualsForTheme() {
    const currentShapeElement = document.querySelector("#shape-box .shape");
    if (currentShapeElement) {
        // Re-spawn shape to apply new colors if there's a shape
        spawnShape();
    }
    // Update existing bins colors
    document.querySelectorAll("#game-bins .bin").forEach(bin => {
        const shape = bin.dataset.shape;
        const theme = allThemes[currentTheme];
        const colors = theme.shapeColors[shape];

        if (colors) {
            bin.style.borderColor = colors.color;
            bin.style.boxShadow = `0 0 20px ${colors.shadow}`;
            bin.style.color = colors.color;
        }
    });

    // Update theme selection buttons in the themes screen - this is handled by showThemesScreen now
    // document.querySelectorAll('.theme-option').forEach(option => {
    //     if (option.dataset.theme === currentTheme) {
    //         option.classList.add('selected');
    //     } else {
    //         option.classList.remove('selected');
    //     }
    // });
}


// All shapes array (used across all themes)
const allShapes = ["circle", "cube", "triangle", "diamond", "hex", "star"];

// Blitz mode level progression - number of shapes for each level
const blitzLevelShapeCount = [3, 4, 5, 6];
// Score thresholds for Blitz mode level up:
const blitzLevelScoreThresholds = [0, 10, 25, 50];

// Endless mode score thresholds for unlocking starting levels
const endlessScoreThresholds = [0, 50, 150, 300]; // Level 1 (0 pts), Level 2 (50 pts), Level 3 (150 pts), Level 4 (300 pts)
const hardcoreScoreThresholds = [0, 75, 200];     // Level 1 (0 pts), Level 2 (75 pts), Level 3 (200 pts)


// --- Screen Navigation Functions ---

/**
 * Shows a screen with a fade-in/slide-up transition.
 * @param {string} screenId - The ID of the screen to show.
 */
function showScreen(screenId) {
    document.querySelectorAll(".screen").forEach(s => {
        // Remove 'active' class from all screens, ensuring their exit transition
        s.classList.remove("active");
    });

    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        // No setTimeout: Add active class immediately for better responsiveness
        targetScreen.classList.add("active");
    }
}

/**
 * Ensures Tone.js audio context is running on first user interaction.
 */
async function ensureAudioContextStarted() {
    if (Tone.context.state !== 'running') {
        try {
            await Tone.start();
            console.log('Tone.js audio context started by user gesture.');
            // Only start background music *after* context is running if it's enabled
            if (bgMusicToggle.checked) {
                toggleBackgroundMusic(true);
            }
        } catch (e) {
            console.error("Error starting Tone.js audio context:", e);
            throw e; // Re-throw to propagate the error for try-catch in calling functions
        }
    }
}

/**
 * Shows the Jar Mode selection screen.
 */
async function showJarModeScreen() {
  try {
    await ensureAudioContextStarted(); // Ensure audio context starts on this click
  } catch (e) {
    console.warn("Failed to start audio context for Jar Mode, proceeding without sound:", e);
  }
  showScreen("jar-mode-screen");
  applyTheme(currentTheme); // Re-apply theme to ensure Jar Mode elements are styled correctly
}

/**
 * Shows the "How to Play" screen.
 */
async function showHowToPlayScreen() {
    try {
        await ensureAudioContextStarted(); // Ensure audio context starts on this click
    } catch (e) {
        console.warn("Failed to start audio context for How to Play, proceeding without sound:", e);
    }
    showScreen("how-to-play-screen");
    applyTheme(currentTheme); // Re-apply theme to ensure elements are styled correctly
}

/**
 * Shows the Themes selection screen.
 */
async function showThemesScreen() {
    try {
        await ensureAudioContextStarted(); // Ensure audio context starts on this click
    } catch (e) {
        console.warn("Failed to start audio context for Themes, proceeding without sound:", e);
    }
    showScreen("themes-screen");

    const themesWrapper = document.querySelector(".theme-options-wrapper");
    themesWrapper.innerHTML = ''; // Clear previous themes

    // Ensure 'neon' is always in unlockedThemes, and load others
    const unlockedThemes = JSON.parse(localStorage.getItem('unlockedThemes') || '["neon"]');
    if (!unlockedThemes.includes('neon')) {
        unlockedThemes.push('neon');
        localStorage.setItem('unlockedThemes', JSON.stringify(unlockedThemes));
    }

    for (const themeId in allThemes) {
        const theme = allThemes[themeId];
        const isUnlocked = unlockedThemes.includes(themeId);
        const isSelected = currentTheme === themeId;

        const themeOptionDiv = document.createElement('div');
        themeOptionDiv.className = 'theme-option';
        themeOptionDiv.dataset.theme = themeId; // Add data-theme for easier selection/unlock

        if (isSelected) {
            themeOptionDiv.classList.add('selected');
        }

        let buttonsHtml = '';
        if (isUnlocked) {
            buttonsHtml = `<button class="select-theme-btn" data-theme="${themeId}" ${isSelected ? 'disabled' : ''}>${isSelected ? 'Selected' : 'Select'}</button>`;
        } else {
            buttonsHtml = `<button class="unlock-theme-btn" data-theme="${themeId}" data-cost="${theme.cost}" ${currency < theme.cost ? 'disabled' : ''}>Unlock (${theme.cost} 💰)</button>`;
        }

        // Generate color swatches
        let swatchesHtml = '';
        // If it's the rainbow theme, use its specific background property for the swatch
        if (themeId === 'rainbow') {
            swatchesHtml = `<div class="swatch-color" style="background:${theme.background};"></div>`;
        } else {
            // For other themes, display a few representative shape colors
            const representativeColors = [
                theme.shapeColors.circle?.color,
                theme.shapeColors.cube?.color,
                theme.shapeColors.triangle?.color
            ].filter(Boolean); // Filter out undefined if any shape is missing

            representativeColors.forEach(color => {
                swatchesHtml += `<div class="swatch-color" style="background:${color};"></div>`;
            });
        }


        themeOptionDiv.innerHTML = `
            <h3>${theme.name}</h3>
            <div class="theme-swatch">${swatchesHtml}</div>
            <div>${buttonsHtml}</div>
        `;
        themesWrapper.appendChild(themeOptionDiv);
    }

    // Attach event listeners to new buttons
    themesWrapper.querySelectorAll('.select-theme-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const themeId = event.target.dataset.theme;
            applyTheme(themeId);
            showThemesScreen(); // Re-render to update selected state and button styling
        });
    });

    themesWrapper.querySelectorAll('.unlock-theme-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const themeId = event.target.dataset.theme;
            const cost = parseInt(event.target.dataset.cost);
            unlockTheme(themeId, cost);
        });
    });
    applyTheme(currentTheme); // Re-apply theme to ensure themes screen elements are styled correctly
}

/**
 * Displays the user profile modal with current stats and daily bonus info.
 */
async function showUserProfileModal() {
    console.log("User Profile button clicked."); // Debug log
    try {
        await ensureAudioContextStarted(); // Ensure audio context starts on this click
    } catch (e) {
        console.warn("Failed to start audio context for User Profile, proceeding without sound:", e);
    }

    const lastBonusDate = localStorage.getItem('lastBonusDate');
    const today = new Date().toDateString();
    let bonusStatusMessage = '';

    if (lastBonusDate === today) {
        bonusStatusMessage = "You've already claimed your daily bonus today!";
    } else {
        bonusStatusMessage = `Daily bonus available! Log in tomorrow for another!`;
    }

    showCustomModal('userProfile', `Hello, ${userName}!\nCandyCoins: ${currency}\n${bonusStatusMessage}`);
    applyTheme(currentTheme); // Re-apply theme to ensure modal elements are styled correctly
}


/**
 * Navigates back to the home screen, clearing any active game timers and intervals.
 */
function goHome() {
  clearInterval(timerInterval); // Stop any active game timer for Candy Sorter
  clearInterval(shapeSpawnIntervalId); // Stop any active shape spawn interval for Candy Sorter

  isPaused = false; // Ensure game is not in a paused state when going home
  showScreen("home-screen");
  // Stop Tone.js transport completely when going back to home screen
  if (Tone.Transport.state === 'started') {
      Tone.Transport.stop();
      if (backgroundMusicLoop) {
          backgroundMusicLoop.stop(); // Ensure loop is stopped
          backgroundMusicLoop.dispose();
          backgroundMusicLoop = null; // Clear the reference
      }
  }
  applyTheme(currentTheme); // Re-apply theme to ensure home screen elements are styled correctly
}

/**
 * Shows the Classic Level selection screen and populates the level buttons.
 */
function showClassicLevels() {
  showScreen("classic-level-screen");
  const unlocked = parseInt(localStorage.getItem("classicUnlocked") || "1"); // Get highest unlocked level

  const levelGrid = document.getElementById("classic-level-grid");
  levelGrid.innerHTML = ""; // Clear existing level buttons

  for (let i = 1; i <= 20; i++) { // Generate buttons for levels 1 to 20 (UPDATED FROM 10 TO 20)
    const btn = document.createElement("button");
    btn.className = "level-btn";
    btn.textContent = `Level ${i}`;
    if (i <= unlocked) { // Enable if level is unlocked
      btn.addEventListener('click', () => startClassicLevel(i));
    } else { // Disable if level is locked
      btn.disabled = true;
      btn.classList.add('locked'); // Add locked class for visual styling
      btn.title = "Locked";
    }
    levelGrid.appendChild(btn);
  }
  applyTheme(currentTheme); // Re-apply theme to ensure level buttons are styled correctly
}

/**
 * Shows the Blitz Level selection screen and populates the level buttons.
 */
function showBlitzLevels() {
    showScreen("blitz-level-screen");
    const highestBlitzScore = parseInt(localStorage.getItem("blitzHighestScore") || "0"); // Get highest blitz score

    const levelGrid = document.getElementById("blitz-level-grid");
    levelGrid.innerHTML = ""; // Clear existing level buttons

    // Blitz levels are based on blitzLevelScoreThresholds
    for (let i = 0; i < blitzLevelScoreThresholds.length; i++) {
        const level = i + 1;
        const threshold = blitzLevelScoreThresholds[i];
        const btn = document.createElement("button");
        btn.className = "level-btn";
        btn.textContent = `Level ${level}`;

        // A level is unlocked if the highest score meets its threshold
        if (highestBlitzScore >= threshold) {
            btn.addEventListener('click', () => startGame('blitz', level));
        } else {
            btn.disabled = true;
            btn.classList.add('locked');
            btn.title = `Locked - Reach ${threshold} points to unlock`;
        }
        levelGrid.appendChild(btn);
    }
    applyTheme(currentTheme); // Re-apply theme to ensure level buttons are styled correctly
}

/**
 * Shows the Endless difficulty selection screen and populates the level buttons.
 */
function showEndlessDifficulties() {
    showScreen("endless-difficulty-screen");
    const highestEndlessScore = parseInt(localStorage.getItem("endlessHighestScore") || "0");

    const levelGrid = document.getElementById("endless-level-grid");
    levelGrid.innerHTML = "";

    for (let i = 0; i < endlessScoreThresholds.length; i++) {
        const level = i + 1;
        const threshold = endlessScoreThresholds[i];
        const btn = document.createElement("button");
        btn.className = "level-btn";
        btn.textContent = `Level ${level}`;

        if (highestEndlessScore >= threshold) {
            btn.addEventListener('click', () => startGame('endless', level));
        } else {
            btn.disabled = true;
            btn.classList.add('locked');
            btn.title = `Locked - Reach ${threshold} points in Endless mode to unlock`;
        }
        levelGrid.appendChild(btn);
    }
    applyTheme(currentTheme); // Re-apply theme to ensure level buttons are styled correctly
}

/**
 * Shows the Hardcore difficulty selection screen and and populates the level buttons.
 */
function showHardcoreDifficulties() {
    showScreen("hardcore-difficulty-screen");
    const highestHardcoreScore = parseInt(localStorage.getItem("hardcoreHighestScore") || "0");

    const levelGrid = document.getElementById("hardcore-level-grid");
    levelGrid.innerHTML = "";

    for (let i = 0; i < hardcoreScoreThresholds.length; i++) {
        const level = i + 1;
        const threshold = hardcoreScoreThresholds[i];
        const btn = document.createElement("button");
        btn.className = "level-btn";
        btn.textContent = `Level ${level}`;

        if (highestHardcoreScore >= threshold) {
            btn.addEventListener('click', () => startGame('hardcore', level));
        } else {
            btn.disabled = true;
            btn.classList.add('locked');
            btn.title = `Locked - Reach ${threshold} points in Hardcore mode to unlock`;
        }
        levelGrid.appendChild(btn);
    }
    applyTheme(currentTheme); // Re-apply theme to ensure level buttons are styled correctly
}


/**
 * Displays the achievement gallery.
 */
async function showGallery() {
    try {
        await ensureAudioContextStarted(); // Ensure audio context starts on this click
    } catch (e) {
        console.warn("Failed to start audio context for Gallery, proceeding without sound:", e);
    }
  showScreen("gallery-screen");
  const achievements = JSON.parse(localStorage.getItem("neonAchievements") || "[]");
  const list = document.getElementById("achievement-list");
  list.innerHTML = achievements.length === 0
    ? '<li>🚫 No achievements yet. Try playing!</li>'
    : achievements.map(a => `<li style='margin:10px 0;'>✅ ${a}</li>`).join("");
    applyTheme(currentTheme); // Re-apply theme to ensure achievements screen elements are styled correctly
}

// --- Game Logic Functions ---

/**
 * Stores an achievement in local storage and displays a popup.
 * @param {string} label - The text label for the achievement.
 */
function saveAchievement(label) {
  const list = JSON.parse(localStorage.getItem("neonAchievements") || "[]");
  if (!list.includes(label)) {
    list.push(label);
    localStorage.setItem("neonAchievements", JSON.stringify(list));
    showPopup(`🏆 Achievement Unlocked: ${label}`);
  }
}

/**
 * Checks for and grants daily login bonus.
 */
function checkDailyBonus() {
    const lastBonusDate = localStorage.getItem('lastBonusDate');
    const today = new Date().toDateString();

    console.log("--- Daily Bonus Check ---");
    console.log("Last bonus date:", lastBonusDate);
    console.log("Today's date:", today);

    if (lastBonusDate !== today) {
        console.log("Dates are different, granting daily bonus!");
        const bonusAmount = 50;
        const bonusLife = 1;
        currency += bonusAmount;
        lives = Math.min(lives + bonusLife, 5); // Cap lives at 5 for bonus
        localStorage.setItem('currency', currency);
        localStorage.setItem('lastBonusDate', today);
        updateUI(); // Update UI to reflect new currency/lives

        // Only play bonus sound if audio context is already running
        if (bgMusicToggle.checked && Tone.context.state === 'running') {
            levelUpSynth.triggerAttackRelease("C6", "8n", Tone.now() + 0.001); // Added small offset to guarantee strictly greater time
        }
        showCustomModal('dailyBonus', `🎉 Daily Bonus!\nYou received ${bonusAmount} CandyCoins and +${bonusLife} Life!`);
    } else {
        console.log("Bonus already claimed for today.");
    }
}

/**
 * Updates UI elements for score, lives, and currency.
 */
function updateUI() {
    document.getElementById("score").textContent = score;
    document.getElementById("lives").textContent = lives;
    document.getElementById("currency").textContent = currency;
    // Only update timer and level if the elements exist (i.e., we are on game screen or relevant screen)
    if (document.getElementById("timer")) {
        document.getElementById("timer").textContent = timer ?? '∞';
    }
    if (document.getElementById("level-display")) {
        document.getElementById("level-display").textContent = currentLevel;
    }
}

/**
 * Initializes and starts a new game based on the selected mode.
 * This is the entry point for all game modes from the Jar Mode screen.
 * @param {string} mode - The game mode ('classic', 'blitz', 'endless', 'hardcore').
 * @param {number} [initialLevel=1] - The starting level for the mode. Used by startClassicLevel internally.
 */
async function startGame(mode, initialLevel = 1) {
  console.log(`Starting game in mode: ${mode}, Initial Level: ${initialLevel}`);
  isPaused = false; // Ensure game starts unpaused
  gameMode = mode;
  score = 0;
  lives = 3; // Reset lives for new game, except for hardcore which is handled below
  currency = parseInt(localStorage.getItem('currency') || '0'); // Load currency
  lives = mode === 'hardcore' ? 1 : 3;
  timer = mode === 'endless' ? null : (mode === 'blitz' ? 20 : 30);
  currentLevel = initialLevel; // Use initialLevel passed, for classic mode levels and internal level tracking

  // Increment games played counter
  gamesPlayedSinceLastAd++;
  localStorage.setItem('gamesPlayedSinceLastAd', gamesPlayedSinceLastAd.toString());

  // Clear any previous timers and intervals upfront
  clearInterval(timerInterval);
  clearInterval(shapeSpawnIntervalId);
  if (backgroundMusicLoop) {
    backgroundMusicLoop.stop(); // Stop any existing music loop
    backgroundMusicLoop.dispose();
    backgroundMusicLoop = null; // Clear the reference
  }


  // Ensure Tone.js context is running before playing any sounds
  if (Tone.context.state !== 'running') {
      try {
          await Tone.start();
          console.log('Tone.js audio context started via startGame');
      } catch (e) {
          console.error("Error starting Tone.js context in startGame:", e);
          // Fallback if audio context fails
      }
  }

  // Start background music if enabled
  if (bgMusicToggle.checked) {
      toggleBackgroundMusic(true);
  }

  // Set up the game screen display
  showScreen("game-screen");

  document.getElementById("game-title").textContent = `Mode: ${mode.toUpperCase()}`; // Update with mode
  updateUI(); // Update all UI elements

  const gameBinsContainer = document.getElementById("game-bins");
  gameBinsContainer.innerHTML = ""; // Clear existing bins

  // Mode-specific setup
  if (gameMode === 'classic') {
    // Classic mode bins and first spawn are handled by startClassicLevel which calls startGame.
  } else if (gameMode === 'blitz') {
      setupBlitzLevel(currentLevel);
  } else { // For Endless and Hardcore, all 6 shapes are available from Level 1
    allShapes.forEach(shape => {
      createBinElement(gameBinsContainer, shape);
    });
    setShapeSpawnRate(currentLevel);
    spawnShape();
  }

  // Timer setup for all timed modes (Classic, Blitz, Hardcore)
  if (mode !== 'endless') {
    currentCountdownSpeed = (mode === 'hardcore' ? 700 : 1000); // Initialize countdown speed
    startCountdownTimer();
  }
  applyTheme(currentTheme); // Re-apply theme to ensure game screen elements are styled correctly
}

/**
 * Pauses the game by clearing intervals and displaying a modal.
 */
function pauseGame() {
    if (!isPaused) {
        isPaused = true;
        clearInterval(timerInterval);
        clearInterval(shapeSpawnIntervalId);
        if (backgroundMusicLoop && bgMusicToggle.checked) { // Only attempt to mute if music is playing
            bgmVolumeNode.volume.value = -Infinity; // Mute BGM
        }
        // Do NOT stop Tone.Transport entirely here, as other sounds (like correct/wrong) might still be desired.
        pausedTimerValue = timer; // Store current timer value
        showCustomModal('paused');
    }
}

/**
 * Resumes the game by restarting intervals. Called from the pause modal.
 */
async function resumeGame() {
    if (isPaused) {
        isPaused = false;
        // Ensure Tone.js context is running before resuming audio
        if (Tone.context.state !== 'running') {
            try {
                await Tone.start();
                console.log('Tone.js audio context started via resumeGame');
            }
            catch (e) {
                console.error("Error starting Tone.js context in resumeGame:", e);
                // Fallback if audio context fails
            }
        }

        if (gameMode !== 'endless' && timer !== null) {
            timer = pausedTimerValue; // Restore timer value
            startCountdownTimer();
        }
        if (gameMode !== 'classic') { // Auto-spawn modes
            setShapeSpawnRate(currentLevel);
        } else { // Classic mode, ensure a shape is present if none was there
            if (document.getElementById("shape-box").innerHTML === "") {
                spawnShape();
            }
        }
        if (backgroundMusicLoop && bgMusicToggle.checked) {
            // Restore BGM volume based on slider, ensure it's not muted if slider is at 0
            const volumeDb = (parseFloat(bgMusicVolume.value) * 40) - 40;
            bgmVolumeNode.volume.value = (parseFloat(bgMusicVolume.value) === 0) ? -Infinity : volumeDb;

            if (Tone.Transport.state !== 'started') { // Ensure transport is started if loop needs it
                Tone.Transport.start();
            }
            backgroundMusicLoop.start(0); // Restart loop from beginning (or or schedule from current transport time)
        }
    }
}


/**
 * Starts or restarts the main countdown timer.
 */
function startCountdownTimer() {
    clearInterval(timerInterval); // Clear any existing timer
    if (timer !== null) { // Only start if it's a timed mode
        timerInterval = setInterval(() => {
            if (!isPaused) { // Only decrement if not paused
                timer--;
                document.getElementById("timer").textContent = timer;
                if (timer <= 0) {
                    clearInterval(timerInterval);
                    clearInterval(shapeSpawnIntervalId);
                    showCustomModal('gameOver');
                }
            }
        }, currentCountdownSpeed);
    }
}


/**
 * Starts a specific level in Classic mode.
 * This is the main entry point for Classic mode levels.
 * @param {number} level - The level number to start.
 */
function startClassicLevel(level) {
  console.log(`Starting Classic Level: ${level}`);
  startGame("classic", level);
  targetScore = level * 15;

  let shapesForLevel;
  if (level === 1) shapesForLevel = ["cube", "circle", "triangle"];
  else if (level === 2) shapesForLevel = ["cube", "circle", "triangle", "diamond"];
  else if (level === 3) shapesForLevel = ["cube", "circle", "triangle", "diamond", "hex"];
  else shapesForLevel = allShapes;

  const gameBinsContainer = document.getElementById("game-bins");
  gameBinsContainer.innerHTML = "";

  shapesForLevel.forEach(shape => {
      createBinElement(gameBinsContainer, shape);
  });

  spawnShape();
}

/**
 * Sets up the bins and spawn rate for a specific Blitz level.
 * @param {number} level - The Blitz level to set up.
 */
function setupBlitzLevel(level) {
    console.log(`Setting up Blitz Level: ${level}`);
    currentLevel = level;
    document.getElementById("level-display").textContent = currentLevel;

    // Use currentLevel to determine the number of shapes for this Blitz level
    const numShapes = blitzLevelShapeCount[Math.min(level - 1, blitzLevelShapeCount.length - 1)];
    const shapesForLevel = allShapes.slice(0, numShapes);

    const gameBinsContainer = document.getElementById("game-bins");
    gameBinsContainer.innerHTML = "";

    shapesForLevel.forEach(shape => {
      createBinElement(gameBinsContainer, shape);
    });

    setShapeSpawnRate(currentLevel);
    spawnShape();
}


/**
 * Helper function to create a single bin element and append it to a container.
 * @param {HTMLElement} container - The DOM element to append the bin to.
 * @param {string} shape - The name of the shape for this bin (e.g., "cube").
 */
function createBinElement(container, shape) {
    const div = document.createElement("div");
    div.className = "bin";
    div.setAttribute("data-shape", shape);
    div.textContent = shape.charAt(0).toUpperCase() + shape.slice(1); // Capitalize first letter

    // Use currentTheme to get colors
    const colors = allThemes[currentTheme].shapeColors[shape];
    if (colors) {
        div.style.borderColor = colors.color;
        div.style.boxShadow = `0 0 20px ${colors.shadow}`;
        div.style.color = colors.color;
    }

    div.ondrop = drop;
    div.ondragover = allowDrop;
    div.ondragenter = (e) => e.target.classList.add('drag-over');
    div.ondragleave = (e) => e.target.classList.remove('drag-over');

    container.appendChild(div);
}

/**
 * Sets the interval for automated shape spawning in non-classic modes.
 * The speed increases with higher levels.
 * @param {number} level - The current game level.
 */
function setShapeSpawnRate(level) {
    clearInterval(shapeSpawnIntervalId);

    let baseRate = 2500;
    if (gameMode === 'hardcore') baseRate = 1800;
    else if (gameMode === 'blitz') baseRate = 2200;

    // Further reduce spawn rate based on level for Endless/Hardcore
    let newSpawnRate = Math.max(500, baseRate - (level * 150));

    // For Endless/Hardcore, the 'level' passed in is the selected starting difficulty.
    // The actual in-game level is tracked by currentLevel and progresses based on score.
    // So, we need to consider the initialLevel in addition to score-based progression.
    let effectiveLevelForSpawnRate = currentLevel; // Use currentLevel (which accounts for score-based level-ups)

    // Adjust the spawn rate further by the initial selected level from the difficulty screen
    if (gameMode === 'endless' || gameMode === 'hardcore') {
        // Each "starting level" adds a baseline difficulty increase
        // For example, Level 1: currentLevel (1) -> baseRate, Level 2: currentLevel (2) -> baseRate - 150*1 etc.
        // The `currentLevel` variable is already used to track in-game progression.
        // We're already applying `level * 150` where `level` is `currentLevel`.
        // So, if starting at level 2, `currentLevel` starts at 2, and the rate is `baseRate - (2 * 150)`. This seems correct.
    }

    newSpawnRate = Math.max(200, baseRate - (effectiveLevelForSpawnRate * 150)); // Ensure it doesn't go below 200ms
    console.log(`Calculated spawn rate for effective level ${effectiveLevelForSpawnRate}: ${newSpawnRate}ms`);


    shapeSpawnIntervalId = setInterval(() => {
        if (!isPaused && document.getElementById("shape-box").innerHTML === "") { // Only spawn if not paused
            spawnShape();
        } else if (!isPaused) { // Only decrement life if not paused and shape is stuck
             console.log("Shape timed out (auto-spawning)! Decrementing life.");
             handleShapeDrop(false, window.innerWidth / 2, window.innerHeight / 2);
        }
    }, newSpawnRate);
    console.log(`Shape spawn rate set to: ${newSpawnRate}ms for Level ${level} (${gameMode} mode)`);
}

/**
 * Spawns a new draggable 2D shape into the game area.
 */
function spawnShape() {
  const box = document.getElementById("shape-box");
  box.innerHTML = "";

  const binElements = document.querySelectorAll("#game-bins .bin");
  let availableShapes = Array.from(binElements).map(bin => bin.dataset.shape);

  if (availableShapes.length === 0) {
      availableShapes = allShapes;
  }

  const shape = availableShapes[Math.floor(Math.random() * availableShapes.length)];
  console.log(`Spawning shape: ${shape}`);

  const div = document.createElement("div");
  div.className = `shape ${shape}`;
  div.dataset.shape = shape;
  div.setAttribute("draggable", true);

  // Use currentTheme to get colors and apply them to the shape
  const theme = allThemes[currentTheme];
  const colors = theme.shapeColors[shape];

  if (colors) {
      if (shape === 'triangle') {
          div.style.borderBottom = `50px solid ${colors.color}`;
      } else if (shape === 'hex') {
          div.style.background = colors.color;
          // Apply colors to pseudo-elements for hexagon
          div.style.setProperty('border-bottom-color', colors.color);
          div.style.setProperty('border-top-color', colors.color);
      } else if (shape === 'star') {
          div.style.borderBottom = `35px solid ${colors.color}`;
          div.style.setProperty('border-top-color', colors.color); // For star after pseudo-element
      } else {
          div.style.background = colors.color;
      }
      div.style.boxShadow = `0 0 20px ${colors.shadow}`; // Apply shadow to all shapes
  }

  div.ondragstart = e => e.dataTransfer.setData("text", shape);
  box.appendChild(div);
}

/**
 * Allows a draggable element to be dropped into a target.
 * @param {Event} event - The dragover event.
 */
function allowDrop(event) {
  event.preventDefault();
}

/**
 * Handles the drop event when a shape is dropped into a bin.
 * @param {Event} event - The drop event.
 */
function drop(event) {
  event.preventDefault();
  document.querySelectorAll('.bin.drag-over').forEach(bin => bin.classList.remove('drag-over'));

  if (isPaused) { // Prevent drops if game is paused
      return;
  }

  const draggedShape = event.dataTransfer.getData("text");
  const targetBin = event.target.closest('.bin');

  if (!targetBin) {
    console.log("Dropped outside a bin.");
    handleShapeDrop(false, event.clientX, event.clientY);
    return;
  }

  const targetShape = targetBin.dataset.shape;
  const x = event.clientX;
  const y = event.clientY;

  const isCorrect = draggedShape === targetShape;

  console.log(`Dragged: ${draggedShape}, Target: ${targetShape}, Correct: ${isCorrect}`);
  handleShapeDrop(isCorrect, x, y);
}

/**
 * Processes the result of a shape drop (correct or incorrect).
 * @param {boolean} isCorrect - True if the shape was dropped into the correct bin, false otherwise.
 * @param {number} x - X coordinate for the drop effect.
 * @param {number} y - Y coordinate for the drop effect.
 */
function handleShapeDrop(isCorrect, x, y) {
  const soundOn = bgMusicToggle.checked; // Use the main sound toggle for all effects

  // Clear the shape from the shape-box immediately after a drop
  document.getElementById("shape-box").innerHTML = "";

  try {
    showEffect(x, y, isCorrect ? 'correct' : 'wrong');

    if (isCorrect) {
      if (soundOn && Tone.context.state === 'running') {
        // --- FIX 1 of 3: Robustness fix ---
        // Removed explicit time `Tone.now()` to let Tone.js schedule the sound immediately, avoiding potential timing errors.
        correctSynth.triggerAttackRelease("C5", "8n");
      }
      score++;
      currency += 5; // Earn currency for correct sort
      localStorage.setItem('currency', currency); // Save currency
      updateUI();
      console.log(`Score updated: ${score}, Currency: ${currency}`);

      // Save high scores for respective modes
      if (gameMode === 'blitz') {
        const highestBlitzScore = parseInt(localStorage.getItem("blitzHighestScore") || "0");
        if (score > highestBlitzScore) {
          localStorage.setItem("bllitzHighestScore", score.toString());
        }
      } else if (gameMode === 'endless') {
        const highestEndlessScore = parseInt(localStorage.getItem("endlessHighestScore") || "0");
        if (score > highestEndlessScore) {
          localStorage.setItem("endlessHighestScore", score.toString());
        }
      } else if (gameMode === 'hardcore') {
        const highestHardcoreScore = parseInt(localStorage.getItem("hardcoreHighestScore") || "0");
        if (score > highestHardcoreScore) {
          localStorage.setItem("hardcoreHighestScore", score.toString());
        }
      }


      if (timer !== null) {
          if (score % 10 === 0 && score !== 0) {
            timer += 10;
            document.getElementById("timer").textContent = timer;
            showPopup("⏱️ +10s Time Bonus for reaching " + score + " points!");
          }
          if (score >= 20 && score % 20 === 0) { // Speed up timer at 20 points and every 20 points thereafter
              currentCountdownSpeed = Math.max(50, currentCountdownSpeed - 2);
              console.log(`Timer speed increased! New interval: ${currentCountdownSpeed}ms`);
              startCountdownTimer();
              showPopup("⚡ Timer Speed Increased!");
          }
      }

      if (gameMode === 'classic') {
        checkLevelWin();
      } else if (gameMode === 'blitz') {
        checkBlitzLevelUp();
        checkWin();
      } else {
        checkModeLevelUp();
        checkWin();
      }

      if (score === 10) saveAchievement(`10 points in ${gameMode}`);
      if (score === 20) saveAchievement(`20 points in ${gameMode}`);
      if (score === 50) saveAchievement(`50 points in ${gameMode}`);

    } else {
      if (soundOn && Tone.context.state === 'running') {
        // --- FIX 2 of 3: Main error fix ---
        // Corrected the arguments for NoiseSynth. The first argument is duration, not a note.
        wrongSynth.triggerAttackRelease("8n");
      }
      lives--;
      document.getElementById("lives").textContent = lives <= 0 ? "💥 0 Lives" : (gameMode === 'hardcore' ? "🔥 1 Life Mode" : lives);
      console.log(`Lives remaining: ${lives}`);
      if (lives <= 0) {
        clearInterval(timerInterval);
        clearInterval(shapeSpawnIntervalId);
        showCustomModal('gameOver'); // This will handle ad before game over
      }
    }
    if (gameMode === 'classic') {
      spawnShape();
    }
  } catch (error) {
    console.error("An error occurred in handleShapeDrop:", error);
    if (gameMode === 'classic') {
        spawnShape();
    }
  }
}

/**
 * Checks for level progression in Blitz mode based on score thresholds.
 */
function checkBlitzLevelUp() {
    let newLevel = currentLevel;
    // Determine the highest level unlocked based on the current score
    for (let i = blitzLevelScoreThresholds.length - 1; i >= 0; i--) {
        if (score >= blitzLevelScoreThresholds[i]) {
            newLevel = i + 1;
            break;
        }
    }

    if (newLevel > currentLevel) {
        if (bgMusicToggle.checked && Tone.context.state === 'running') { // Added Tone.context.state check
            levelUpSynth.triggerAttackRelease("G4", "8n", Tone.now());
            // Use Tone.Time for precise, strictly increasing offset for sequential notes
            levelUpSynth.triggerAttackRelease("C5", "8n", Tone.now() + Tone.Time("8n").toSeconds());
        }
        currentLevel = newLevel; // Update current level
        setupBlitzLevel(currentLevel); // Re-setup blitz level with new shapes/rate
        showPopup(`⬆️ Level Up! Now Level ${newLevel}!`);
    }
}

/**
 * Checks for level progression in Endless and Hardcore modes (speed increase only).
 * Increases the level and adjusts shape spawning rate.
 */
function checkModeLevelUp() {
    // Score thresholds for level progression in Endless/Hardcore modes (speed based)
    const scoreThresholds = (gameMode === 'endless') ? endlessScoreThresholds : hardcoreScoreThresholds;

    let newLevel = currentLevel;
    for (let i = scoreThresholds.length - 1; i >= 0; i--) {
        if (score >= scoreThresholds[i]) {
            newLevel = i + 1;
            break;
        }
    }

    if (newLevel > currentLevel) {
        if (bgMusicToggle.checked && Tone.context.state === 'running') { // Added Tone.context.state check
            levelUpSynth.triggerAttackRelease("G4", "8n", Tone.now());
            // Use Tone.Time for precise, strictly increasing offset for sequential notes
            levelUpSynth.triggerAttackRelease("C5", "8n", Tone.now() + Tone.Time("8n").toSeconds());
        }
        currentLevel = newLevel; // Update global currentLevel
        document.getElementById("level-display").textContent = currentLevel; // Update UI
        showPopup(`⬆️ Level Up! Now Level ${currentLevel}!`);
        setShapeSpawnRate(currentLevel); // Adjust spawn rate for new level
    }
}

/**
 * Checks if the win condition for non-classic timed modes (Blitz, Hardcore) is met.
 */
function checkWin() {
  const generalWinScore = 100; // General win score for Blitz/Hardcore (increased for more gameplay)
  if ((gameMode === 'blitz' || gameMode === 'hardcore') && score >= generalWinScore) {
    clearInterval(timerInterval);
    clearInterval(shapeSpawnIntervalId);
    if (bgMusicToggle.checked && Tone.context.state === 'running') { // Added Tone.context.state check
        winSynth.triggerAttackRelease("C5", "4n", Tone.now());
        // Use Tone.Time for precise, strictly increasing offsets for sequential notes
        winSynth.triggerAttackRelease("E5", "4n", Tone.now() + Tone.Time("4n").toSeconds());
        winSynth.triggerAttackRelease("G5", "4n", Tone.now() + Tone.Time("4n").toSeconds() * 2);
    }
    showCustomModal('gameWon'); // This will handle ad before game won
    saveAchievement(`Won ${gameMode} mode`);
  }
}

/**
 * Checks if the current Classic level's target score has been met.
 */
function checkLevelWin() {
  if (gameMode === "classic" && score >= targetScore) {
    clearInterval(timerInterval);
    clearInterval(shapeSpawnIntervalId);

    const unlocked = parseInt(localStorage.getItem("classicUnlocked") || "1");
    const nextLevelValue = currentLevel + 1;

    if (currentLevel >= unlocked && currentLevel < 20) { // UPDATED FROM 10 TO 20
      localStorage.setItem("classicUnlocked", nextLevelValue.toString());
      console.log(`Unlocked Level: ${nextLevelValue}`);
    }

    const message = `Level ${currentLevel} Complete!\nScore: ${score}`;

    if (bgMusicToggle.checked && Tone.context.state === 'running') { // Added Tone.context.state check
        winSynth.triggerAttackRelease("C5", "4n", Tone.now());
        winSynth.triggerAttackRelease("E5", "4n", Tone.now() + Tone.Time("4n").toSeconds());
        winSynth.triggerAttackRelease("G5", "4n", Tone.now() + Tone.Time("4n").toSeconds() * 2);
    }

    // Show the celebration instead of the regular modal, and let it handle ads internally
    showWinCelebration(message, nextLevelValue);
  }
}

/**
 * Handles the logic for unlocking a new theme.
 * @param {string} themeId - The ID of the theme to unlock.
 * @param {number} cost - The CandyCoin cost of the theme.
 */
function unlockTheme(themeId, cost) {
    if (currency >= cost) {
        currency -= cost;
        localStorage.setItem('currency', currency);

        const unlockedThemes = JSON.parse(localStorage.getItem('unlockedThemes') || '["neon"]');
        if (!unlockedThemes.includes(themeId)) {
            unlockedThemes.push(themeId);
            localStorage.setItem('unlockedThemes', JSON.stringify(unlockedThemes));
        }

        updateUI(); // Update currency display
        showPopup(`Theme "${allThemes[themeId].name}" unlocked!`);
        showThemesScreen(); // Re-render themes screen to show it as unlocked
    } else {
        showCustomModal('info', `Not enough CandyCoins!\nYou need ${cost} CandyCoins to unlock "${allThemes[themeId].name}". You have ${currency}.`);
    }
}

// --- UI Feedback Functions ---

/**
 * Displays a temporary achievement popup.
 * @param {string} msg - The message to display.
 */
function showPopup(msg) {
  const popup = document.getElementById("achievement-popup");
  popup.textContent = msg;
  popup.style.display = "block";
  setTimeout(() => { popup.style.display = "none"; }, 2000);
}

/**
 * Creates and displays a visual effect at specified coordinates.
 * @param {number} x - X coordinate.
 * @param {number} y - Y coordinate.
 * @param {string} type - 'correct' or 'wrong' to determine effect color.
 */
function showEffect(x, y, type = 'correct') {
  const effect = document.createElement("div");
  effect.className = `drop-effect ${type === 'correct' ? 'correct-effect' : 'wrong-effect'}`;
  effect.style.left = `${x}px`;
  effect.style.top = `${y}px`;
  document.body.appendChild(effect);
  setTimeout(() => document.body.removeChild(effect), 700);
}

/**
 * Simulates an ad display with a delayed close button.
 * Resolves when the ad is closed.
 */
function showAdModal() {
    return new Promise(resolve => {
        isPaused = true; // Pause game logic during ad
        clearInterval(timerInterval);
        clearInterval(shapeSpawnIntervalId);
        if (backgroundMusicLoop && bgMusicToggle.checked) {
            bgmVolumeNode.volume.value = -Infinity; // Mute BGM during ad
        }

        const container = document.getElementById('custom-modal-container');
        container.innerHTML = ''; // Clear existing modals

        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay active'; // Immediately active

        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        modalContent.innerHTML = `
            <h2>Advertisement</h2>
            <p>Simulated Ad Content Goes Here...</p>
            <p>Please wait for the ad to finish.</p>
            <button id="close-ad-btn" style="display:none;">Close Ad</button>
        `;

        modalOverlay.appendChild(modalContent);
        container.appendChild(modalOverlay);

        const closeAdBtn = document.getElementById('close-ad-btn');
        setTimeout(() => {
            closeAdBtn.style.display = 'block';
            closeAdBtn.addEventListener('click', () => {
                modalOverlay.classList.remove('active');
                modalOverlay.addEventListener('transitionend', () => {
                    container.innerHTML = '';
                    isPaused = false; // Resume game logic
                    // Resume game state after ad based on current gameMode
                    if (document.getElementById('game-screen').classList.contains('active')) {
                        if (gameMode !== 'endless' && timer !== null) {
                            startCountdownTimer(); // Resume timers if applicable
                        }
                        if (gameMode !== 'classic') { // Auto-spawn modes
                            setShapeSpawnRate(currentLevel); // Resume shape spawning
                        } else if (document.getElementById("shape-box").innerHTML === "") { // Classic, if no shape, spawn one
                            spawnShape();
                        }
                    }
                    if (backgroundMusicLoop && bgMusicToggle.checked) {
                        const volumeDb = (parseFloat(bgMusicVolume.value) * 40) - 40;
                        bgmVolumeNode.volume.value = (parseFloat(bgMusicVolume.value) === 0) ? -Infinity : volumeDb; // Restore BGM volume
                        if (Tone.Transport.state !== 'started') { // Ensure transport is started if loop needs it
                            Tone.Transport.start();
                        }
                        backgroundMusicLoop.start(0); // Restart loop from beginning (or schedule from current transport time)
                    }
                    resolve();
                }, { once: true });
            }, { once: true });
        }, AD_DISPLAY_DURATION);
    });
}


/**
 * Displays a custom modal dialog.
 * @param {string} type - Type of modal ('confirmExitGame', 'gameOver', 'gameWon', 'confirmExitToMenu', 'confirmRestartGame', 'paused', 'dailyBonus', 'userProfile', 'info').
 * @param {string} [messageOverride] - Optional message to override default.
 * @param {number} [nextLevelValue] - Optional, for 'levelComplete' modal to pass next level. (No longer directly used for 'levelComplete' type in this modal)
 * @returns {Promise<boolean>} - Resolves with true if 'Yes'/'OK', false if 'No'/'Cancel'.
 */
function showCustomModal(type, messageOverride = '') { // nextLevelValue removed from signature as it's not handled here for levelComplete
    return new Promise(async resolve => { // Made async to await ad modal
        // Check for ad display condition only for game over and game won, not levelComplete (handled by showWinCelebration)
        const shouldShowAd = (type === 'gameOver' || type === 'gameWon') && (gamesPlayedSinceLastAd % AD_INTERVAL_GAMES === 0);

        if (shouldShowAd) {
            await showAdModal(); // Wait for ad to finish
            // Reset ad counter after ad is shown
            gamesPlayedSinceLastAd = 0;
            localStorage.setItem('gamesPlayedSinceLastAd', gamesPlayedSinceLastAd.toString());
        }

        // After ad (or if no ad was shown), proceed with the actual game modal
        // Clear game intervals, but only for game-ending/pausing modals
        if (type !== 'paused' && type !== 'dailyBonus' && type !== 'userProfile' && type !== 'info') { // Added 'info' type
            clearInterval(timerInterval);
            clearInterval(shapeSpawnIntervalId);
        }

        // Play specific sound for game over/won
        // ONLY PLAY IF THE AUDIO CONTEXT IS ALREADY RUNNING
        if (bgMusicToggle.checked && Tone.context.state === 'running') {
            if (type === 'gameOver') {
                // CORRECTED: Let Tone.js handle immediate scheduling for the first note.
                loseSynth.triggerAttackRelease("C3", "4n");
                // CORRECTED: Use Tone.Time for precise, strictly increasing offset for sequential notes
                loseSynth.triggerAttackRelease("F#2", "4n", Tone.now() + Tone.Time("4n").toSeconds());
            } else if (type === 'gameWon') {
                // This branch for gameWon is actually dead code because showWinCelebration handles gameWon sounds now
                // However, if it were active, ensure increasing times.
                // winSynth.triggerAttackRelease("C5", "4n", Tone.now());
                // winSynth.triggerAttackRelease("E5", "4n", Tone.now() + Tone.Time("4n").toSeconds());
                // winSynth.triggerAttackRelease("G5", "4n", Tone.now() + Tone.Time("4n").toSeconds() * 2);
            } else if (type === 'dailyBonus') {
                // CORRECTED: Added small non-zero offset to guarantee strictly greater time for daily bonus sound
                levelUpSynth.triggerAttackRelease("C6", "8n", Tone.now() + 0.001);
            }
        }


        const container = document.getElementById('custom-modal-container');
        container.innerHTML = ''; // Clear previous modals

        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';

        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';

        let title = '';
        let message = '';
        let buttonsHtml = '';

        switch (type) {
            case 'confirmExitGame':
                title = 'Exit Game?';
                message = messageOverride || "Are you sure you want to return to the home screen? Your current game will be lost.";
                buttonsHtml = `
                    <button id="modal-yes-btn">Yes</button>
                    <button id="modal-no-btn">No</button>
                `;
                break;
            case 'confirmExitToMenu':
                title = 'Exit to Menu?';
                message = messageOverride || "Are you sure you want to return to the game mode selection? Your current game will be lost.";
                buttonsHtml = `
                    <button id="modal-yes-to-menu-btn">Yes</button>
                    <button id="modal-no-btn">No</button>
                `;
                break;
            case 'confirmRestartGame':
                title = 'Restart Game?';
                message = messageOverride || "Are you sure you want to restart the current game? Your progress will be lost.";
                buttonsHtml = `
                    <button id="modal-restart-yes-btn">Yes</button>
                    <button id="modal-no-btn">No</button>
                `;
                break;
            case 'gameOver':
                title = 'Game Over!';
                message = messageOverride || `💀 Time's up! Final Score: ${score}`;
                if (lives <= 0 && messageOverride === '') {
                    message = `💀 Game Over! Final Score: ${score}\nNo lives left!`;
                }
                buttonsHtml = `
                    <button id="modal-ok-btn">OK</button>
                `;
                break;
            case 'gameWon':
                title = 'Congratulations!';
                message = messageOverride || `🎉 You Win! Final Score: ${score}`;
                buttonsHtml = `
                    <button id="modal-ok-btn">Awesome!</button>
                `;
                break;
            // 'levelComplete' case removed, handled by showWinCelebration
            case 'paused':
                title = 'Game Paused';
                message = "The game is paused. Click 'Resume' to continue.";
                buttonsHtml = `
                    <button id="modal-resume-btn">Resume</button>
                    <button id="modal-restart-from-pause-btn">Restart</button>
                    <button id="modal-menu-from-pause-btn">Back to Menu</button>
                    <button id="modal-home-from-pause-btn">Back to Home</button>
                `;
                break;
            case 'dailyBonus':
                title = 'Daily CandyCoins!';
                message = messageOverride;
                buttonsHtml = `
                    <button id="modal-ok-btn">Sweet!</button>
                `;
                break;
            case 'userProfile':
                title = 'User Profile';
                message = messageOverride;
                buttonsHtml = `
                    <button id="modal-ok-btn">Close</button>
                `;
                break;
            case 'info': // New generic info modal
                title = 'Info';
                message = messageOverride;
                buttonsHtml = `
                    <button id="modal-ok-btn">OK</button>
                `;
                break;
        }

        modalContent.innerHTML = `
            <h2>${title}</h2>
            <p>${message.replace(/\n/g, '<br>')}</p>
            <div>${buttonsHtml}</div>
        `;

        modalOverlay.appendChild(modalContent);
        container.appendChild(modalOverlay);

        // Force reflow for modal overlay transition
        void modalOverlay.offsetWidth;
        modalOverlay.classList.add('active');


        // Attach event listeners for modal buttons
        document.getElementById('modal-yes-btn')?.addEventListener('click', () => {
            modalOverlay.classList.remove('active');
            modalOverlay.addEventListener('transitionend', () => {
                container.innerHTML = '';
                goHome();
            }, { once: true });
            resolve(true);
        });

        document.getElementById('modal-yes-to-menu-btn')?.addEventListener('click', () => {
            modalOverlay.classList.remove('active');
            modalOverlay.addEventListener('transitionend', () => {
                container.innerHTML = '';
                showJarModeScreen();
            }, { once: true });
            resolve(true);
        });

        document.getElementById('modal-restart-yes-btn')?.addEventListener('click', () => {
            modalOverlay.classList.remove('active');
            modalOverlay.addEventListener('transitionend', () => {
                container.innerHTML = '';
                if (document.getElementById('game-screen').classList.contains('active')) { // Check if game screen is active
                    if (gameMode === 'classic') {
                        startClassicLevel(currentLevel);
                    } else {
                        startGame(gameMode, currentLevel);
                    }
                }
            }, { once: true });
            resolve(true);
        });

        document.getElementById('modal-no-btn')?.addEventListener('click', () => {
            modalOverlay.classList.remove('active');
            modalOverlay.addEventListener('transitionend', () => {
                container.innerHTML = '';
                // Only resume game if coming from a game state (e.g., pause, or an exit confirm)
                // Do not resume if it's a game over/win screen (as those are game-ending)
                if (type === 'confirmExitGame' || type === 'confirmExitToMenu' || type === 'confirmRestartGame' || type === 'paused') {
                    if (document.getElementById('game-screen').classList.contains('active')) {
                        if (gameMode !== 'endless' && timer !== null) {
                            startCountdownTimer();
                        }
                        if (gameMode !== 'classic') {
                            setShapeSpawnRate(currentLevel);
                        }
                        if (document.getElementById("shape-box").innerHTML === "") { // Only spawn if empty after confirmation
                            spawnShape();
                        }
                    }
                }
            }, { once: true });
            resolve(false);
        });

        const modalOkBtn = document.getElementById('modal-ok-btn');
        if (modalOkBtn) {
            modalOkBtn.addEventListener('click', () => {
                modalOverlay.classList.remove('active');
                modalOverlay.addEventListener('transitionend', () => {
                    container.innerHTML = '';
                    // For OK button: if it's game over/won, go home. If daily bonus or userProfile or info, just close modal.
                    if (type === 'gameOver' || type === 'gameWon') {
                        goHome();
                    }
                    // For daily bonus/userProfile/info, the modal closes and user remains on current screen (usually home/themes)
                }, { once: true });
                resolve(true);
            });
        }

        // These buttons are for the old 'levelComplete' modal, which is now handled by showWinCelebration
        // document.getElementById('modal-play-next-btn')?.addEventListener('click', () => {
        //     modalOverlay.classList.remove('active');
        //     modalOverlay.addEventListener('transitionend', () => {
        //         container.innerHTML = '';
        //         startClassicLevel(nextLevelValue);
        //     }, { once: true });
        //     resolve(true);
        // });

        // document.getElementById('modal-back-to-levels-btn')?.addEventListener('click', () => {
        //     modalOverlay.classList.remove('active');
        //     modalOverlay.addEventListener('transitionend', () => {
        //         container.innerHTML = '';
        //         showClassicLevels();
        //     }, { once: true });
        //     resolve(false);
        // });

        document.getElementById('modal-resume-btn')?.addEventListener('click', () => {
            modalOverlay.classList.remove('active');
            modalOverlay.addEventListener('transitionend', () => {
                container.innerHTML = '';
                isPaused = false; // Unpause the global flag
                // Decide how to resume based on the currently active game screen
                if (document.getElementById('game-screen').classList.contains('active')) {
                    resumeGame(); // Resume Sorter game specific timers/spawns
                }
                // Music handling applies to both games
                if (backgroundMusicLoop && bgMusicToggle.checked) {
                    const volumeDb = (parseFloat(bgMusicVolume.value) * 40) - 40;
                    bgmVolumeNode.volume.value = (parseFloat(bgMusicVolume.value) === 0) ? -Infinity : volumeDb; // Restore BGM volume
                    if (Tone.Transport.state !== 'started') {
                        Tone.Transport.start();
                    }
                    backgroundMusicLoop.start(0); // Restart loop from beginning (or schedule from current transport time)
                }
            }, { once: true });
            resolve(true);
        });

        // Specific buttons for 'paused' modal direct actions
        document.getElementById('modal-restart-from-pause-btn')?.addEventListener('click', () => {
            modalOverlay.classList.remove('active');
            modalOverlay.addEventListener('transitionend', () => {
                container.innerHTML = '';
                if (document.getElementById('game-screen').classList.contains('active')) {
                    if (gameMode === 'classic') {
                        startClassicLevel(currentLevel);
                    } else {
                        startGame(gameMode, currentLevel);
                    }
                }
            }, { once: true });
            resolve(true);
        });

        document.getElementById('modal-menu-from-pause-btn')?.addEventListener('click', () => {
            modalOverlay.classList.remove('active');
            modalOverlay.addEventListener('transitionend', () => {
                container.innerHTML = '';
                showJarModeScreen();
            }, { once: true });
            resolve(true);
        });

        document.getElementById('modal-home-from-pause-btn')?.addEventListener('click', () => {
            modalOverlay.classList.remove('active');
            modalOverlay.addEventListener('transitionend', () => {
                container.innerHTML = '';
                goHome();
            }, { once: true });
            resolve(true);
        });
    });
}

/**
 * Displays a winning celebration.
 * @param {string} message - The main message for the celebration.
 * @param {number|null} nextLevelValue - The next level to play, or null if all levels are complete.
 */
async function showWinCelebration(message, nextLevelValue) {
    // Ad logic moved here for level wins
    const shouldShowAd = (gameMode === 'classic') && (gamesPlayedSinceLastAd % AD_INTERVAL_GAMES === 0);

    if (shouldShowAd) {
        await showAdModal(); // Wait for ad to finish before showing celebration
        // Reset ad counter after ad is shown
        gamesPlayedSinceLastAd = 0;
        localStorage.setItem('gamesPlayedSinceLastAd', gamesPlayedSinceLastAd.toString());
    }

    const celebrationOverlay = document.getElementById('celebration-overlay');
    const celebrationTitle = document.getElementById('celebration-title');
    const celebrationMessage = document.getElementById('celebration-message');
    const celebrationContinueBtn = document.getElementById('celebration-continue-btn');
    const confettiContainer = document.querySelector('.confetti-container');

    // Clear any previous confetti
    confettiContainer.innerHTML = '';

    // Set message and title
    celebrationTitle.textContent = "Level Complete!";
    celebrationMessage.textContent = message.replace(/\n/g, '<br>'); // Handle newlines

    // Set button text and logic
    if (nextLevelValue && nextLevelValue <= 20) { // UPDATED FROM 10 TO 20
        celebrationContinueBtn.textContent = `Play Level ${nextLevelValue}`;
        celebrationContinueBtn.onclick = () => {
            celebrationOverlay.classList.remove('active');
            celebrationOverlay.addEventListener('transitionend', () => {
                startClassicLevel(nextLevelValue);
            }, { once: true });
        };
    } else {
        celebrationContinueBtn.textContent = `Back to Levels`;
        celebrationContinueBtn.onclick = () => {
            celebrationOverlay.classList.remove('active');
            celebrationOverlay.addEventListener('transitionend', () => {
                showClassicLevels();
            }, { once: true });
        };
    }

    // Activate overlay
    celebrationOverlay.classList.add('active');

    // Generate confetti
    const confettiColors = ['#ff00ff', '#00ffff', '#ffff00', '#ff6600', '#00ff00']; // Neon colors
    for (let i = 0; i <= 100; i++) { // Corrected loop condition from '>' to '<='
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.backgroundColor = confettiColors[Math.floor(Math.random() * confettiColors.length)];
        confetti.style.left = `${Math.random() * 100}vw`;
        confetti.style.animationDelay = `${Math.random() * 2}s`; // Stagger animation
        confettiContainer.appendChild(confetti);
    }
}


/**
 * Initializes and starts or stops the background music loop and Tone.Transport.
 * This function handles the actual Tone.js audio state.
 * @param {boolean} shouldPlay - True to start, false to stop.
 */
function toggleBackgroundMusic(shouldPlay) {
    if (shouldPlay) {
        // Create and start loop only if it doesn't exist or was disposed
        if (!backgroundMusicLoop) { // Only create if null
            backgroundMusicLoop = new Tone.Loop(time => {
                // Background music notes, now triggered by bgmSynth
                bgmSynth.triggerAttackRelease("C4", "8n", time);
                bgmSynth.triggerAttackRelease("E4", "8n", time + 0.25);
                bgmSynth.triggerAttackRelease("G4", "8n", time + 0.5);
            }, "1n"); // No .connect() here, as the synth is already connected to bgmVolumeNode
            Tone.Transport.bpm.value = 120;
        }
        if (Tone.context.state === 'running' && backgroundMusicLoop.state !== 'started') {
            backgroundMusicLoop.start(0); // Start loop from the beginning of the transport
            if (Tone.Transport.state !== 'started') {
                Tone.Transport.start(); // Ensure transport is running
            }
        }
        // Set volume based on slider
        const volumeDb = (parseFloat(bgMusicVolume.value) * 40) - 40;
        bgmVolumeNode.volume.value = (parseFloat(bgMusicVolume.value) === 0) ? -Infinity : volumeDb;
    } else {
        bgmVolumeNode.volume.value = -Infinity; // Mute BGM
        if (backgroundMusicLoop) {
            backgroundMusicLoop.stop();
            backgroundMusicLoop.dispose(); // Dispose to fully clear resources
            backgroundMusicLoop = null; // Set to null for re-creation
        }
        // Do NOT call Tone.Transport.stop() here. Other game sounds might still be needed.
        // Tone.Transport state should be managed by game start/pause/end, not by individual sound toggles.
    }
}


// --- Event Listener for initial page load ---
// Flag to control click sound
let canPlayClickSound = true;
const clickSoundCooldown = 50; // milliseconds

document.addEventListener('DOMContentLoaded', () => {
    // Load initial currency from local storage
    currency = parseInt(localStorage.getItem('currency') || '0');
    updateUI(); // Update UI with loaded currency

    // Apply saved theme
    applyTheme(currentTheme);

    // Dynamically attach event listeners to buttons
    document.getElementById('startGameButton').addEventListener('click', showJarModeScreen);

    // Menu button to toggle the menu options
    const mainMenuButton = document.getElementById('mainMenuButton');
    const homeMenuOptions = document.getElementById('home-menu-options');

    mainMenuButton.addEventListener('click', () => {
        console.log("Main Menu button clicked."); // Debug log
        homeMenuOptions.classList.toggle('show-menu');
    });

    // Existing buttons now inside the menu, so their listeners are fine.
    document.getElementById('howToPlayButton').addEventListener('click', howToPlayFromMenu);
    document.getElementById('themesButton').addEventListener('click', themesFromMenu);
    document.getElementById('viewAchievementsButton').addEventListener('click', achievementsFromMenu);

    // User Profile Button listener
    document.getElementById('userProfileButton').addEventListener('click', showUserProfileModal);


    document.getElementById('classicModeButton').addEventListener('click', showClassicLevels);
    document.getElementById('blitzModeButton').addEventListener('click', showBlitzLevels); // Modified to show Blitz level select
    document.getElementById('endlessModeButton').addEventListener('click', showEndlessDifficulties); // Modified to show Endless difficulty select
    document.getElementById('hardcoreModeButton').addEventListener('click', showHardcoreDifficulties); // Modified to show Hardcore difficulty select
    document.getElementById('backToHomeFromJarMode').addEventListener('click', () => showCustomModal('confirmExitGame'));
    document.getElementById('backToJarMode').addEventListener('click', showJarModeScreen);
    document.getElementById('backToJarModeFromBlitz').addEventListener('click', showJarModeScreen); // New back button for Blitz select
    document.getElementById('backToJarModeFromEndless').addEventListener('click', showJarModeScreen); // New back button for Endless select
    document.getElementById('backToJarModeFromHardcore').addEventListener('click', showJarModeScreen); // New back button for Hardcore select
    document.getElementById('pauseGameButton').addEventListener('click', pauseGame);
    document.getElementById('restartGameButton').addEventListener('click', () => showCustomModal('confirmRestartGame'));
    document.getElementById('exitToMenuButton').addEventListener('click', () => showCustomModal('confirmExitToMenu'));
    document.getElementById('exitGameButton').addEventListener('click', () => showCustomModal('confirmExitGame'));
    document.getElementById('backToHomeFromHowToPlay').addEventListener('click', goHome);
    document.getElementById('backToHomeFromThemes').addEventListener('click', goHome); // New Themes back button listener
    document.getElementById('backToHomeFromGallery').addEventListener('click', goHome);

    // Background music toggle functionality
    bgMusicToggle.addEventListener('change', async () => {
        // Ensure Tone.js context is running before attempting to control audio
        if (Tone.context.state !== 'running') {
            try {
                await Tone.start();
                console.log('Tone.js audio context started by toggle change');
            } catch (e) {
                console.error("Error starting Tone.js context from toggle:", e);
                return; // Exit if context fails to start
            }
        }
        toggleBackgroundMusic(bgMusicToggle.checked);
    });

    // Background music volume control - controls master volume
    bgMusicVolume.addEventListener('input', () => {
        // Map slider value (0-1) to decibels (-40dB to 0dB, using a linear scale)
        const volumeDb = (parseFloat(bgMusicVolume.value) * 40) - 40;
        // FIX: Correctly control the specific bgmVolumeNode, not Tone.Destination
        bgmVolumeNode.volume.value = (parseFloat(bgMusicVolume.value) === 0) ? -Infinity : volumeDb;
    });

    // Helper functions to hide the menu when a menu item is clicked
    function hideHomeMenu() {
        homeMenuOptions.classList.remove('show-menu');
    }

    function howToPlayFromMenu() {
        hideHomeMenu();
        showHowToPlayScreen();
    }

    function themesFromMenu() {
        hideHomeMenu();
        showThemesScreen();
    }

    function achievementsFromMenu() {
        hideHomeMenu();
        showGallery();
    }

    // Add a global click listener for all buttons to play a sound
    document.addEventListener('click', async (event) => {
        if (event.target.tagName === 'BUTTON' || event.target.closest('button')) {
            // Check if audio context is running and if sounds are generally enabled
            if (bgMusicToggle.checked && Tone.context.state === 'running' && canPlayClickSound) {
                 // --- FIX 3 of 3: Robustness fix ---
                // Removed explicit time to prevent timing errors on clicks.
                clickSynth.triggerAttackRelease("C7", "32n");
                canPlayClickSound = false;
                setTimeout(() => {
                    canPlayClickSound = true;
                }, clickSoundCooldown);
            }
        }
    });



    // Run daily bonus check on load
    checkDailyBonus();

    // Initial screen is set via HTML 'active' class.
    // Ensure home screen is visible on load.
    showScreen("home-screen");
});
