// The Buy me a coffee button goes to DEMO.coffeeUrl (set in data.js). Without one, it says so.
(() => {
  const url = (window.DEMO && window.DEMO.coffeeUrl) || "";
  const btn = document.getElementById("coffee-btn"), note = document.getElementById("coffee-note");
  if (/^https:\/\//.test(url)) { btn.href = url; btn.target = "_blank"; note.textContent = "Opens in a new tab."; }
  else { btn.removeAttribute("href"); btn.classList.add("demo-off"); btn.setAttribute("aria-disabled", "true"); note.textContent = "Coffee link coming very soon."; }
})();
