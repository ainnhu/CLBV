const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");

if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  siteNav.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      siteNav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    }
  });
}

const joinForm = document.querySelector(".join-form");

if (joinForm) {
  joinForm.addEventListener("submit", () => {
    const button = joinForm.querySelector("button[type='submit']");
    if (button) {
      button.textContent = "Dang mo email...";
    }
  });
}
