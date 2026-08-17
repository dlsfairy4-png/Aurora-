const albums = [
  { title: "Entre Luzes", artist: "Nina Vale", cover: "cover-aurora", initials: "EL", track: 0 },
  { title: "Sol de Inverno", artist: "Caio Mar", cover: "cover-solar", initials: "SI", track: 1 },
  { title: "Maré Baixa", artist: "Lume Azul", cover: "cover-ocean", initials: "MB", track: 2 },
  { title: "Concreto", artist: "Clara Norte", cover: "cover-mono", initials: "CO", track: 3 },
  { title: "Jardim Secreto", artist: "Duo Flora", cover: "cover-flora", initials: "JS", track: 4 },
];

const tracks = [
  {
    title: "Luzes da Cidade",
    artist: "Nina Vale",
    album: "Entre Luzes",
    genre: "pop",
    duration: 222,
    cover: "cover-aurora",
    initials: "AU",
    notes: [261.63, 329.63, 392, 493.88, 392, 329.63, 293.66, 349.23],
  },
  {
    title: "Depois do Sol",
    artist: "Caio Mar",
    album: "Sol de Inverno",
    genre: "indie",
    duration: 198,
    cover: "cover-solar",
    initials: "DS",
    notes: [220, 277.18, 329.63, 369.99, 329.63, 277.18, 246.94, 293.66],
  },
  {
    title: "Oceano Particular",
    artist: "Lume Azul",
    album: "Maré Baixa",
    genre: "electronic",
    duration: 245,
    cover: "cover-ocean",
    initials: "OP",
    notes: [196, 246.94, 293.66, 392, 293.66, 246.94, 220, 261.63],
  },
  {
    title: "Tudo em Silêncio",
    artist: "Clara Norte",
    album: "Concreto",
    genre: "indie",
    duration: 214,
    cover: "cover-mono",
    initials: "TS",
    notes: [174.61, 220, 261.63, 311.13, 261.63, 233.08, 196, 233.08],
  },
  {
    title: "Verde Neon",
    artist: "Duo Flora",
    album: "Jardim Secreto",
    genre: "electronic",
    duration: 231,
    cover: "cover-flora",
    initials: "VN",
    notes: [293.66, 369.99, 440, 554.37, 440, 392, 329.63, 392],
  },
  {
    title: "Quase Verão",
    artist: "Bela Rua",
    album: "Cartas Abertas",
    genre: "pop",
    duration: 187,
    cover: "cover-solar",
    initials: "QV",
    notes: [329.63, 415.3, 493.88, 659.25, 493.88, 440, 369.99, 440],
  },
];

const state = {
  currentTrack: 0,
  isPlaying: false,
  elapsed: 0,
  timer: null,
  filter: "all",
  search: "",
  shuffle: false,
  repeat: false,
  likedTracks: new Set(),
  audioContext: null,
  oscillator: null,
  gain: null,
  noteTimer: null,
};

const albumGrid = document.querySelector("#albumGrid");
const trackList = document.querySelector("#trackList");
const mainPlayButton = document.querySelector("#mainPlayButton");
const heroPlayButton = document.querySelector("#heroPlayButton");
const playerTitle = document.querySelector("#playerTitle");
const playerArtist = document.querySelector("#playerArtist");
const playerCover = document.querySelector("#playerCover");
const currentTime = document.querySelector("#currentTime");
const duration = document.querySelector("#duration");
const progressFill = document.querySelector("#progressFill");
const progressThumb = document.querySelector("#progressThumb");
const progressTrack = document.querySelector("#progressTrack");
const searchInput = document.querySelector("#searchInput");
const toast = document.querySelector("#toast");
const playlistModal = document.querySelector("#playlistModal");

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

function renderAlbums() {
  albumGrid.innerHTML = albums
    .map(
      (album) => `
        <article class="album-card" data-track="${album.track}" tabindex="0">
          <div class="album-art ${album.cover}">
            <span>${album.initials}</span>
            <button class="album-play" aria-label="Tocar ${album.title}">▶</button>
          </div>
          <h3>${album.title}</h3>
          <p>${album.artist}</p>
        </article>
      `,
    )
    .join("");
}

function renderTracks() {
  const search = state.search.toLowerCase().trim();
  const visibleTracks = tracks.filter((track) => {
    const matchesFilter = state.filter === "all" || track.genre === state.filter;
    const haystack = `${track.title} ${track.artist} ${track.album}`.toLowerCase();
    return matchesFilter && haystack.includes(search);
  });

  if (!visibleTracks.length) {
    trackList.innerHTML = `
      <div class="empty-state">
        Nenhuma música encontrada. Tente outro termo ou gênero.
      </div>
    `;
    return;
  }

  trackList.innerHTML = visibleTracks
    .map((track) => {
      const index = tracks.indexOf(track);
      const liked = state.likedTracks.has(index);
      const playing = index === state.currentTrack && state.isPlaying;
      return `
        <article class="track-row ${playing ? "playing" : ""}" data-track="${index}" tabindex="0">
          <span class="track-number">${playing ? "♫" : String(index + 1).padStart(2, "0")}</span>
          <div class="track-identity">
            <span class="tiny-cover ${track.cover}">${track.initials}</span>
            <div class="track-name">
              <strong>${track.title}</strong>
              <span>${track.artist}</span>
            </div>
          </div>
          <span class="track-album">${track.album}</span>
          <span class="track-duration">${formatTime(track.duration)}</span>
          <button class="row-like ${liked ? "liked" : ""}" data-like="${index}" aria-label="Curtir ${track.title}">
            ${liked ? "♥" : "♡"}
          </button>
        </article>
      `;
    })
    .join("");
}

