(() => {
    "use strict";

    const config = window.SITE_CONFIG || {};
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const compact = window.matchMedia("(max-width: 767px)");
    const header = document.querySelector(".site-header");
    const toggle = document.querySelector(".menu-toggle");
    const navigation = document.querySelector(".navigation");
    const film = document.querySelector(".artist-film video");

    document.querySelectorAll("[data-copy]").forEach((element) => {
        const value = element.dataset.copy.split(".").reduce((object, key) => {
            return object?.[key];
        }, config);

        if (typeof value === "string") {
            element.textContent = value;
        }
    });

    document.querySelectorAll("[data-image]").forEach((element) => {
        const source = config.images?.[element.dataset.image];

        if (source) {
            element.src = source;
        }
    });

    document.querySelectorAll(".work img").forEach((image, index) => {
        const work = config.works?.[index];

        if (work) {
            image.src = work.src;
            image.alt = work.alt;
            image.style.objectPosition = work.position || "50% 50%";
        }
    });

    function webUrl(value) {
        if (!value) {
            return "";
        }

        try {
            const url = new URL(value);
            return ["https:", "http:"].includes(url.protocol) ? url.href : "";
        } catch {
            return "";
        }
    }

    const contacts = config.contacts || {};
    const phone = (contacts.phone || "").trim();
    const dial = phone.replace(/[\s().-]/g, "");
    const phoneUrl = /^\+?\d{5,15}$/.test(dial) ? `tel:${dial}` : "";
    const cardData = {
        address: {
            text: contacts.address || contacts.addressText,
            href: webUrl(contacts.mapsUrl)
        },
        phone: {
            text: phone || contacts.phoneText,
            href: phoneUrl
        },
        reviews: {
            text: contacts.reviewsText,
            href: webUrl(contacts.reviewsUrl)
        }
    };

    document.querySelectorAll("[data-contact]").forEach((card) => {
        const data = cardData[card.dataset.contact];

        if (data.text) {
            card.querySelector("p").textContent = data.text;
        }

        if (data.href) {
            const link = document.createElement("a");
            link.className = `${card.className} is-linked`;
            link.href = data.href;

            if (data.href.startsWith("http")) {
                link.target = "_blank";
                link.rel = "noopener noreferrer";
            }

            link.append(...card.childNodes);
            card.replaceWith(link);
        }
    });

    const booking = webUrl(contacts.bookingUrl);

    if (booking) {
        document.querySelectorAll("[data-booking]").forEach((link) => {
            link.href = booking;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
        });
    }

    function setMenu(open, restoreFocus = false) {
        toggle.setAttribute("aria-expanded", String(open));
        toggle.querySelector(".menu-label").textContent = open ? "CHIUDI" : "MENU";
        header.classList.toggle("menu-open", open);
        navigation.inert = compact.matches && !open;

        if (restoreFocus) {
            toggle.focus();
        }
    }

    toggle.addEventListener("click", () => {
        setMenu(toggle.getAttribute("aria-expanded") !== "true");
    });

    navigation.addEventListener("click", (event) => {
        if (event.target.closest("a")) {
            setMenu(false);
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && header.classList.contains("menu-open")) {
            setMenu(false, true);
        }
    });

    document.addEventListener("pointerdown", (event) => {
        if (!header.contains(event.target)) {
            setMenu(false);
        }
    });

    header.addEventListener("focusout", (event) => {
        if (!header.contains(event.relatedTarget)) {
            setMenu(false);
        }
    });

    compact.addEventListener("change", () => setMenu(false));
    setMenu(false);

    const revealItems = document.querySelectorAll(".reveal");
    let revealObserver;

    function initializeReveals() {
        revealObserver?.disconnect();

        if (motion.matches || !("IntersectionObserver" in window)) {
            document.documentElement.classList.remove("motion-ready");
            revealItems.forEach((element) => element.classList.add("is-visible"));
            return;
        }

        document.documentElement.classList.add("motion-ready");
        revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.08
        });

        revealItems.forEach((element) => revealObserver.observe(element));
    }

    document.querySelectorAll(".work, .contact-card, .artist-specialties li").forEach((element) => {
        const index = [...element.parentElement.children].indexOf(element);
        element.style.setProperty("--reveal-delay", `${index * 65}ms`);
    });

    initializeReveals();
    motion.addEventListener("change", initializeReveals);

    let filmInView = false;

    function updateFilm() {
        if (filmInView && !motion.matches && !document.hidden) {
            film.play().catch(() => {
                // Il poster rimane visibile se il browser impedisce l'autoplay.
            });
        } else {
            film.pause();
        }
    }

    if (film) {
        film.muted = true;

        if ("IntersectionObserver" in window) {
            new IntersectionObserver((entries) => {
                filmInView = entries[0].isIntersecting;
                updateFilm();
            }, { rootMargin: "120px" }).observe(film);
        } else {
            filmInView = true;
        }

        motion.addEventListener("change", updateFilm);
        document.addEventListener("visibilitychange", updateFilm);
        updateFilm();
    }

    if ("IntersectionObserver" in window) {
        const sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) {
                    return;
                }

                navigation.querySelectorAll('a[href^="#"]:not(.nav-book)').forEach((link) => {
                    if (link.hash === `#${entry.target.id}`) {
                        link.setAttribute("aria-current", "location");
                    } else {
                        link.removeAttribute("aria-current");
                    }
                });
            });
        }, {
            rootMargin: "-15% 0px -65% 0px"
        });

        document.querySelectorAll(".section").forEach((section) => {
            sectionObserver.observe(section);
        });
    }
})();
