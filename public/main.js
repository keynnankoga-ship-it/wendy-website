/* =========================
   PAGE LOAD
========================= */
document.addEventListener("DOMContentLoaded", () => {
  loadAffirmation();
  loadSongs();
  loadDateIdeas();
  loadGallery();

  // Optional: auto-refresh user interface
  setInterval(loadSongs, 15000);
  setInterval(loadDateIdeas, 15000);
  setInterval(loadGallery, 15000);
});


/* =========================
   DAILY AFFIRMATION
========================= */
async function loadAffirmation() {
  const container = document.getElementById("affirmation-text");
  if (!container) return;

  try {
    const res = await fetch("/affirmations");
    const affirmations = await res.json();

    if (!affirmations || affirmations.length === 0) {
      container.innerText = "You are amazing and today will be a good day ❤️";
      return;
    }

    const today = new Date();
    const start = new Date(today.getFullYear(), 0, 0);
    const diff = today - start;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);

    const todayAffirmation = affirmations[dayOfYear % affirmations.length];

    // Safely display affirmation text
    if (typeof todayAffirmation === "string") {
      container.innerText = todayAffirmation;
    } else if (todayAffirmation.text) {
      container.innerText = todayAffirmation.text;
    } else if (todayAffirmation.affirmation) {
      container.innerText = todayAffirmation.affirmation;
    } else {
      container.innerText = "You are amazing and today will be a good day ❤️";
    }

  } catch (err) {
    console.error("Affirmation loading error:", err);
    container.innerText = "You are amazing and today will be a good day ❤️";
  }
}


/* =========================
   SONGS (Playlist + Song of Day)
========================= */
async function loadSongs() {
  const container = document.getElementById("playlist");
  if (!container) return;

  try {
    const res = await fetch("/songs");
    const songs = await res.json();

    container.innerHTML = "";

    songs.forEach(song => {
      const cover = song.cover?.startsWith("/") ? song.cover : "/" + song.cover;
      const audioPath = song.file || song.audio || "";
      const audio = audioPath.startsWith("/") ? audioPath : "/music/" + audioPath;

      const div = document.createElement("div");
      div.className = "song";

      div.innerHTML = `
        <img src="${cover}" width="180">
        <h3>${song.title}</h3>
        <p>${song.artist}</p>
        <audio controls style="width:180px;">
          <source src="${audio}" type="audio/mpeg">
          Your browser does not support audio
        </audio>
      `;

      container.appendChild(div);
    });

    enableAudioControl();

    // Song of the Day
    const dayRes = await fetch("/song-of-the-day");
    const daySong = await dayRes.json();
    const dailyContainer = document.getElementById("dailySong");

    if (daySong && dailyContainer) {
      const cover = daySong.cover?.startsWith("/") ? daySong.cover : "/" + daySong.cover;
      const audioPath = daySong.file || daySong.audio || "";
      const audio = audioPath.startsWith("/") ? audioPath : "/music/" + audioPath;

      dailyContainer.innerHTML = `
        <div class="song">
          <img src="${cover}" width="180">
          <h3>${daySong.title}</h3>
          <p>${daySong.artist}</p>
          <audio controls style="width:180px;">
            <source src="${audio}" type="audio/mpeg">
          </audio>
        </div>
      `;
    }

  } catch (err) {
    console.error("Song loading error:", err);
  }
}


/* =========================
   AUTO PAUSE OTHER SONGS
========================= */
function enableAudioControl() {
  const audios = document.querySelectorAll("audio");
  audios.forEach(audio => {
    audio.onplay = () => {
      audios.forEach(other => {
        if (other !== audio) other.pause();
      });
    };
  });
}


/* =========================
   DATE IDEAS
========================= */
async function loadDateIdeas() {
  const container = document.getElementById("dateIdeas");
  if (!container) return;

  try {
    const res = await fetch("/dateIdeas");
    const ideas = await res.json();

    container.innerHTML = "";

    ideas.forEach(idea => {
      const div = document.createElement("div");
      div.className = "date-card";

      div.innerHTML = `
        <h3>${idea.title}</h3>
        <p>${idea.description}</p>
      `;

      container.appendChild(div);
    });

  } catch (err) {
    console.error("Date ideas error:", err);
  }
}


/* =========================
   GALLERY
========================= */
async function loadGallery() {
  const container = document.getElementById("photoGallery");
  if (!container) return;

  container.innerHTML = "";

  try {
    const res = await fetch("/gallery");
    const photos = await res.json();

    photos.forEach(photo => {
      const img = document.createElement("img");
      img.src = photo.url;
      container.appendChild(img);
    });

  } catch (err) {
    console.error("Gallery DB error:", err);
  }

  // Public gallery fallback
  const publicPhotos = [];
  for (let i = 1; i <= 24; i++) {
    publicPhotos.push(`/gallery/gallery${i}.jpeg`);
  }

  publicPhotos.forEach(src => {
    const img = document.createElement("img");
    img.src = src;
    container.appendChild(img);
  });

  enableGalleryLightbox();
}


/* =========================
   LIGHTBOX
========================= */
function enableGalleryLightbox() {
  const gallery = document.getElementById("photoGallery");
  if (!gallery) return;

  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");

  gallery.querySelectorAll("img").forEach(img => {
    img.onclick = () => {
      lightbox.style.display = "flex";
      lightboxImg.src = img.src;
    };
  });

  lightbox.onclick = () => {
    lightbox.style.display = "none";
  };
}