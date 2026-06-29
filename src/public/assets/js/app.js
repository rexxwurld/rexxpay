// ===============================
// UI INTERACTIONS
// ===============================

const menuBtn = document.getElementById("menuBtn");
const nav = document.getElementById("nav");

if (menuBtn && nav) {
    menuBtn.addEventListener("click", () => {
        nav.classList.toggle("active");
    });
}

// Header scroll effect
const header = document.querySelector(".header");

if (header) {
    window.addEventListener("scroll", () => {
        header.classList.toggle("scrolled", window.scrollY > 50);
    });
}

// Counter animation
const counters = document.querySelectorAll(".counter");

counters.forEach(counter => {
    const update = () => {
        const target = Number(counter.dataset.target);
        const current = Number(counter.innerText);
        const increment = target / 100;

        if (current < target) {
            counter.innerText = (current + increment).toFixed(1);
            requestAnimationFrame(update);
        } else {
            counter.innerText = target;
        }
    };

    update();
});

// FAQ
document.querySelectorAll(".faq-question").forEach(question => {
    question.addEventListener("click", () => {
        const item = question.parentElement;

        document.querySelectorAll(".faq-item").forEach(faq => {
            if (faq !== item) {
                faq.classList.remove("active");
            }
        });

        item.classList.toggle("active");
    });
});

// ===============================
// LOGOUT
// ===============================

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
}