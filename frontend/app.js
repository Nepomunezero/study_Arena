// Frontend app.js
const API_URL = (window.location.origin.includes("http") ? window.location.origin : "") + "/api/courses";

let allCourses = [];
let currentPage = 1;
const pageSize = 8;

const resultsEl = document.getElementById("results");
const searchEl = document.getElementById("search");
const typeEl = document.getElementById("type");
const sortEl = document.getElementById("sort");
const refreshBtn = document.getElementById("refresh");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");
const pageInfo = document.getElementById("pageInfo");

async function loadCompetitions() {
  resultsEl.innerHTML = "<p>Loading...</p>";
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    const data = await res.json();
    // Data already normalized by backend: { id, name, description, startDate, type, url }
    allCourses = data;
    currentPage = 1;
    render();
  } catch (err) {
    console.error(err);
    resultsEl.innerHTML = `<p style="color:tomato">Failed to load data: ${err.message}</p>`;
  }
}

function applyFilters(list) {
  const q = searchEl.value.trim().toLowerCase();
  const type = typeEl.value;
  let filtered = list.filter(item => {
    const matchName = item.name && item.name.toLowerCase().includes(q);
    const matchDesc = item.description && item.description.toLowerCase().includes(q);
    const matchType = type ? item.type === type : true;
    return (q ? (matchName || matchDesc) : true) && matchType;
  });

  if (sortEl.value === "name") {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    filtered.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
  }
  return filtered;
}

function render() {
  const filtered = applyFilters(allCourses);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  if (currentPage > totalPages) currentPage = totalPages;

  const startIdx = (currentPage - 1) * pageSize;
  const pageItems = filtered.slice(startIdx, startIdx + pageSize);

  pageInfo.textContent = `Page ${currentPage} / ${totalPages} - ${filtered.length} results`;

  if (pageItems.length === 0) {
    resultsEl.innerHTML = `<p style="color:var(--muted)">No courses found.</p>`;
    return;
  }

  resultsEl.innerHTML = pageItems.map(c => `
    <article class="competition-card">
      <div class="comp-title">${escapeHtml(c.name)}</div>
      <div class="comp-desc">${escapeHtml(c.description || "No description")}</div>
      <div class="comp-meta">
        <span>Start: ${formatDate(c.startDate)}</span>
        <span>Type: ${c.type || "—"}</span>
      </div>
      <div style="margin-top:8px">
        <a href="${c.url}" target="_blank" rel="noopener">Open on Coursera</a>
      </div>
    </article>
  `).join("");
}

function formatDate(d) {
  if (!d) return "Unknown";
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString();
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>"']/g, ch => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[ch]));
}

searchEl.addEventListener("input", () => { currentPage = 1; render(); });
typeEl.addEventListener("change", () => { currentPage = 1; render(); });
sortEl.addEventListener("change", () => { currentPage = 1; render(); });
refreshBtn.addEventListener("click", loadCompetitions);
prevBtn.addEventListener("click", () => { if (currentPage>1) { currentPage--; render(); } });
nextBtn.addEventListener("click", () => { currentPage++; render(); });

window.addEventListener("load", loadCompetitions);
