const header = document.querySelector("[data-header]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const navigation = document.querySelector("[data-navigation]");
const menuBackdrop = document.querySelector("[data-menu-backdrop]");
const whatsappGeneralUrl =
  "https://wa.me/5574999626269?text=Ol%C3%A1%21%20Gostaria%20de%20saber%20mais%20sobre%20os%20atendimentos%20do%20Centro%20Odontol%C3%B3gico%20Maeve%20Neves%20e%20da%20BioX.";
const navigationLinks = [...navigation.querySelectorAll('a[href^="#"]')];
const navigationTargets = navigationLinks
  .map((link) => {
    const section = document.querySelector(link.getAttribute("href"));
    return section ? { link, section } : null;
  })
  .filter(Boolean);

const setMenuState = (isOpen) => {
  header.classList.toggle("menu-open", isOpen);
  document.body.classList.toggle("menu-visible", isOpen);
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Fechar menu" : "Abrir menu");
};

const updateHeader = () => {
  header.classList.toggle("scrolled", window.scrollY > 16);
};

const setActiveNavigation = (activeLink) => {
  navigationLinks.forEach((link) => {
    const isActive = link === activeLink;
    link.classList.toggle("active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
};

const updateActiveNavigation = () => {
  const referenceLine = header.offsetHeight + 36;
  let active = navigationTargets[0]?.link;

  navigationTargets.forEach(({ link, section }) => {
    const rect = section.getBoundingClientRect();
    if (rect.top <= referenceLine && rect.bottom > referenceLine) {
      active = link;
    }
  });

  if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 8) {
    active = navigationLinks.find((link) => link.getAttribute("href") === "#contato") || active;
  }

  if (active) setActiveNavigation(active);
};

menuToggle.addEventListener("click", () => {
  setMenuState(!header.classList.contains("menu-open"));
});

menuBackdrop.addEventListener("click", () => setMenuState(false));

navigation.addEventListener("click", (event) => {
  const link = event.target.closest("a");

  if (link) {
    if (navigationLinks.includes(link)) setActiveNavigation(link);
    setMenuState(false);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setMenuState(false);
    menuToggle.focus();
  }
});

window.addEventListener(
  "scroll",
  () => {
    updateHeader();
    updateActiveNavigation();
  },
  { passive: true }
);
window.addEventListener("resize", () => {
  if (window.innerWidth > 1180) setMenuState(false);
  updateActiveNavigation();
});

updateHeader();
updateActiveNavigation();

const carouselInterval = 5000;
const carouselInteractionPause = 8000;

const initializeCarousel = (carousel) => {
  const viewport = carousel.querySelector("[data-carousel-viewport]");
  const slides = [...carousel.querySelectorAll(".carousel-slide")];
  const dotsContainer = carousel.querySelector("[data-carousel-dots]");
  const previousButton = carousel.querySelector("[data-carousel-prev]");
  const nextButton = carousel.querySelector("[data-carousel-next]");
  const startDelay = Number(carousel.dataset.startDelay || 0);

  let activeIndex = 0;
  let timerId;
  let pauseUntil = 0;
  let pointerStartX = 0;
  let pointerDeltaX = 0;
  let activePointerId = null;

  const dots = slides.map((_, index) => {
    const dot = document.createElement("button");
    dot.className = "carousel-dot";
    dot.type = "button";
    dot.setAttribute("aria-label", `Mostrar imagem ${index + 1}`);
    dot.setAttribute("aria-current", String(index === 0));
    dot.addEventListener("click", () => {
      showSlide(index, index > activeIndex ? 1 : -1);
      pauseAutoplay();
    });
    dotsContainer.append(dot);
    return dot;
  });

  const scheduleAutoplay = (delay = carouselInterval) => {
    window.clearTimeout(timerId);
    const remainingPause = Math.max(0, pauseUntil - Date.now());
    timerId = window.setTimeout(() => {
      showSlide(activeIndex + 1, 1);
      scheduleAutoplay();
    }, Math.max(delay, remainingPause));
  };

  const pauseAutoplay = () => {
    pauseUntil = Date.now() + carouselInteractionPause;
    scheduleAutoplay(carouselInteractionPause);
  };

  const showSlide = (requestedIndex, direction = 1) => {
    const nextIndex = (requestedIndex + slides.length) % slides.length;
    if (nextIndex === activeIndex) return;

    const outgoingSlide = slides[activeIndex];
    const incomingSlide = slides[nextIndex];

    outgoingSlide.classList.add(direction > 0 ? "is-leaving-next" : "is-leaving-prev");
    outgoingSlide.classList.remove("is-active");
    outgoingSlide.setAttribute("aria-hidden", "true");

    incomingSlide.classList.remove("is-leaving-next", "is-leaving-prev");
    incomingSlide.classList.add("is-active");
    incomingSlide.setAttribute("aria-hidden", "false");

    dots[activeIndex].setAttribute("aria-current", "false");
    dots[nextIndex].setAttribute("aria-current", "true");
    activeIndex = nextIndex;

    window.setTimeout(() => {
      outgoingSlide.classList.remove("is-leaving-next", "is-leaving-prev");
    }, 700);
  };

  const resetDrag = () => {
    slides.forEach((slide) => slide.style.removeProperty("--drag-x"));
    viewport.classList.remove("is-dragging");
    activePointerId = null;
    pointerDeltaX = 0;
  };

  previousButton.addEventListener("click", () => {
    showSlide(activeIndex - 1, -1);
    pauseAutoplay();
  });

  nextButton.addEventListener("click", () => {
    showSlide(activeIndex + 1, 1);
    pauseAutoplay();
  });

  viewport.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    activePointerId = event.pointerId;
    pointerStartX = event.clientX;
    pointerDeltaX = 0;
    viewport.classList.add("is-dragging");
    viewport.setPointerCapture?.(event.pointerId);
    pauseAutoplay();
  });

  viewport.addEventListener("pointermove", (event) => {
    if (event.pointerId !== activePointerId) return;
    pointerDeltaX = event.clientX - pointerStartX;
    const visualDelta = Math.max(-24, Math.min(24, pointerDeltaX * 0.24));
    slides[activeIndex].style.setProperty("--drag-x", `${visualDelta}px`);
  });

  const finishDrag = (event) => {
    if (event.pointerId !== activePointerId) return;
    if (Math.abs(pointerDeltaX) > 42) {
      showSlide(activeIndex + (pointerDeltaX < 0 ? 1 : -1), pointerDeltaX < 0 ? 1 : -1);
    }
    resetDrag();
  };

  viewport.addEventListener("pointerup", finishDrag);
  viewport.addEventListener("pointercancel", resetDrag);
  viewport.addEventListener("dragstart", (event) => event.preventDefault());

  scheduleAutoplay(startDelay || carouselInterval);
};

document.querySelectorAll("[data-carousel]").forEach(initializeCarousel);

document.querySelectorAll("video[autoplay]").forEach((video) => {
  video.muted = true;
  video.defaultMuted = true;
  video.play().catch(() => undefined);
});

const differentials = document.querySelector("[data-differentials]");

if (differentials) {
  const stage = differentials.querySelector("[data-differentials-stage]");
  const track = differentials.querySelector("[data-differentials-track]");
  const cards = [...differentials.querySelectorAll("[data-differential-card]")];
  const groupButtons = [...differentials.querySelectorAll("[data-differentials-group]")];
  const mobileControls = differentials.querySelector("[data-differentials-mobile-controls]");
  const mobileQuery = window.matchMedia("(max-width: 860px)");
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const desktopSlots = ["top-left", "top-right", "bottom"];

  let activeGroup = 0;
  let mobileIndex = 0;
  let timerId;
  let sequenceTimerIds = [];
  let pauseUntil = 0;
  let isHovered = false;
  let hasEnteredViewport = false;
  let activePointerId = null;
  let pointerStartX = 0;
  let pointerDeltaX = 0;

  const clearLoopTimer = () => {
    window.clearTimeout(timerId);
  };

  const clearSequenceTimers = () => {
    sequenceTimerIds.forEach((id) => window.clearTimeout(id));
    sequenceTimerIds = [];
    cards.forEach((card) => card.classList.remove("is-leaving"));
  };

  const queueSequence = (callback, delay) => {
    const timer = window.setTimeout(() => {
      sequenceTimerIds = sequenceTimerIds.filter((id) => id !== timer);
      callback();
    }, delay);
    sequenceTimerIds.push(timer);
  };

  const getDesktopCard = (group, slot) =>
    cards.find((card) => Number(card.dataset.group) === group && card.dataset.layout === slot);

  const setGroupControls = () => {
    groupButtons.forEach((button, index) => {
      button.setAttribute("aria-current", String(index === activeGroup));
    });
  };

  const mobileDots = cards.map((_, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.setAttribute("aria-label", `Exibir diferencial ${index + 1}`);
    dot.setAttribute("aria-current", String(index === 0));
    dot.addEventListener("click", () => {
      mobileIndex = index;
      renderDifferentials();
      pauseDifferentials();
    });
    mobileControls.append(dot);
    return dot;
  });

  const renderMobileDifferentials = () => {
    cards.forEach((card) => {
      card.classList.remove("is-leaving");
      card.classList.add("is-group-active");
      card.setAttribute("aria-hidden", String(cards.indexOf(card) !== mobileIndex));
    });

    activeGroup = mobileIndex < 3 ? 0 : 1;
    setGroupControls();

    mobileDots.forEach((dot, index) => {
      dot.setAttribute("aria-current", String(index === mobileIndex));
    });

    track.style.setProperty("--mobile-offset", `${mobileIndex * -100}%`);
  };

  const renderDesktopGroup = (group) => {
    activeGroup = group;
    cards.forEach((card) => {
      const isActive = Number(card.dataset.group) === activeGroup;
      card.classList.remove("is-leaving");
      card.classList.toggle("is-group-active", isActive);
      card.setAttribute("aria-hidden", String(!isActive));
    });

    setGroupControls();

    mobileDots.forEach((dot, index) => {
      dot.setAttribute("aria-current", String(index === mobileIndex));
    });

    track.style.setProperty("--mobile-offset", `${mobileIndex * -100}%`);
  };

  const renderDifferentials = () => {
    if (mobileQuery.matches) {
      renderMobileDifferentials();
      return;
    }

    renderDesktopGroup(activeGroup);
  };

  const extendDifferentialsPause = () => {
    pauseUntil = Date.now() + 8000;
  };

  const replaceDesktopSlot = (slot, nextGroup) => {
    const outgoingCard = cards.find((card) => card.dataset.layout === slot && card.classList.contains("is-group-active"));
    const incomingCard = getDesktopCard(nextGroup, slot);

    if (!incomingCard || outgoingCard === incomingCard) return;

    if (outgoingCard) {
      outgoingCard.classList.add("is-leaving");
      outgoingCard.classList.remove("is-group-active");
      outgoingCard.setAttribute("aria-hidden", "true");
    }

    queueSequence(() => {
      outgoingCard?.classList.remove("is-leaving");
      incomingCard.classList.add("is-group-active");
      incomingCard.setAttribute("aria-hidden", "false");
    }, reducedMotionQuery.matches ? 0 : 230);
  };

  const scheduleDifferentials = (delay = 5000) => {
    clearLoopTimer();
    if (!hasEnteredViewport || isHovered) return;

    const remainingPause = Math.max(0, pauseUntil - Date.now());
    timerId = window.setTimeout(() => {
      if (mobileQuery.matches) {
        mobileIndex = (mobileIndex + 1) % cards.length;
        renderMobileDifferentials();
        scheduleDifferentials(5000);
        return;
      }

      const nextGroup = activeGroup === 0 ? 1 : 0;

      if (reducedMotionQuery.matches) {
        renderDesktopGroup(nextGroup);
        scheduleDifferentials(5000);
        return;
      }

      swapDesktopGroup(nextGroup);
    }, Math.max(delay, remainingPause));
  };

  const swapDesktopGroup = (nextGroup) => {
    clearLoopTimer();
    clearSequenceTimers();

    if (nextGroup === activeGroup) {
      scheduleDifferentials(5000);
      return;
    }

    if (reducedMotionQuery.matches) {
      renderDesktopGroup(nextGroup);
      scheduleDifferentials(5000);
      return;
    }

    desktopSlots.forEach((slot, index) => {
      queueSequence(() => replaceDesktopSlot(slot, nextGroup), index * 350);
    });

    queueSequence(() => {
      activeGroup = nextGroup;
      setGroupControls();
      scheduleDifferentials(5000);
    }, 1520);
  };

  const playInitialDifferentialsEntry = () => {
    clearLoopTimer();
    clearSequenceTimers();

    activeGroup = 0;
    setGroupControls();

    if (mobileQuery.matches) {
      renderMobileDifferentials();
      scheduleDifferentials(5000);
      return;
    }

    if (reducedMotionQuery.matches) {
      renderDesktopGroup(0);
      scheduleDifferentials(5000);
      return;
    }

    cards.forEach((card) => {
      card.classList.remove("is-group-active", "is-leaving");
      card.setAttribute("aria-hidden", "true");
    });

    desktopSlots.forEach((slot, index) => {
      queueSequence(() => {
        const card = getDesktopCard(0, slot);
        card?.classList.add("is-group-active");
        card?.setAttribute("aria-hidden", "false");
      }, index * 250);
    });

    queueSequence(() => scheduleDifferentials(5000), 1200);
  };

  const pauseDifferentials = () => {
    extendDifferentialsPause();
    scheduleDifferentials(8000);
  };

  const resetDifferentialsDrag = () => {
    track.style.removeProperty("--drag-offset");
    stage.classList.remove("is-dragging");
    activePointerId = null;
    pointerDeltaX = 0;
  };

  groupButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
      if (mobileQuery.matches) {
        mobileIndex = index * 3;
        renderMobileDifferentials();
        pauseDifferentials();
        return;
      }

      if (index === activeGroup) return;

      extendDifferentialsPause();
      swapDesktopGroup(index);
    });
  });

  stage.addEventListener("pointerenter", () => {
    if (mobileQuery.matches) return;
    isHovered = true;
    window.clearTimeout(timerId);
  });

  stage.addEventListener("pointerleave", () => {
    if (mobileQuery.matches) return;
    isHovered = false;
    scheduleDifferentials(3000);
  });

  stage.addEventListener("pointerdown", (event) => {
    if (!mobileQuery.matches || (event.pointerType === "mouse" && event.button !== 0)) return;
    activePointerId = event.pointerId;
    pointerStartX = event.clientX;
    pointerDeltaX = 0;
    stage.classList.add("is-dragging");
    stage.setPointerCapture?.(event.pointerId);
    pauseDifferentials();
  });

  stage.addEventListener("pointermove", (event) => {
    if (event.pointerId !== activePointerId) return;
    pointerDeltaX = event.clientX - pointerStartX;
    const visualDelta = Math.max(-34, Math.min(34, pointerDeltaX * 0.3));
    track.style.setProperty("--drag-offset", `${visualDelta}px`);
  });

  const finishDifferentialsDrag = (event) => {
    if (event.pointerId !== activePointerId) return;
    const direction = pointerDeltaX < 0 ? 1 : -1;
    const shouldMove = Math.abs(pointerDeltaX) > 44;
    resetDifferentialsDrag();
    if (shouldMove) {
      mobileIndex = (mobileIndex + direction + cards.length) % cards.length;
      renderDifferentials();
    }
  };

  stage.addEventListener("pointerup", finishDifferentialsDrag);
  stage.addEventListener("pointercancel", resetDifferentialsDrag);
  stage.addEventListener("dragstart", (event) => event.preventDefault());

  const handleDifferentialsModeChange = () => {
    isHovered = false;
    clearSequenceTimers();
    resetDifferentialsDrag();
    if (mobileQuery.matches) {
      renderMobileDifferentials();
    } else if (hasEnteredViewport) {
      renderDesktopGroup(activeGroup);
    } else if (!reducedMotionQuery.matches) {
      cards.forEach((card) => {
        card.classList.remove("is-group-active", "is-leaving");
        card.setAttribute("aria-hidden", "true");
      });
    } else {
      renderDesktopGroup(activeGroup);
    }
    scheduleDifferentials(1200);
  };

  mobileQuery.addEventListener?.("change", handleDifferentialsModeChange);
  reducedMotionQuery.addEventListener?.("change", handleDifferentialsModeChange);

  if (mobileQuery.matches || reducedMotionQuery.matches) {
    renderDifferentials();
  } else {
    cards.forEach((card) => {
      card.classList.remove("is-group-active", "is-leaving");
      card.setAttribute("aria-hidden", "true");
    });
    setGroupControls();
  }

  const startDifferentialsAnimation = () => {
    if (hasEnteredViewport) return;
    hasEnteredViewport = true;
    playInitialDifferentialsEntry();
  };

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          startDifferentialsAnimation();
          observer.disconnect();
        }
      },
      { threshold: 0.28 }
    );

    observer.observe(differentials);
  } else {
    startDifferentialsAnimation();
  }
}

