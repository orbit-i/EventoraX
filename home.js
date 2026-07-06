window.addEventListener("scroll", function () {
      const navbar = document.querySelector(".navbar");
      if (window.scrollY > 0) {
        // adjust threshold as needed
        navbar.classList.add("scrolled");
      } else {
        navbar.classList.remove("scrolled");
      }
    });
// ]==========================problem cards=================================
const cards = document.querySelectorAll(".problem-card");
const section = document.querySelector(".problem-section");
const columns = document.querySelectorAll(".grid-column");


cards.forEach((card) => {
  card.addEventListener("mousemove", (e) => {
    const rect = card.getBoundingClientRect();

    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    card.style.setProperty("--mx", `${x * 12}px`);
    card.style.setProperty("--my", `${y * 12}px`);

    const glow = card.querySelector(".card-glow");
    if (glow) {
      const xp = ((e.clientX - rect.left) / rect.width) * 100;
      const yp = ((e.clientY - rect.top) / rect.height) * 100;

      glow.style.setProperty("--x", `${xp}%`);
      glow.style.setProperty("--y", `${yp}%`);
    }
  });

  card.addEventListener("mouseleave", () => {
    card.style.setProperty("--mx", "0px");
    card.style.setProperty("--my", "0px");
  });
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("show");
    }
  });
}, { threshold: 0.2 });

cards.forEach((card) => revealObserver.observe(card));
// ===============================================================
// ===================reveal transition======================================
// ================================================================
 const reveals = document.querySelectorAll(".reveal");

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("active");
      // If you want it to stay visible once revealed:
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 }); // 10% visible triggers

reveals.forEach(reveal => {
  observer.observe(reveal);
});

const reveal = document.querySelectorAll(".reveal, .reveal-right");

const observers = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("active");
      observers.unobserve(entry.target); // keeps it revealed
    }
  });
}, { threshold: 0.6 });

reveal.forEach(reveal => {
  observers.observe(reveal);
});