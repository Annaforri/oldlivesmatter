const gifts = [
  {
    id: "1",
    clue: "Ledetråd: Noe lite på kartet, men stort i kalenderen. Fem til syv ruter skal fylles, og tallet med fire nuller bestemmer hvor vi lander.",
    answers: ["ferietur", "ferie", "reise", "tur"],
    title: "Gave 1 er låst opp",
    reveal: "Gave 1 er en ferietur til et billig sted i 5 dager eller 1 uke, avhengig av pris. Budsjett: ca. 10 000 kr. Mulige steder: Albania, Bulgaria, Polen, Tyrkia, Latvia eller Nord-Makedonia.",
  },
  {
    id: "2",
    clue: "Ledetråd: kort, rask, adrenalin",
    answers: ["fallskjermhopp", "fallskjerm hopp", "fallskjerm"],
    title: "Gave 2 er låst opp",
    reveal: "Gave 2 er fallskjermhopp.",
  },
  {
    id: "3",
    clue: "Ledetråd: Gaven varer så lenge teknologien rekker. Den gjør varme dager snillere, rommet roligere og sommeren litt lettere å elske.",
    answers: ["airkondition", "aircondition", "air condition", "airkondisjon"],
    title: "Gave 3 er låst opp",
    reveal: "Gave 3 er airkondition.",
  },
];

const maxAttempts = 5;
const unlockedDurationMs = 60 * 60 * 1000;
const storageKey = "bursdagsgaver-state-v4";
const unlockRequirements = {
  1: "2",
  2: "3",
  3: null,
};

const defaultGiftState = Object.fromEntries(
  gifts.map((gift) => [gift.id, { attempts: 0, unlocked: false, unlockedAt: null }]),
);

let giftState = JSON.parse(JSON.stringify(defaultGiftState));

const normalizeAnswer = (value) =>
  value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");

const isUnlockExpired = (state) =>
  state.unlocked && state.unlockedAt && Date.now() - state.unlockedAt >= unlockedDurationMs;

const resetGiftState = (state) => {
  state.attempts = 0;
  state.unlocked = false;
  state.unlockedAt = null;
};

const closeExpiredGifts = () => {
  let changed = false;

  Object.values(giftState).forEach((state) => {
    if (isUnlockExpired(state)) {
      resetGiftState(state);
      changed = true;
    }
  });

  if (changed) {
    saveGiftState();
  }
};

const loadGiftState = () => {
  try {
    const savedState = JSON.parse(localStorage.getItem(storageKey));

    if (!savedState || typeof savedState !== "object") {
      return JSON.parse(JSON.stringify(defaultGiftState));
    }

    return Object.fromEntries(
      gifts.map((gift) => {
        const savedGift = savedState[gift.id] || {};

        return [
          gift.id,
          {
            attempts: Number.isInteger(savedGift.attempts)
              ? Math.min(Math.max(savedGift.attempts, 0), maxAttempts)
              : 0,
            unlocked: Boolean(savedGift.unlocked),
            unlockedAt: Number.isInteger(savedGift.unlockedAt) ? savedGift.unlockedAt : null,
          },
        ];
      }),
    );
  } catch {
    return JSON.parse(JSON.stringify(defaultGiftState));
  }
};

const saveGiftState = () => {
  try {
    localStorage.setItem(storageKey, JSON.stringify(giftState));
  } catch {
    // The game still works if local storage is unavailable.
  }
};

let activeGift = gifts[0];

const getDisplayAnswer = (gift) => gift.answers[0];

const getWordCount = (answer) => answer.trim().split(/\s+/).filter(Boolean).length;

const renderAnswerPattern = (element, answer) => {
  element.innerHTML = answer
    .trim()
    .split(/\s+/)
    .map((word) => {
      const letters = Array.from(word)
        .map(() => '<span class="pattern-letter">_</span>')
        .join("");

      return `<span class="pattern-word">${letters}</span>`;
    })
    .join("");
};

const renderReveal = (element, gift) => {
  element.innerHTML = `
    <h2>${gift.title}</h2>
    <p>${gift.reveal}</p>
  `;
};

const homeScreens = document.querySelectorAll("[data-home-screen]");
const detailScreen = document.querySelector("[data-detail-screen]");
const detailCard = document.querySelector("[data-detail-card]");
const detailTitle = document.querySelector("[data-detail-title]");
const detailStatus = document.querySelector("[data-detail-status]");
const detailClue = document.querySelector("[data-detail-clue]");
const wordCount = document.querySelector("[data-word-count]");
const attemptsLeft = document.querySelector("[data-attempts-left]");
const answerPattern = document.querySelector("[data-answer-pattern]");
const form = document.querySelector("[data-detail-form]");
const input = form.querySelector("input");
const submitButton = form.querySelector("button");
const feedback = document.querySelector("[data-detail-feedback]");
const extraHint = document.querySelector("[data-extra-hint]");
const hintButton = document.querySelector("[data-hint-button]");
const hintText = document.querySelector("[data-hint-text]");
const reveal = document.querySelector("[data-detail-reveal]");
const backButton = document.querySelector("[data-back-button]");

const setHomeVisible = (isVisible) => {
  homeScreens.forEach((screen) => {
    screen.hidden = !isVisible;
  });
  detailScreen.hidden = isVisible;
};

