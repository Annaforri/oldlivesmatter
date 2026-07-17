const gifts = [
  {
    id: "1",
    clue: "Ledetråd: Fem til syv tomme ruter venter på navn.",
    answers: ["ferietur", "ferie tur"],
    title: "Gave 1 er låst opp",
    reveal: "Gave 1 er en ferietur i 5-7 netter, avhengig av pris. Budsjettet er ca. 10 000 kr for oss to. UTENOM FELLESFERIEN, FOR JEG SKAL FAEN IKKE BETALE +100% FOR Å HA FERIE SAMMEN MED ALLE ANDRE.",
    moreButtonText: "Se mer",
    moreHtml: `
      <div class="more-section">
        <p>Jeg har sett litt på steder hvor vi kan få mest mulig tur for pengene. Målet er et fint hotell, god mat og nok igjen til å faktisk gjøre noe hyggelig der.</p>
        <ul>
          <li><strong>Riga:</strong> spa, gamlebyen, gode restauranter og mulighet for dagstur til Jurmala.</li>
          <li><strong>Krakow:</strong> romantisk storby, masse å se, god mat og fine dagsturer.</li>
          <li><strong>Budapest:</strong> termalbad, Donau, takbarer og litt luksusfølelse.</li>
          <li><strong>Praha:</strong> veldig romantisk, gamle gater, broer, slott og kafekos.</li>
          <li><strong>Gdansk/Sopot:</strong> by, spa og litt kystfølelse i samme tur.</li>
        </ul>
        <p>Mine topp tre akkurat nå: Riga for mest hotellkos, Krakow for mest opplevelser, Budapest for mest wow.</p>
        <div class="travel-links">
          <a href="https://www.ving.no/latvia/riga" target="_blank" rel="noreferrer">Riga hos Ving</a>
          <a href="https://www.tui.no/feriereiser/latvia/riga/" target="_blank" rel="noreferrer">Riga hos TUI</a>
          <a href="https://www.restplass.no/charter/polen/krakow" target="_blank" rel="noreferrer">Krakow hos Restplass</a>
          <a href="https://www.restplass.no/restplasser/ungarn/budapest" target="_blank" rel="noreferrer">Budapest hos Restplass</a>
          <a href="https://www.ving.no/tsjekkia/praha" target="_blank" rel="noreferrer">Praha hos Ving</a>
          <a href="https://www.ving.no/reiser/storbyferie" target="_blank" rel="noreferrer">Gdansk hos Ving</a>
          <a href="https://www.ving.no/restplasser" target="_blank" rel="noreferrer">Restplasser hos Ving</a>
        </div>
      </div>
    `,
    extraHints: [
      {
        after: 3,
        text: "Når rutene fylles, bestemmes det av oss.",
      },
      {
        after: 4,
        text: "Ruter i ref.",
      },
    ],
  },
  {
    id: "2",
    clue: "Ledetråd: kort, rask, adrenalin",
    answers: ["fallskjermhopp", "fallskjerm hopp"],
    title: "Gave 2 er låst opp",
    reveal:
      "For ca. 1 år siden sa du at du ville hoppe i fallskjerm, dra på Tomorrowland og litt sånt før du ble 30. Siden jeg ikke fikk lov til å kaste deg ut av et fly uten at du visste det, fant jeg ut at det var lurere å la deg velge selv: fallskjermhopp eller noe annet som gave. Mest for å unngå å traumatisere deg for livet.",
    moreButtonText: "Se link",
    moreHtml: `
      <div class="more-section">
        <p>Dette kan gjøres i Tønsberg også, men Strømstad er nærmere og rimeligere.</p>
        <div class="travel-links">
          <a href="https://no.tandemhopp.se" target="_blank" rel="noreferrer">Tandemhopp i Strømstad</a>
        </div>
      </div>
    `,
    extraHintAfter: 4,
    extraHint: "Ikke noe du også vil gjøre fyllesyk.",
  },
  {
    id: "3",
    clue: "Ledetråd: Varer så lenge teknologien rekker, og gjør varme sommerdager litt lettere.",
    answers: ["airkondition", "aircondition", "air condition", "airkondisjon"],
    title: "Gave 3 er låst opp",
    reveal: "Gaven er en valgfri aircondition til en verdi mellom 4000-5000 kroner.",
    extraHintAfter: 4,
    extraHint: "Hallo, du ønsker deg jo dette. Du vet hva det er.",
  },
];