function updatePlayer() {
  const track = tracks[state.currentTrack];
  playerTitle.textContent = track.title;
  playerArtist.textContent = track.artist;
  duration.textContent = formatTime(track.duration);
  currentTime.textContent = formatTime(state.elapsed);
  playerCover.className = `mini-cover ${track.cover}`;
  playerCover.innerHTML = `<span>${track.initials}</span>`;
  mainPlayButton.textContent = state.isPlaying ? "❚❚" : "▶";
  mainPlayButton.setAttribute("aria-label", state.isPlaying ? "Pausar" : "Reproduzir");
  heroPlayButton.innerHTML = state.isPlaying ? "<span>❚❚</span> Pausar" : "<span>▶</span> Ouvir agora";
  const percentage = Math.min(100, (state.elapsed / track.duration) * 100);
  progressFill.style.width = `${percentage}%`;
  progressThumb.style.left = `${percentage}%`;
  renderTracks();
}

function createAudioEngine() {
  if (!state.audioContext) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    state.audioContext = new AudioContext();
    state.gain = state.audioContext.createGain();
    state.gain.gain.value = Number(document.querySelector("#volumeSlider").value) / 800;
    state.gain.connect(state.audioContext.destination);
  }
}

function stopTone() {
  clearInterval(state.noteTimer);
  if (state.oscillator) {
    try {
      state.oscillator.stop();
    } catch (_) {
      // O oscilador pode já estar parado.
    }
    state.oscillator.disconnect();
    state.oscillator = null;
  }
}

function playToneSequence() {
  createAudioEngine();
  stopTone();
  const track = tracks[state.currentTrack];
  let noteIndex = Math.floor(state.elapsed / 0.48) % track.notes.length;

  const playNote = () => {
    if (!state.isPlaying) return;
    if (state.oscillator) {
      try {
        state.oscillator.stop();
      } catch (_) {}
    }
    const oscillator = state.audioContext.createOscillator();
    oscillator.type = state.currentTrack % 2 ? "triangle" : "sine";
    oscillator.frequency.value = track.notes[noteIndex % track.notes.length];
    oscillator.connect(state.gain);
    oscillator.start();
    state.oscillator = oscillator;
    noteIndex += 1;
  };

  playNote();
  state.noteTimer = setInterval(playNote, 480);
}

function startTimer() {
  clearInterval(state.timer);
  state.timer = setInterval(() => {
    if (!state.isPlaying) return;
    state.elapsed += 1;
    const track = tracks[state.currentTrack];
    if (state.elapsed >= track.duration) {
      if (state.repeat) {
        state.elapsed = 0;
        playToneSequence();
      } else {
        nextTrack();
      }
    }
    updatePlayer();
  }, 1000);
}

function playTrack(index = state.currentTrack) {
  state.currentTrack = Number(index);
  state.elapsed = 0;
  state.isPlaying = true;
  playToneSequence();
  startTimer();
  updatePlayer();
}

function togglePlay() {
  state.isPlaying = !state.isPlaying;
  if (state.isPlaying) {
    playToneSequence();
    startTimer();
  } else {
    clearInterval(state.timer);
    stopTone();
  }
  updatePlayer();
}

function nextTrack() {
  const next = state.shuffle
    ? Math.floor(Math.random() * tracks.length)
    : (state.currentTrack + 1) % tracks.length;
  playTrack(next);
}

function previousTrack() {
  if (state.elapsed > 4) {
    state.elapsed = 0;
    if (state.isPlaying) playToneSequence();
    updatePlayer();
    return;
  }
  playTrack((state.currentTrack - 1 + tracks.length) % tracks.length);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => toast.classList.remove("show"), 2200);
}

function toggleLike(index = state.currentTrack) {
  const trackIndex = Number(index);
  if (state.likedTracks.has(trackIndex)) {
    state.likedTracks.delete(trackIndex);
    showToast("Removida das suas favoritas");
  } else {
    state.likedTracks.add(trackIndex);
    showToast("Adicionada às suas favoritas");
  }
  document.querySelector("#likeButton").classList.toggle(
    "liked",
    state.likedTracks.has(state.currentTrack),
  );
  document.querySelector("#likeButton").textContent =
    state.likedTracks.has(state.currentTrack) ? "♥" : "♡";
  renderTracks();
}

