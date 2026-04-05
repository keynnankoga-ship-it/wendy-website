/* =========================
   ADMIN LOGIN
========================= */
async function login() {
  const password = document.getElementById("password").value;

  const res = await fetch("/admin-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password })
  });

  if (res.ok) {
    document.getElementById("panel").style.display = "block";
    document.getElementById("login").style.display = "none";
    loadSongs();
    loadGallery();
    loadDates();
    loadPlaylists();
  } else {
    alert("Wrong password");
  }
}

/* =========================
   SESSION CHECK
========================= */
async function checkLogin() {
  const res = await fetch("/admin-check");
  const data = await res.json();

  if (data.logged) {
    document.getElementById("panel").style.display = "block";
    document.getElementById("login").style.display = "none";
    loadSongs();
    loadGallery();
    loadDates();
    loadPlaylists();
  }
}

checkLogin();

/* =========================
   SONGS
========================= */
async function addSong() {
  const song = {
    title: document.getElementById("title").value,
    artist: document.getElementById("artist").value,
    audio: document.getElementById("audio").value,
    cover: document.getElementById("cover").value
  };

  await fetch("/admin/add-song", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(song)
  });

  alert("Song added");
  loadSongs();
}

async function loadSongs() {
  const res = await fetch("/songs");
  const songs = await res.json();
  const container = document.getElementById("songs");
  container.innerHTML = "";
  
  songs.forEach(song => {
    const audioPath = song.audio || song.file || song.title + ".mp3";
    const audio = audioPath.startsWith("/music/") ? audioPath : "/music/" + audioPath;
    const cover = song.cover?.startsWith("/") ? song.cover : "/" + song.cover;

    const card = document.createElement("div");
    card.className = "song-item"; // Use a flex-friendly class

    card.innerHTML = `
      <img src="${cover}" style="width:180px">
      <h4>${song.title}</h4>
      <p>${song.artist}</p>
      <audio controls style="width:180px">
        <source src="${audio}" type="audio/mpeg">
      </audio>
      <button class="delete-btn" onclick="deleteSong('${song._id}')">Delete</button>
    `;

    container.appendChild(card);
  });

  enableAudioControl();
}

async function deleteSong(id) {
  await fetch("/admin/delete-song/" + id, { method: "DELETE" });
  loadSongs();
}

/* =========================
   GALLERY
========================= */
async function addPhoto() {
  const url = document.getElementById("photoUrl").value;

  await fetch("/admin/add-photo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url })
  });

  alert("Photo added");
  loadGallery();
}

async function loadGallery() {
  const res = await fetch("/gallery");
  const photos = await res.json();
  const container = document.getElementById("galleryAdmin");
  container.innerHTML = "";

  photos.forEach(photo => {
    const card = document.createElement("div");
    card.className = "gallery-item"; // horizontal scroll

    card.innerHTML = `
      <img src="${photo.url}" style="width:180px">
      <button class="delete-btn" onclick="deletePhoto('${photo._id}')">Delete</button>
    `;

    container.appendChild(card);
  });
}

async function deletePhoto(id) {
  await fetch("/admin/delete-photo/" + id, { method: "DELETE" });
  loadGallery();
}

/* =========================
   DATE IDEAS
========================= */
async function addDate() {
  const idea = {
    title: document.getElementById("dateTitle").value,
    description: document.getElementById("dateDesc").value
  };

  await fetch("/admin/add-date", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(idea)
  });

  alert("Date idea added");
  loadDates();
}

async function loadDates() {
  const res = await fetch("/dateIdeas");
  const ideas = await res.json();
  const container = document.getElementById("dateIdeasAdmin");
  container.innerHTML = "";

  ideas.forEach(idea => {
    const card = document.createElement("div");
    card.className = "item"; // horizontal scroll

    card.innerHTML = `
      <h4>${idea.title}</h4>
      <p>${idea.description}</p>
      <button class="delete-btn" onclick="deleteDate('${idea._id}')">Delete</button>
    `;

    container.appendChild(card);
  });
}

async function deleteDate(id) {
  await fetch("/admin/delete-date/" + id, { method: "DELETE" });
  loadDates();
}

/* =========================
   PLAYLISTS
========================= */
async function addPlaylist() {
  const embed = document.getElementById("playlistEmbed").value;

  await fetch("/admin/add-playlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ embed })
  });

  alert("Playlist added");
  loadPlaylists();
}

async function loadPlaylists() {
  const res = await fetch("/playlists");
  const lists = await res.json();
  const container = document.getElementById("playlistsAdmin");
  container.innerHTML = "";

  lists.forEach(list => {
    const card = document.createElement("div");
    card.className = "item"; // horizontal scroll

    card.innerHTML = `
      ${list.embed}
      <button class="delete-btn" onclick="deletePlaylist('${list._id}')">Delete</button>
    `;

    container.appendChild(card);
  });
}

async function deletePlaylist(id) {
  await fetch("/admin/delete-playlist/" + id, { method: "DELETE" });
  loadPlaylists();
}

/* =========================
   SUBSCRIPTIONS
========================= */
async function loadSubs() {
  const res = await fetch("/admin/subscriptions");
  const subs = await res.json();
  const list = document.getElementById("subs");
  list.innerHTML = "";

  subs.forEach(s => {
    const li = document.createElement("li");
    li.innerText = s.token;
    list.appendChild(li);
  });
}

/* =========================
   AUTO PAUSE OTHER SONGS
========================= */
function enableAudioControl() {
  const audios = document.querySelectorAll("audio");
  audios.forEach(audio => {
    audio.onplay = () => {
      audios.forEach(other => { if (other !== audio) other.pause(); });
    };
  });
}