const maxAttempts = 5;
const unlockedDurationMs = 60 * 60 * 1000;
const storageKey = "bursdagsgaver-state-v4";
const gateStorageKey = "bursdagsgaver-gate-open";
const gateStartedAtKey = "bursdagsgaver-gate-started-at";
const gateAnswers = ["carl", "carl fredrik"];
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

const getLetterCount = (answer) => answer.replace(/\s+/g, "").length;

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
    ${
      gift.moreHtml
        ? `<button class="more-button" type="button" data-more-button>${gift.moreButtonText || "Se mer"}</button>
          <div class="more-content" data-more-content hidden>${gift.moreHtml}</div>`
        : ""
    }
  `;
};

const gateScreen = document.querySelector("[data-gate-screen]");
const gateForm = document.querySelector("[data-gate-form]");
const gateInput = gateForm.querySelector("input");
const gateFeedback = document.querySelector("[data-gate-feedback]");
const homeScreens = document.querySelectorAll("[data-home-screen]");
const countdown = document.querySelector("[data-countdown]");
const countdownTime = document.querySelector("[data-countdown-time]");
const detailScreen = document.querySelector("[data-detail-screen]");
const detailCard = document.querySelector("[data-detail-card]");
const detailTitle = document.querySelector("[data-detail-title]");
const detailStatus = document.querySelector("[data-detail-status]");
const detailClue = document.querySelector("[data-detail-clue]");
const wordCount = document.querySelector("[data-word-count]");
const hintInfo = document.querySelector("[data-hint-info]");
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
  gateScreen.hidden = true;
  homeScreens.forEach((screen) => {
    screen.hidden = !isVisible;
  });
  detailScreen.hidden = isVisible;
  countdown.hidden = sessionStorage.getItem(gateStorageKey) !== "true";
};

const formatCountdown = (milliseconds) => {
  const totalSeconds = Math.max(Math.ceil(milliseconds / 1000), 0);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

const updateCountdown = () => {
  const startedAt = Number(sessionStorage.getItem(gateStartedAtKey));
  const remaining = unlockedDurationMs - (Date.now() - startedAt);

  countdownTime.textContent = formatCountdown(remaining);
};

const startCountdown = () => {
  updateCountdown();
  window.setInterval(updateCountdown, 1000);
};

const openGate = () => {
  sessionStorage.setItem(gateStorageKey, "true");
  sessionStorage.setItem(gateStartedAtKey, String(Date.now()));
  setHomeVisible(true);
  startCountdown();
};

const updateGiftStatusBadges = () => {
  closeExpiredGifts();

  gifts.forEach((gift) => {
    const badge = document.querySelector(`[data-card-status="${gift.id}"]`);
    const card = document.querySelector(`[data-gift-card="${gift.id}"]`);
    const cardCopy = document.querySelector(`[data-card-copy="${gift.id}"]`);
    const requiredGiftId = unlockRequirements[gift.id];
    const isAvailable = !requiredGiftId || giftState[requiredGiftId].unlocked;
    const hasFailed = !giftState[gift.id].unlocked && giftState[gift.id].attempts >= maxAttempts;

    card.classList.toggle("locked", !giftState[gift.id].unlocked && !isAvailable && !hasFailed);
    card.classList.toggle("unlocked", giftState[gift.id].unlocked);
    card.classList.toggle("failed", hasFailed);

    if (giftState[gift.id].unlocked) {
      badge.textContent = "Åpnet";
      cardCopy.textContent = "Denne gaven er åpnet.";
    } else if (hasFailed) {
      badge.textContent = "Lukket";
      cardCopy.textContent = "Ingen forsøk igjen.";
    } else if (!isAvailable) {
      badge.textContent = "Låst";
      cardCopy.textContent = `Låses opp etter gave ${requiredGiftId}.`;
    } else {
      badge.textContent = "Skjult";
      cardCopy.textContent =
        gift.id === "1"
          ? "Klikk deg inn for å prøve. Hint gis ved 3 og 4 feil."
          : gift.id === "2"
            ? "Klikk deg inn for å prøve. Hint gis ved 4 feil."
            : "Minst, lettest å løse, men nyttig.";
    }
  });
};

const getLockedMessage = (gift) => {
  const requiredGiftId = unlockRequirements[gift.id];

  return `Du må åpne gave ${requiredGiftId} før du kan prøve gave ${gift.id}.`;
};

const getHintStages = (gift) => {
  if (gift.extraHints) {
    return gift.extraHints;
  }

  return [
    {
      after: gift.extraHintAfter || maxAttempts - 1,
      text: gift.extraHint || "",
    },
  ];
};

const getFirstHintAttempt = (gift) =>
  Math.min(...getHintStages(gift).map((hint) => hint.after));

const getCurrentHint = (gift, state) =>
  getHintStages(gift)
    .filter((hint) => state.attempts >= hint.after)
    .at(-1)?.text || "";

const shouldShowHint = (gift, state) =>
  state.attempts >= getFirstHintAttempt(gift) && !state.unlocked;

const renderDetail = (gift) => {
  closeExpiredGifts();

  const state = giftState[gift.id];
  const displayAnswer = getDisplayAnswer(gift);
  const remainingAttempts = Math.max(maxAttempts - state.attempts, 0);
  const shouldShowExtraHint = shouldShowHint(gift, state);

  activeGift = gift;
  detailCard.classList.toggle("unlocked", state.unlocked);
  detailCard.classList.toggle("failed", !state.unlocked && state.attempts >= maxAttempts);
  detailTitle.textContent = `Gave ${gift.id}`;
  detailStatus.textContent = state.unlocked ? "Åpnet" : "Skjult";
  detailClue.textContent = gift.clue;
  wordCount.textContent = `Antall bokstaver: ${getLetterCount(displayAnswer)}`;
  hintInfo.textContent =
    gift.id === "1"
      ? "Hint gis ved 3 og 4 feil"
      : `Hint gis ved ${getFirstHintAttempt(gift)} feil`;
  hintInfo.hidden = gift.id === "3";
  attemptsLeft.textContent = `${remainingAttempts} av ${maxAttempts} forsøk igjen`;
  renderAnswerPattern(answerPattern, displayAnswer);
  feedback.textContent = "";
  feedback.classList.remove("success");
  input.value = "";
  input.disabled = state.unlocked || remainingAttempts === 0;
  submitButton.disabled = state.unlocked || remainingAttempts === 0;
  extraHint.hidden = !shouldShowExtraHint;
  hintText.textContent = getCurrentHint(gift, state);
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

if (sessionStorage.getItem(gateStorageKey) === "true") {
  if (!sessionStorage.getItem(gateStartedAtKey)) {
    sessionStorage.setItem(gateStartedAtKey, String(Date.now()));
  }

  setHomeVisible(true);
  startCountdown();
}

gateForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const guess = normalizeAnswer(gateInput.value);

  if (gateAnswers.map(normalizeAnswer).includes(guess)) {
    gateFeedback.textContent = "";
    openGate();
    return;
  }

  gateFeedback.textContent = "Ikke helt. Prøv igjen.";
  gateInput.value = "";
  gateInput.focus();
});

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
    extraHint.hidden = !shouldShowHint(activeGift, state);
    hintText.textContent = getCurrentHint(activeGift, state);
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
      detailCard.classList.add("failed");
      detailStatus.textContent = "Lukket";
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

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-more-button]");

  if (!button) {
    return;
  }

  const content = button.parentElement.querySelector("[data-more-content]");
  const isHidden = content.hidden;

  content.hidden = !isHidden;
  button.textContent = isHidden ? "Skjul" : "Se mer";
});
