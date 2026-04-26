const searchInput = document.querySelector("#site-search");
const searchItems = [...document.querySelectorAll("[data-search-item]")];

searchInput?.addEventListener("input", () => {
  const query = searchInput.value.trim().toLowerCase();

  searchItems.forEach((item) => {
    item.classList.toggle("is-hidden", query && !item.textContent.toLowerCase().includes(query));
  });
});