const updateGiftStatusBadges = () => {
  closeExpiredGifts();

  gifts.forEach((gift) => {
    const badge = document.querySelector(`[data-card-status="${gift.id}"]`);
    const card = document.querySelector(`[data-gift-card="${gift.id}"]`);
    const requiredGiftId = unlockRequirements[gift.id];
    const isAvailable = !requiredGiftId || giftState[requiredGiftId].unlocked;

    card.classList.toggle("locked", !giftState[gift.id].unlocked && !isAvailable);
    card.classList.toggle("unlocked", giftState[gift.id].unlocked);

    if (giftState[gift.id].unlocked) {
      badge.textContent = "Åpnet";
    } else if (!isAvailable) {
      badge.textContent = "Låst";
    } else {
      badge.textContent = "Skjult";
    }
  });
};

const getLockedMessage = (gift) => {
  const requiredGiftId = unlockRequirements[gift.id];

  return `Du må åpne gave ${requiredGiftId} før du kan prøve gave ${gift.id}.`;
};

const renderDetail = (gift) => {
  closeExpiredGifts();

  const state = giftState[gift.id];
  const displayAnswer = getDisplayAnswer(gift);
  const remainingAttempts = Math.max(maxAttempts - state.attempts, 0);
  const shouldShowExtraHint = state.attempts === maxAttempts - 1 && !state.unlocked;

  activeGift = gift;
  detailCard.classList.toggle("unlocked", state.unlocked);
  detailTitle.textContent = `Gave ${gift.id}`;
  detailStatus.textContent = state.unlocked ? "Åpnet" : "Skjult";
  detailClue.textContent = gift.clue;
  wordCount.textContent = `Antall ord: ${getWordCount(displayAnswer)}`;
  attemptsLeft.textContent = `${remainingAttempts} av ${maxAttempts} forsøk igjen`;
  renderAnswerPattern(answerPattern, displayAnswer);
  feedback.textContent = "";
  feedback.classList.remove("success");
  input.value = "";
  input.disabled = state.unlocked || remainingAttempts === 0;
  submitButton.disabled = state.unlocked || remainingAttempts === 0;
  extraHint.hidden = !shouldShowExtraHint;
  hintText.hidden = true;
  reveal.hidden = !state.unlocked;

  if (state.unlocked) {
    renderReveal(reveal, gift);
    feedback.textContent = "Denne gaven er allerede åpnet.";
    feedback.classList.add("success");
  } else if (remainingAttempts === 0) {
    feedback.textContent = "Ingen forsøk igjen. Denne gaven forblir skjult.";
  }
};

document.querySelectorAll("[data-open-gift]").forEach((button) => {
  button.addEventListener("click", () => {
    closeExpiredGifts();

    const gift = gifts.find((item) => item.id === button.dataset.openGift);
    const requiredGiftId = unlockRequirements[gift.id];

    if (requiredGiftId && !giftState[requiredGiftId].unlocked) {
      button.closest(".gift-card").animate(
        [
          { transform: "translateX(0)" },
          { transform: "translateX(-7px)" },
          { transform: "translateX(7px)" },
          { transform: "translateX(0)" },
        ],
        { duration: 220, easing: "ease-out" },
      );
      alert(getLockedMessage(gift));
      return;
    }

    setHomeVisible(false);
    renderDetail(gift);
    input.focus();
  });
});

giftState = loadGiftState();
updateGiftStatusBadges();

backButton.addEventListener("click", () => {
  updateGiftStatusBadges();
  setHomeVisible(true);
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const state = giftState[activeGift.id];
  const guess = normalizeAnswer(input.value);
  const acceptedAnswers = activeGift.answers.map(normalizeAnswer);

  if (state.unlocked || state.attempts >= maxAttempts) {
    return;
  }

  if (!guess) {
    feedback.textContent = "Du må skrive inn et løsningsforslag først.";
    feedback.classList.remove("success");
    return;
  }

  if (!acceptedAnswers.includes(guess)) {
    state.attempts += 1;
    const remainingAttempts = Math.max(maxAttempts - state.attempts, 0);
    attemptsLeft.textContent = `${remainingAttempts} av ${maxAttempts} forsøk igjen`;
    feedback.textContent =
      remainingAttempts === 0
        ? "Ingen forsøk igjen. Denne gaven forblir skjult."
        : `Ikke helt. Du har ${remainingAttempts} forsøk igjen.`;
    feedback.classList.remove("success");
    extraHint.hidden = state.attempts !== maxAttempts - 1;
    hintText.hidden = true;
    input.value = "";
    saveGiftState();

    detailCard.animate(
      [
        { transform: "translateX(0)" },
        { transform: "translateX(-7px)" },
        { transform: "translateX(7px)" },
        { transform: "translateX(0)" },
      ],
      { duration: 220, easing: "ease-out" },
    );

    if (remainingAttempts === 0) {
      input.disabled = true;
      submitButton.disabled = true;
    }

    return;
  }

  state.unlocked = true;
  state.unlockedAt = Date.now();
  saveGiftState();
  detailCard.classList.add("unlocked");
  detailStatus.textContent = "Åpnet";
  feedback.textContent = "Riktig. Gaven er åpnet.";
  feedback.classList.add("success");
  renderReveal(reveal, activeGift);
  reveal.hidden = false;
  extraHint.hidden = true;
  hintText.hidden = true;
  input.disabled = true;
  submitButton.disabled = true;
  updateGiftStatusBadges();
});

hintButton.addEventListener("click", () => {
  hintText.hidden = false;
});