const treatmentsCarousel = document.querySelector("[data-treatment-carousel]");

if (treatmentsCarousel) {
  const treatmentStage = treatmentsCarousel.querySelector("[data-treatment-stage]");
  const treatmentSlides = [...treatmentsCarousel.querySelectorAll("[data-treatment-slide]")];
  const treatmentPrevious = treatmentsCarousel.querySelector("[data-treatment-previous]");
  const treatmentNext = treatmentsCarousel.querySelector("[data-treatment-next]");
  const treatmentDotsContainer = treatmentsCarousel.querySelector("[data-treatment-dots]");
  const treatmentCurrent = treatmentsCarousel.querySelector("[data-treatment-current]");
  const treatmentProgress = treatmentsCarousel.querySelector("[data-treatment-progress]");
  const treatmentPanel = treatmentsCarousel.querySelector("[data-treatment-panel]");
  const treatmentCategory = treatmentsCarousel.querySelector("[data-treatment-category]");
  const treatmentNumber = treatmentsCarousel.querySelector("[data-treatment-number]");
  const treatmentTitle = treatmentsCarousel.querySelector("[data-treatment-title]");
  const treatmentDescription = treatmentsCarousel.querySelector("[data-treatment-description]");
  const treatmentHighlightOne = treatmentsCarousel.querySelector("[data-treatment-highlight-one]");
  const treatmentHighlightTwo = treatmentsCarousel.querySelector("[data-treatment-highlight-two]");
  const treatmentCta = treatmentsCarousel.querySelector("[data-treatment-cta]");
  const treatmentStatus = treatmentsCarousel.querySelector("[data-treatment-status]");
  const treatmentReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const treatments = [
    {
      category: "Crescimento e prevenção",
      title: "Ortodontia Infantil",
      description:
        "Acompanhamento preventivo e interceptivo durante o desenvolvimento da criança, permitindo identificar alterações e orientar o crescimento do sorriso no momento adequado.",
      highlights: ["Prevenção e interceptação", "Acompanhamento do desenvolvimento"],
    },
    {
      category: "Desenvolvimento facial",
      title: "Ortopedia Facial",
      description:
        "Tratamentos voltados ao acompanhamento do crescimento dos ossos da face e ao equilíbrio entre dentes, estruturas faciais e funções orais.",
      highlights: ["Crescimento facial", "Equilíbrio funcional"],
    },
    {
      category: "Aparelho fixo",
      title: "Ortodontia Corretiva",
      description:
        "Tratamento com aparelho fixo para alinhar os dentes, melhorar a mordida e promover mais equilíbrio funcional e estético ao sorriso.",
      highlights: ["Alinhamento dentário", "Correção da mordida"],
    },
    {
      category: "Ortodontia estética",
      title: "Alinhadores Invisíveis",
      description:
        "Planejamento individualizado com alinhadores Invisalign e Angel para movimentar os dentes de forma discreta, confortável e acompanhada profissionalmente.",
      highlights: ["Tratamento discreto", "Planejamento individualizado"],
    },
    {
      category: "Planejamento adulto",
      title: "Ortodontia para Adultos",
      description:
        "Tratamentos ortodônticos planejados para as necessidades da vida adulta, incluindo o preparo para próteses, implantes e cirurgias ortognáticas.",
      highlights: ["Preparo para próteses e implantes", "Preparo para cirurgia ortognática"],
    },
    {
      category: "Função e bem-estar",
      title: "Saúde Funcional",
      description:
        "Cuidados direcionados à função oral e ao bem-estar, com opções para apneia, ronco, bruxismo, disfunção temporomandibular e proteção durante atividades esportivas.",
      highlights: ["Apneia, ronco e bruxismo", "DTM e proteção esportiva"],
    },
    {
      category: "Saúde e harmonia",
      title: "Prevenção e Estética",
      description:
        "Acompanhamento preventivo da saúde dentária e gengival, diagnóstico digital da oclusão e procedimentos em resina para fechamento de diastemas, melhorias estéticas e clareamento dentário.",
      highlights: ["Prevenção e diagnóstico", "Resina e estética do sorriso"],
    },
    {
      category: "Estética do sorriso",
      title: "Clareamento Dental",
      description:
        "Tratamento indicado para clarear os dentes de forma segura e planejada, buscando um sorriso mais harmônico, natural e alinhado às necessidades de cada paciente.",
      highlights: ["Clareamento seguro", "Sorriso mais harmônico"],
    },
  ];

  let activeTreatment = 0;
  let treatmentTimer;
  let treatmentHovering = false;
  let treatmentFocusWithin = false;
  let treatmentDragging = false;
  let treatmentPointerId = null;
  let treatmentPointerStart = 0;
  let treatmentPointerDelta = 0;

  const treatmentDots = treatments.map((treatment, index) => {
    const dot = document.createElement("button");
    dot.className = "treatments-dot";
    dot.type = "button";
    dot.setAttribute("aria-label", `Exibir ${treatment.title}`);
    dot.setAttribute("aria-current", String(index === 0));
    dot.addEventListener("click", () => {
      setActiveTreatment(index, true);
      scheduleTreatments();
    });
    treatmentDotsContainer.append(dot);
    return dot;
  });

  const formatTreatmentNumber = (index) => String(index + 1).padStart(2, "0");

  const treatmentDistance = (index) => {
    let distance = index - activeTreatment;
    const midpoint = Math.floor(treatments.length / 2);
    if (distance > midpoint) distance -= treatments.length;
    if (distance < -midpoint) distance += treatments.length;
    return distance;
  };

  const renderTreatmentSlides = () => {
    treatmentSlides.forEach((slide, index) => {
      const distance = treatmentDistance(index);
      const absoluteDistance = Math.abs(distance);
      const direction = Math.sign(distance);
      const offset = absoluteDistance === 1 ? 82 : absoluteDistance === 2 ? 148 : 208;

      slide.classList.toggle("is-active", absoluteDistance === 0);
      slide.classList.toggle("is-neighbor", absoluteDistance === 1);
      slide.classList.toggle("is-outer", absoluteDistance >= 2);
      slide.style.setProperty("--card-x", `${direction * offset}%`);
      slide.style.zIndex = String(Math.max(1, 5 - absoluteDistance));
      slide.setAttribute("aria-hidden", String(absoluteDistance !== 0));
    });
  };

  const renderTreatmentPanel = (announce = false) => {
    const treatment = treatments[activeTreatment];
    const number = formatTreatmentNumber(activeTreatment);

    treatmentCurrent.textContent = number;
    treatmentProgress.style.width = `${((activeTreatment + 1) / treatments.length) * 100}%`;
    treatmentCategory.textContent = treatment.category;
    treatmentNumber.textContent = number;
    treatmentTitle.textContent = treatment.title;
    treatmentDescription.textContent = treatment.description;
    treatmentHighlightOne.textContent = treatment.highlights[0];
    treatmentHighlightTwo.textContent = treatment.highlights[1];
    treatmentCta.href = whatsappGeneralUrl;

    treatmentDots.forEach((dot, index) => {
      dot.setAttribute("aria-current", String(index === activeTreatment));
    });

    treatmentPanel.classList.remove("is-refreshing");
    window.requestAnimationFrame(() => treatmentPanel.classList.add("is-refreshing"));

    if (announce) {
      treatmentStatus.textContent = `${treatment.title}, tratamento ${activeTreatment + 1} de ${treatments.length}.`;
    }
  };

  function setActiveTreatment(requestedIndex, announce = false) {
    activeTreatment = (requestedIndex + treatments.length) % treatments.length;
    renderTreatmentSlides();
    renderTreatmentPanel(announce);
  }

  const scheduleTreatments = () => {
    window.clearTimeout(treatmentTimer);
    if (treatmentReducedMotion.matches || treatmentHovering || treatmentFocusWithin || treatmentDragging) return;
    treatmentTimer = window.setTimeout(() => {
      setActiveTreatment(activeTreatment + 1, false);
      scheduleTreatments();
    }, 6000);
  };

  const moveTreatment = (direction) => {
    setActiveTreatment(activeTreatment + direction, true);
    scheduleTreatments();
  };

  treatmentPrevious.addEventListener("click", () => moveTreatment(-1));
  treatmentNext.addEventListener("click", () => moveTreatment(1));

  treatmentStage.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveTreatment(-1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      moveTreatment(1);
    }
  });

  treatmentStage.addEventListener("pointerenter", () => {
    treatmentHovering = true;
    window.clearTimeout(treatmentTimer);
  });

  treatmentStage.addEventListener("pointerleave", () => {
    treatmentHovering = false;
    scheduleTreatments();
  });

  treatmentsCarousel.addEventListener("focusin", () => {
    treatmentFocusWithin = true;
    window.clearTimeout(treatmentTimer);
  });

  treatmentsCarousel.addEventListener("focusout", () => {
    window.setTimeout(() => {
      treatmentFocusWithin = treatmentsCarousel.contains(document.activeElement);
      scheduleTreatments();
    }, 0);
  });

  treatmentStage.addEventListener("pointerdown", (event) => {
    if ((event.pointerType === "mouse" && event.button !== 0) || event.target.closest("button")) return;
    treatmentDragging = true;
    treatmentPointerId = event.pointerId;
    treatmentPointerStart = event.clientX;
    treatmentPointerDelta = 0;
    treatmentStage.classList.add("is-dragging");
    treatmentStage.setPointerCapture?.(event.pointerId);
    window.clearTimeout(treatmentTimer);
  });

  treatmentStage.addEventListener("pointermove", (event) => {
    if (event.pointerId !== treatmentPointerId) return;
    treatmentPointerDelta = event.clientX - treatmentPointerStart;
    const visualDistance = Math.max(-34, Math.min(34, treatmentPointerDelta * 0.22));
    treatmentSlides[activeTreatment].style.setProperty("--drag-x", `${visualDistance}px`);
  });

  const resetTreatmentDrag = () => {
    treatmentSlides[activeTreatment].style.removeProperty("--drag-x");
    treatmentStage.classList.remove("is-dragging");
    treatmentDragging = false;
    treatmentPointerId = null;
    treatmentPointerDelta = 0;
  };

  const finishTreatmentDrag = (event) => {
    if (event.pointerId !== treatmentPointerId) return;
    const dragDirection = treatmentPointerDelta < 0 ? 1 : -1;
    const shouldMove = Math.abs(treatmentPointerDelta) > 48;
    resetTreatmentDrag();
    if (shouldMove) setActiveTreatment(activeTreatment + dragDirection, true);
    scheduleTreatments();
  };

  treatmentStage.addEventListener("pointerup", finishTreatmentDrag);
  treatmentStage.addEventListener("pointercancel", () => {
    resetTreatmentDrag();
    scheduleTreatments();
  });
  treatmentStage.addEventListener("dragstart", (event) => event.preventDefault());

  treatmentReducedMotion.addEventListener?.("change", scheduleTreatments);

  setActiveTreatment(0, false);
  scheduleTreatments();
}

