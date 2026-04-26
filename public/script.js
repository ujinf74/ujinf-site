const searchInput = document.querySelector("#site-search");
const entryForm = document.querySelector("#entry-form");
const entryList = document.querySelector("#entry-list");
const entryStatus = document.querySelector("#entry-status");
let searchItems = [...document.querySelectorAll("[data-search-item]")];

searchInput?.addEventListener("input", () => {
  const query = searchInput.value.trim().toLowerCase();

  searchItems.forEach((item) => {
    item.classList.toggle("is-hidden", query && !item.textContent.toLowerCase().includes(query));
  });
});

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (char) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]
  ));

const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("ko-KR");
};

const renderEntries = (entries) => {
  if (!entryList) return;

  entryList.innerHTML = entries.map((entry) => `
    <article class="entry" data-search-item>
      <span>${escapeHtml(entry.kind)}</span>
      <h3>${escapeHtml(entry.title)}</h3>
      <p>${escapeHtml(entry.body)}</p>
      <time datetime="${escapeHtml(entry.created_at)}">${escapeHtml(formatDate(entry.created_at))}</time>
    </article>
  `).join("");
  searchItems = [...document.querySelectorAll("[data-search-item]")];
};

const loadEntries = async () => {
  if (!entryList) return;

  try {
    const response = await fetch("/api/entries");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    renderEntries(data.entries || []);
  } catch {
    entryList.innerHTML = `
      <article class="entry">
        <span>offline</span>
        <h3>동적 API가 아직 연결되지 않았습니다</h3>
        <p>이 저장소를 Cloudflare Pages Functions로 배포하면 게시판 항목을 읽고 쓸 수 있습니다.</p>
      </article>
    `;
  }
};

entryForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  entryStatus.textContent = "저장 중입니다.";

  const formData = new FormData(entryForm);
  const payload = Object.fromEntries(formData.entries());

  try {
    const response = await fetch("/api/entries", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();

    if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);

    entryForm.reset();
    entryStatus.textContent = "저장했습니다.";
    await loadEntries();
  } catch (error) {
    entryStatus.textContent = error.message || "저장하지 못했습니다.";
  }
});

loadEntries();