albumGrid.addEventListener("click", (event) => {
  const card = event.target.closest(".album-card");
  if (card) playTrack(card.dataset.track);
});

albumGrid.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    const card = event.target.closest(".album-card");
    if (card) playTrack(card.dataset.track);
  }
});

trackList.addEventListener("click", (event) => {
  const like = event.target.closest("[data-like]");
  if (like) {
    event.stopPropagation();
    toggleLike(like.dataset.like);
    return;
  }
  const row = event.target.closest(".track-row");
  if (row) playTrack(row.dataset.track);
});

trackList.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    const row = event.target.closest(".track-row");
    if (row) playTrack(row.dataset.track);
  }
});

mainPlayButton.addEventListener("click", togglePlay);
heroPlayButton.addEventListener("click", togglePlay);
document.querySelector("#nextButton").addEventListener("click", nextTrack);
document.querySelector("#previousButton").addEventListener("click", previousTrack);
document.querySelector("#likeButton").addEventListener("click", () => toggleLike());

document.querySelector("#shuffleButton").addEventListener("click", (event) => {
  state.shuffle = !state.shuffle;
  event.currentTarget.classList.toggle("active", state.shuffle);
  showToast(state.shuffle ? "Modo aleatório ativado" : "Modo aleatório desativado");
});

document.querySelector("#repeatButton").addEventListener("click", (event) => {
  state.repeat = !state.repeat;
  event.currentTarget.classList.toggle("active", state.repeat);
  showToast(state.repeat ? "Repetição ativada" : "Repetição desativada");
});

progressTrack.addEventListener("click", (event) => {
  const rect = progressTrack.getBoundingClientRect();
  const percentage = (event.clientX - rect.left) / rect.width;
  state.elapsed = Math.max(0, Math.min(tracks[state.currentTrack].duration, percentage * tracks[state.currentTrack].duration));
  if (state.isPlaying) playToneSequence();
  updatePlayer();
});

document.querySelector("#volumeSlider").addEventListener("input", (event) => {
  if (state.gain) state.gain.gain.value = Number(event.target.value) / 800;
});

searchInput.addEventListener("input", (event) => {
  state.search = event.target.value;
  renderTracks();
  document.querySelector(".chart-section").scrollIntoView({ behavior: "smooth", block: "start" });
});

document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    searchInput.focus();
  }
  if (event.code === "Space" && document.activeElement.tagName !== "INPUT") {
    event.preventDefault();
    togglePlay();
  }
  if (event.key === "Escape") closePlaylistModal();
});

document.querySelectorAll("[data-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-filter]").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    state.filter = button.dataset.filter;
    renderTracks();
  });
});

document.querySelectorAll(".nav-item").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    if (button.dataset.view === "search") searchInput.focus();
    if (button.dataset.view === "library") {
      document.querySelector(".section-block").scrollIntoView({ behavior: "smooth" });
    }
    if (button.dataset.view === "home") {
      document.querySelector(".content").scrollTo({ top: 0, behavior: "smooth" });
    }
    document.querySelector("#sidebar").classList.remove("open");
  });
});

document.querySelector("#menuButton").addEventListener("click", () => {
  document.querySelector("#sidebar").classList.toggle("open");
});

function openPlaylistModal() {
  playlistModal.classList.add("open");
  playlistModal.setAttribute("aria-hidden", "false");
  setTimeout(() => document.querySelector("#playlistName").focus(), 100);
}

function closePlaylistModal() {
  playlistModal.classList.remove("open");
  playlistModal.setAttribute("aria-hidden", "true");
}

document.querySelector("#newPlaylistBtn").addEventListener("click", openPlaylistModal);
document.querySelector("#closeModal").addEventListener("click", closePlaylistModal);
playlistModal.addEventListener("click", (event) => {
  if (event.target === playlistModal) closePlaylistModal();
});

document.querySelector("#playlistForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = document.querySelector("#playlistName");
  const playlist = document.createElement("button");
  playlist.className = "playlist-link";
  playlist.textContent = input.value;
  document.querySelector(".sidebar-section").appendChild(playlist);
  showToast(`Playlist “${input.value}” criada`);
  input.value = "";
  closePlaylistModal();
});

document.querySelector("#heroSaveButton").addEventListener("click", (event) => {
  event.currentTarget.classList.toggle("saved");
  const saved = event.currentTarget.classList.contains("saved");
  event.currentTarget.innerHTML = saved ? "♥ Playlist salva" : "♡ Salvar playlist";
  showToast(saved ? "Playlist salva na sua biblioteca" : "Playlist removida da biblioteca");
});

document.querySelector("#exploreBtn").addEventListener("click", () => {
  document.querySelector(".chart-section").scrollIntoView({ behavior: "smooth" });
});

document.querySelector('[data-action="show-all"]').addEventListener("click", () => {
  document.querySelector(".chart-section").scrollIntoView({ behavior: "smooth" });
});

renderAlbums();
renderTracks();
updatePlayer();