const bioxSection = document.querySelector("[data-biox]");

if (bioxSection) {
  const bioxGallery = bioxSection.querySelector("[data-biox-gallery]");
  const bioxGalleryViewport = bioxSection.querySelector("[data-biox-gallery-viewport]");
  const bioxGallerySlides = [...bioxSection.querySelectorAll("[data-biox-gallery-slide]")];
  const bioxGalleryDotsContainer = bioxSection.querySelector("[data-biox-gallery-dots]");
  const bioxServiceTabs = [...bioxSection.querySelectorAll("[data-biox-service-tab]")];
  const bioxServicePanel = bioxSection.querySelector("[data-biox-service-panel]");
  const bioxServiceImage = bioxSection.querySelector("[data-biox-service-image]");
  const bioxServiceNumber = bioxSection.querySelector("[data-biox-service-number]");
  const bioxServiceTitle = bioxSection.querySelector("[data-biox-service-title]");
  const bioxServiceDescription = bioxSection.querySelector("[data-biox-service-description]");
  const bioxServiceList = bioxSection.querySelector("[data-biox-service-list]");
  const bioxReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const bioxWhatsappLink = whatsappGeneralUrl;

  const bioxServices = [
    {
      number: "// 01",
      title: "Escaneamento Digital",
      image: "./assets/biox/escaneamento-digital.png",
      alt: "Equipamento de escaneamento digital exibindo arcada dentária em tela",
      description:
        "Tecnologia digital para registrar a arcada dentária com mais precisão, conforto e agilidade no planejamento odontológico.",
      items: ["Escaneamento com iTero", "Registro digital da arcada", "Mais conforto no atendimento"],
    },
    {
      number: "// 02",
      title: "Documentação Ortodôntica",
      image: "./assets/biox/documentacao-ortodontica.png",
      alt: "Documentação ortodôntica com radiografia panorâmica, cefalometria e registros clínicos",
      description:
        "Conjunto de registros essenciais para o planejamento e acompanhamento de tratamentos ortodônticos.",
      items: ["Planejamento ortodôntico", "Acompanhamento da evolução", "Registros clínicos organizados"],
    },
    {
      number: "// 03",
      title: "Documentação Fotográfica",
      image: "./assets/biox/documentacao-fotografica.png",
      alt: "Registro fotográfico odontológico realizado em estúdio clínico",
      description:
        "Registros fotográficos padronizados que auxiliam na análise, planejamento e acompanhamento da evolução do tratamento.",
      items: ["Estúdio fotográfico", "Fotos intraorais e extraorais", "Apoio ao diagnóstico"],
    },
    {
      number: "// 04",
      title: "Radiografias Extraorais",
      image: "./assets/biox/radiografias-extraorais.png",
      alt: "Paciente realizando radiografia extraoral em equipamento odontológico",
      description:
        "Exames de imagem amplos que auxiliam na avaliação das estruturas dentárias, ósseas e faciais.",
      items: ["Radiografia panorâmica", "Radiografia facial", "Telerradiografia", "Radiografia da ATM"],
    },
    {
      number: "// 05",
      title: "Radiografias Intraorais",
      image: "./assets/biox/radiografias-intraorais.png",
      alt: "Radiografia intraoral segurada por luvas em ambiente clínico",
      description:
        "Imagens detalhadas de regiões específicas da boca, indicadas para diagnóstico, acompanhamento e planejamento clínico.",
      items: ["Radiografia periapical", "Radiografia interproximal", "Radiografia oclusal"],
    },
    {
      number: "// 06",
      title: "Modelos e Impressões",
      image: "./assets/biox/modelos-impressoes.png",
      alt: "Modelo odontológico em resina para estudo e planejamento",
      description:
        "Recursos utilizados para análise, planejamento e produção de modelos que apoiam diferentes etapas do tratamento.",
      items: ["Impressão de modelos em resina", "Modelos de estudo", "Modelos de trabalho", "Sala para moldagem"],
    },
  ];

  let activeBioxGallery = 0;
  let bioxGalleryTimer;
  let bioxGalleryPausedUntil = 0;
  let bioxGalleryHovering = false;
  let bioxGalleryPointerId = null;
  let bioxGalleryStartX = 0;
  let bioxGalleryDeltaX = 0;
  let bioxGalleryCanRun = false;
  let activeBioxService = 0;

  const bioxGalleryDots = bioxGallerySlides.map((_, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.setAttribute("aria-label", `Mostrar imagem ${index + 1} da BioX`);
    dot.setAttribute("aria-current", String(index === 0));
    dot.addEventListener("click", () => {
      setBioxGallery(index);
      pauseBioxGallery();
    });
    bioxGalleryDotsContainer.append(dot);
    return dot;
  });

  const loadBioxGalleryImage = (index) => {
    const image = bioxGallerySlides[index]?.querySelector("img[data-src]");
    if (!image) return;
    image.src = image.dataset.src;
    image.removeAttribute("data-src");
  };

  const setBioxGallery = (index) => {
    const nextIndex = (index + bioxGallerySlides.length) % bioxGallerySlides.length;
    loadBioxGalleryImage(nextIndex);
    bioxGallerySlides.forEach((slide, slideIndex) => {
      slide.classList.toggle("is-active", slideIndex === nextIndex);
      slide.setAttribute("aria-hidden", String(slideIndex !== nextIndex));
      slide.style.removeProperty("--biox-drag-x");
    });
    bioxGalleryDots.forEach((dot, dotIndex) => {
      dot.setAttribute("aria-current", String(dotIndex === nextIndex));
    });
    activeBioxGallery = nextIndex;
  };

  const scheduleBioxGallery = (delay = 5000) => {
    window.clearTimeout(bioxGalleryTimer);
    if (!bioxGalleryCanRun || bioxReducedMotion.matches || bioxGalleryHovering) return;
    const remainingPause = Math.max(0, bioxGalleryPausedUntil - Date.now());
    bioxGalleryTimer = window.setTimeout(() => {
      setBioxGallery(activeBioxGallery + 1);
      scheduleBioxGallery();
    }, Math.max(delay, remainingPause));
  };

  const pauseBioxGallery = () => {
    bioxGalleryPausedUntil = Date.now() + 8000;
    scheduleBioxGallery(8000);
  };

  bioxGalleryViewport.addEventListener("pointerenter", () => {
    bioxGalleryHovering = true;
    window.clearTimeout(bioxGalleryTimer);
  });

  bioxGalleryViewport.addEventListener("pointerleave", () => {
    bioxGalleryHovering = false;
    scheduleBioxGallery();
  });

  bioxGalleryViewport.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    bioxGalleryPointerId = event.pointerId;
    bioxGalleryStartX = event.clientX;
    bioxGalleryDeltaX = 0;
    bioxGalleryViewport.classList.add("is-dragging");
    bioxGalleryViewport.setPointerCapture?.(event.pointerId);
    pauseBioxGallery();
  });

  bioxGalleryViewport.addEventListener("pointermove", (event) => {
    if (event.pointerId !== bioxGalleryPointerId) return;
    bioxGalleryDeltaX = event.clientX - bioxGalleryStartX;
    const visualDelta = Math.max(-28, Math.min(28, bioxGalleryDeltaX * 0.24));
    bioxGallerySlides[activeBioxGallery].style.setProperty("--biox-drag-x", `${visualDelta}px`);
  });

  const resetBioxGalleryDrag = () => {
    bioxGallerySlides[activeBioxGallery].style.removeProperty("--biox-drag-x");
    bioxGalleryViewport.classList.remove("is-dragging");
    bioxGalleryPointerId = null;
    bioxGalleryDeltaX = 0;
  };

  const finishBioxGalleryDrag = (event) => {
    if (event.pointerId !== bioxGalleryPointerId) return;
    const shouldMove = Math.abs(bioxGalleryDeltaX) > 44;
    const direction = bioxGalleryDeltaX < 0 ? 1 : -1;
    resetBioxGalleryDrag();
    if (shouldMove) setBioxGallery(activeBioxGallery + direction);
    scheduleBioxGallery();
  };

  bioxGalleryViewport.addEventListener("pointerup", finishBioxGalleryDrag);
  bioxGalleryViewport.addEventListener("pointercancel", () => {
    resetBioxGalleryDrag();
    scheduleBioxGallery();
  });
  bioxGalleryViewport.addEventListener("dragstart", (event) => event.preventDefault());

  const setBioxService = (index, shouldFocus = false) => {
    const nextIndex = (index + bioxServices.length) % bioxServices.length;
    const service = bioxServices[nextIndex];
    activeBioxService = nextIndex;

    bioxServiceTabs.forEach((tab, tabIndex) => {
      tab.classList.toggle("is-active", tabIndex === nextIndex);
      tab.setAttribute("aria-selected", String(tabIndex === nextIndex));
      tab.tabIndex = tabIndex === nextIndex ? 0 : -1;
    });

    bioxServiceImage.src = service.image;
    bioxServiceImage.alt = service.alt;
    bioxServiceNumber.textContent = service.number;
    bioxServiceTitle.textContent = service.title;
    bioxServiceDescription.textContent = service.description;
    bioxServiceList.innerHTML = service.items.map((item) => `<li>${item}</li>`).join("");

    bioxServicePanel.classList.remove("is-refreshing");
    window.requestAnimationFrame(() => {
      bioxServicePanel.classList.add("is-refreshing");
    });

    if (shouldFocus) bioxServiceTabs[nextIndex].focus();
  };

  bioxServiceTabs.forEach((tab, index) => {
    tab.tabIndex = index === 0 ? 0 : -1;
    tab.addEventListener("click", () => setBioxService(index));
    tab.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      if (event.key === "Home") setBioxService(0, true);
      if (event.key === "End") setBioxService(bioxServices.length - 1, true);
      if (event.key === "ArrowLeft") setBioxService(activeBioxService - 1, true);
      if (event.key === "ArrowRight") setBioxService(activeBioxService + 1, true);
    });
  });

  if ("IntersectionObserver" in window) {
    const bioxObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          bioxSection.classList.add("is-visible");
          bioxGalleryCanRun = true;
          scheduleBioxGallery();
          bioxObserver.disconnect();
        }
      },
      { threshold: 0.16 }
    );
    bioxObserver.observe(bioxSection);
  } else {
    bioxSection.classList.add("is-visible");
    bioxGalleryCanRun = true;
    scheduleBioxGallery();
  }

  bioxReducedMotion.addEventListener?.("change", scheduleBioxGallery);
  setBioxGallery(0);
  setBioxService(0);
}

