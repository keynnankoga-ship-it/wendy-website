/* =========================
   DAILY AFFIRMATION
   (366 DAY SYSTEM)
========================= */

const affirmationContainer = document.getElementById("affirmation-text") // Make sure ID matches HTML

async function loadAffirmation() {
  try {
    const res = await fetch("/affirmations");
    const data = await res.json(); // Server now returns { text: "..." }

    let affirmationText = "You are loved.";

    if (data && data.text) {
      affirmationText = data.text;
    }

    // Set the affirmation text in the container
    affirmationContainer.innerText = affirmationText;

  } catch (error) {
    console.error("Affirmation error:", error);
    affirmationContainer.innerText = "You are loved ❤️.";
  }
}

// Run on page load
document.addEventListener("DOMContentLoaded", loadAffirmation);