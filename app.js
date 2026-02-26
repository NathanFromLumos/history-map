const map = L.map('map').setView([30, 15], 3);

L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
  attribution: '© OpenStreetMap contributors & CartoDB'
}).addTo(map);

const availableYears = [
  -2000, -1000, -500, -400, -323, -200, -100,
  100, 200, 300, 400, 500,
  600, 700, 800, 900, 1000,
  1100, 1200, 1300, 1400, 1500,
  1600, 1700, 1800, 1900
];

function formatYear(year) {
  return year < 0 ? Math.abs(year) + ' BC' : year + ' AD';
}

function getGeoJSONUrl(year) {
  const filename = year < 0
    ? `world_bc${Math.abs(year)}.geojson`
    : `world_${year}.geojson`;
  return `https://raw.githubusercontent.com/aourednik/historical-basemaps/master/geojson/${filename}`;
}

function nameToColour(name) {
  if (!name) return '#aaaaaa';
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 55%)`;
}

let currentLayer = null;
let currentYear = null;
const loading = document.getElementById('loading');

function loadBorders(year) {
  if (year === currentYear) return;
  currentYear = year;

  if (currentLayer) {
    map.removeLayer(currentLayer);
    currentLayer = null;
  }

  loading.style.display = 'block';

  fetch(getGeoJSONUrl(year))
    .then(res => res.json())
    .then(data => {
      if (currentLayer) {
        map.removeLayer(currentLayer);
        currentLayer = null;
      }

      currentLayer = L.geoJSON(data, {
        style: function(feature) {
          const name = feature.properties.SUBJECTO || feature.properties.NAME;
          const colour = nameToColour(name);
          return {
            color: '#333',
            weight: 0.8,
            fillColor: colour,
            fillOpacity: 0.5
          };
        },
        onEachFeature: function (feature, layer) {
          if (feature.properties && feature.properties.NAME) {
            layer.bindTooltip(feature.properties.NAME, { sticky: true });
          }
        }
      }).addTo(map);

      loading.style.display = 'none';
    })
    .catch(err => {
      console.error('Failed to load borders:', err);
      loading.style.display = 'none';
    });
}

// ─── Slider ───
const slider = document.getElementById('year-slider');
const yearDisplay = document.getElementById('year-display');

slider.addEventListener('input', function () {
  const year = availableYears[parseInt(this.value)];
  yearDisplay.textContent = formatYear(year);
  loadBorders(year);
});

// ─── Play / Pause ───
const playBtn = document.getElementById('play-btn');
let isPlaying = false;
let playInterval = null;

playBtn.addEventListener('click', function () {
  if (isPlaying) {
    clearInterval(playInterval);
    playInterval = null;
    isPlaying = false;
    playBtn.textContent = '▶ Play';
  } else {
    if (parseInt(slider.value) >= availableYears.length - 1) {
      slider.value = 0;
    }
    isPlaying = true;
    playBtn.textContent = '⏸ Pause';
    playInterval = setInterval(function () {
      const next = parseInt(slider.value) + 1;
      if (next >= availableYears.length) {
        clearInterval(playInterval);
        playInterval = null;
        isPlaying = false;
        playBtn.textContent = '▶ Play';
        return;
      }
      slider.value = next;
      const year = availableYears[next];
      yearDisplay.textContent = formatYear(year);
      loadBorders(year);
    }, 1500);
  }
});

// ─── Landing Modal ───
document.getElementById('enter-btn').addEventListener('click', function () {
  const overlay = document.getElementById('landing-overlay');
  overlay.style.transition = 'opacity 0.5s ease';
  overlay.style.opacity = '0';
  setTimeout(() => overlay.style.display = 'none', 500);
});

// ─── Load default year ───
loadBorders(availableYears[20]);
yearDisplay.textContent = formatYear(availableYears[20]);