const journeySection = document.querySelector("[data-journey]");

if (journeySection) {
  const journeyCards = [...journeySection.querySelectorAll("[data-journey-card]")];

  const setActiveJourneyCard = (activeIndex) => {
    journeyCards.forEach((card, index) => {
      const isActive = index === activeIndex;
      card.classList.toggle("is-active", isActive);
      card.setAttribute("aria-expanded", String(isActive));
    });
  };

  journeyCards.forEach((card, index) => {
    card.setAttribute("role", "button");
    card.setAttribute("aria-expanded", String(card.classList.contains("is-active")));

    card.addEventListener("pointerenter", (event) => {
      if (event.pointerType === "touch") return;
      setActiveJourneyCard(index);
    });

    card.addEventListener("focus", () => setActiveJourneyCard(index));
    card.addEventListener("click", () => setActiveJourneyCard(index));
    card.addEventListener("keydown", (event) => {
      if (!["Enter", " "].includes(event.key)) return;
      event.preventDefault();
      setActiveJourneyCard(index);
    });
  });

  if ("IntersectionObserver" in window) {
    const journeyObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          journeySection.classList.add("is-visible");
          journeyObserver.disconnect();
        }
      },
      { threshold: 0.18 }
    );
    journeyObserver.observe(journeySection);
  } else {
    journeySection.classList.add("is-visible");
  }
}

const whyMaeveSection = document.querySelector("[data-why-maeve]");

if (whyMaeveSection) {
  if ("IntersectionObserver" in window) {
    const whyMaeveObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          whyMaeveSection.classList.add("is-visible");
          whyMaeveObserver.disconnect();
        }
      },
      { threshold: 0.18 }
    );
    whyMaeveObserver.observe(whyMaeveSection);
  } else {
    whyMaeveSection.classList.add("is-visible");
  }
}

const institutionalVideoSection = document.querySelector("[data-institutional-video]");

if (institutionalVideoSection) {
  if ("IntersectionObserver" in window) {
    const institutionalVideoObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          institutionalVideoSection.classList.add("is-visible");
          institutionalVideoObserver.disconnect();
        }
      },
      { threshold: 0.18 }
    );
    institutionalVideoObserver.observe(institutionalVideoSection);
  } else {
    institutionalVideoSection.classList.add("is-visible");
  }
}

const faqSection = document.querySelector("[data-faq]");

if (faqSection) {
  const faqItems = [...faqSection.querySelectorAll("[data-faq-item]")];

  const setFaqHeights = () => {
    faqItems.forEach((item) => {
      const answer = item.querySelector("[data-faq-answer]");
      if (!answer) return;
      answer.style.maxHeight = item.classList.contains("is-open") ? `${answer.scrollHeight}px` : "0px";
    });
  };

  const openFaqItem = (activeIndex) => {
    faqItems.forEach((item, index) => {
      const isOpen = index === activeIndex;
      const question = item.querySelector("[data-faq-question]");
      item.classList.toggle("is-open", isOpen);
      question?.setAttribute("aria-expanded", String(isOpen));
    });
    setFaqHeights();
  };

  faqItems.forEach((item, index) => {
    const question = item.querySelector("[data-faq-question]");
    question?.addEventListener("click", () => openFaqItem(index));
  });

  if ("IntersectionObserver" in window) {
    const faqObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          faqSection.classList.add("is-visible");
          faqObserver.disconnect();
        }
      },
      { threshold: 0.14 }
    );
    faqObserver.observe(faqSection);
  } else {
    faqSection.classList.add("is-visible");
  }

  window.addEventListener("resize", setFaqHeights);
  openFaqItem(0);
}

if (window.lucide) {
  window.lucide.createIcons({ attrs: { "stroke-width": 1.8 } });
}
