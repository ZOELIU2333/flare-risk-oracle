(() => {
  const DURATION = 108;
  const film = document.getElementById("film");
  const root = document.documentElement;
  const scenes = [...document.querySelectorAll("[data-scene]")].map((element) => {
    const [start, end] = element.dataset.scene.split(",").map(Number);
    return { element, start, end };
  });

  const headline = "US SEC announces formal investigation into Ripple; exchanges consider suspending XRP trading.";
  const captions = [
    [1.10, 3.964, "The XRP price hasn't moved."],
    [3.914, 6.134, "But the risk already has."],
    [6.134, 10.904, "Most DeFi collateral controls wait for price data to reveal a crisis."],
    [10.904, 14.654, "By then, lending markets may already be exposed."],
    [14.654, 18.744, "This is RiskOracle, built for interoperable assets on Flare."],
    [18.744, 22.833, "Watch the same XRP price as a regulatory shock arrives."],
    [22.833, 25.649, "A price-only oracle still reads low."],
    [25.649, 29.557, "RiskOracle sends the headline to four independent models."],
    [29.557, 38.064, "GPT-5.5 scores 92, Claude Opus 85, DeepSeek 95, and Qwen3 85."],
    [38.064, 42.215, "Consensus: 89, before the market reprices."],
    [42.215, 45.200, "The models never see one another's answers."],
    [45.200, 52.664, "RiskOracle exposes their spread and applies divergence-aware consensus, making uncertainty visible instead of hiding it."],
    [52.664, 56.899, "The pipeline begins with Flare FTSOv2 market state."],
    [56.899, 62.033, "AI adds event, liquidity, volatility, and contagion context."],
    [62.033, 70.734, "Because model output is non-deterministic, RiskOracle freezes the result into deterministic JSON for FDC Web2Json attestation."],
    [70.734, 79.314, "Here is the proof: deployed Coston2 contracts, immutable RiskUpdated events, and a successful end-to-end FDC transaction."],
    [79.314, 85.673, "Continuous demo updates use a lightweight signer; the full FDC path is already proven on-chain."],
    [85.673, 93.562, "At risk 95, the FXRP lending example suspends new borrowing, and the insurance pool stops new underwriting."],
    [93.562, 97.251, "One signal; policy remains with each protocol."],
    [97.251, 100.516, "Built from scratch during Flare Summer Signal."],
    [100.516, 106.571, "RiskOracle: verifiable risk intelligence for interoperable assets, before price reacts."]
  ];

  const modelSchedule = [
    { start: 28.7, ready: 30.5 },
    { start: 30.2, ready: 32.3 },
    { start: 32.0, ready: 34.2 },
    { start: 33.9, ready: 36.0 }
  ];

  let startAt = 0;
  let playing = false;
  let frameId = 0;

  const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
  const ease = (value) => {
    const x = clamp(value);
    return 1 - Math.pow(1 - x, 3);
  };
  const smooth = (value) => {
    const x = clamp(value);
    return x * x * (3 - 2 * x);
  };
  const progress = (t, start, end) => clamp((t - start) / (end - start));
  const pulse = (t, center, width = 0.45) => 1 - clamp(Math.abs(t - center) / width);
  const set = (name, value) => root.style.setProperty(name, value);
  const setElement = (el, name, value) => el.style.setProperty(name, value);
  const number = (from, to, p, decimals = 0) => (from + (to - from) * ease(p)).toFixed(decimals);

  function sceneOpacity(t, start, end) {
    return t >= start && t <= end ? 1 : 0;
  }

  function updateScenes(t) {
    scenes.forEach(({ element, start, end }) => {
      const opacity = sceneOpacity(t, start, end);
      const entrance = ease(progress(t, start, start + 1.3));
      const exit = ease(progress(t, end - 1.2, end));
      const camera = progress(t, start, end);
      const drift = Math.sin((t - start) * 0.42) * 0.65;
      setElement(element, "--scene-opacity", opacity.toFixed(4));
      setElement(element, "--scene-y", `${((1 - entrance) * 34 - exit * 20 - camera * 3 + drift).toFixed(3)}px`);
      setElement(element, "--scene-scale", (0.986 + entrance * 0.014 + camera * 0.008 + exit * 0.01).toFixed(5));
      setElement(element, "--scene-blur", `${((1 - entrance) * 5 + exit * 4).toFixed(2)}px`);
      element.style.visibility = opacity > 0.001 ? "visible" : "hidden";
    });
    set("--topbar-show", smooth(progress(t, 12.8, 14.4)) * (1 - smooth(progress(t, 96.2, 98.0))));
  }

  function updateHook(t) {
    set("--terminal-show", ease(progress(t, 0.4, 1.6)));
    set("--line-progress", ease(progress(t, 0.8, 4.5)));
    set("--market-point", smooth(progress(t, 3.6, 4.4)));
    set("--hook-switch", ease(progress(t, 3.3, 4.4)));
    set("--event-show", ease(progress(t, 4.2, 5.1)));
    set("--exposure-show", ease(progress(t, 8.2, 9.7)));
  }

  function updateDemo(t) {
    const typed = Math.floor(headline.length * ease(progress(t, 16.6, 21.9)));
    document.getElementById("typed-headline").textContent = headline.slice(0, typed);
    set("--caret", typed < headline.length ? (Math.floor(t * 3) % 2 ? 1 : 0.15) : 0);

    const cursorEnter = ease(progress(t, 20.4, 21.1));
    let cursorX = 1700;
    let cursorY = 890;
    if (t >= 20.4 && t < 22.7) {
      const p = ease(progress(t, 20.4, 22.7));
      cursorX = 1700 + (450 - 1700) * p;
      cursorY = 870 + (725 - 870) * p;
    } else if (t >= 22.7) {
      cursorX = 450;
      cursorY = 725;
    }
    set("--cursor-x", `${cursorX}px`);
    set("--cursor-y", `${cursorY}px`);
    set("--cursor-show", cursorEnter * (1 - smooth(progress(t, 24.2, 25.0))));
    set("--cursor-click", pulse(t, 23.25, 0.38));
    set("--progress-show", smooth(progress(t, 23.2, 23.8)) * (1 - smooth(progress(t, 36.0, 37.0))));
    set("--analysis-progress", ease(progress(t, 23.35, 36.0)));

    document.querySelectorAll(".model-card").forEach((card, index) => {
      const schedule = modelSchedule[index];
      const show = ease(progress(t, schedule.start, schedule.start + 0.75));
      const ready = ease(progress(t, schedule.ready - 0.7, schedule.ready));
      const target = Number(card.querySelector("[data-score]").dataset.score);
      card.querySelector("[data-score]").textContent = String(Math.round(target * ready)).padStart(2, "0");
      setElement(card, "--model-show", show);
      setElement(card, "--model-ready", ready);
    });
  }

  function updateConsensus(t) {
    const scoreProgress = ease(progress(t, 36.2, 39.5));
    set("--consensus-progress", scoreProgress * 0.89);
    document.getElementById("consensus-score").textContent = String(Math.round(89 * scoreProgress)).padStart(2, "0");
    set("--spread-show", ease(progress(t, 42.0, 44.8)));
    set("--agreement-show", ease(progress(t, 44.2, 46.6)));
    set("--ribbon-show", ease(progress(t, 40.6, 42.0)));
  }

  function updatePipeline(t) {
    const nodeTimes = [52.3, 55.6, 60.5, 65.0, 68.2];
    document.querySelectorAll(".pipe-node").forEach((node, index) => {
      const show = ease(progress(t, nodeTimes[index], nodeTimes[index] + 0.85));
      const active = smooth(progress(t, nodeTimes[index] + 0.25, nodeTimes[index] + 1.1));
      setElement(node, "--node-show", show);
      setElement(node, "--node-active", active);
    });
    document.querySelectorAll(".connector").forEach((connector, index) => {
      const start = nodeTimes[index] + 1.1;
      setElement(connector, "--connector-show", ease(progress(t, start, start + 1.0)));
      const cycle = ((t - start) / 1.8) % 1;
      setElement(connector, "--packet-x", `${clamp(cycle) * 100}%`);
      setElement(connector, "--packet-show", t > start && t < 71.5 ? 1 : 0);
      [...connector.querySelectorAll("i")].forEach((packet, pIndex) => {
        const offsetCycle = ((cycle + pIndex * 0.28) % 1) * 100;
        packet.style.left = `${offsetCycle}%`;
      });
    });
    set("--json-show", ease(progress(t, 59.6, 61.1)));
  }

  function updateProof(t) {
    set("--success-show", ease(progress(t, 70.8, 72.0)));
    set("--hash-reveal", ease(progress(t, 71.4, 74.4)));
    set("--event-row-show", ease(progress(t, 74.0, 76.7)));
    document.getElementById("block-count").textContent = String(Math.round(Number(number(33099000, 33099670, progress(t, 70.8, 73.8)))));
  }

  function updateProtocols(t) {
    let risk = 25;
    if (t >= 85.0) risk = Number(number(25, 70, progress(t, 85.0, 87.2)));
    if (t >= 87.2) risk = Number(number(70, 95, progress(t, 87.2, 90.0)));
    const roundedRisk = Math.round(risk);
    const critical = smooth(progress(t, 88.7, 90.2));
    const guarded = smooth(progress(t, 85.0, 87.2));
    set("--risk-progress", risk / 100);
    set("--risk-color", critical > 0.4 ? "#ff5d5d" : guarded > 0.4 ? "#f2bd54" : "#43e6a2");
    set("--policy-color", critical > 0.4 ? "#ff5d5d" : guarded > 0.4 ? "#f2bd54" : "#43e6a2");
    set("--branch-show", ease(progress(t, 84.0, 85.2)));
    set("--branch-packet", `${((Math.max(t - 84.8, 0) / 1.4) % 1) * 100}%`);
    set("--protocol-show", ease(progress(t, 84.9, 86.0)));
    set("--alerts-show", ease(progress(t, 90.0, 91.1)));
    document.getElementById("protocol-risk").textContent = roundedRisk;
    document.getElementById("oracle-core-score").textContent = roundedRisk;
    document.getElementById("lending-ratio").textContent = `${Math.round(150 + critical * 100)}%`;
    document.getElementById("insurance-premium").textContent = `${(3.25 + critical * 4.05).toFixed(2)}%`;
    document.getElementById("lending-state").textContent = critical > 0.85 ? "SUSPENDED" : guarded > 0.5 ? "GUARDED" : "STANDARD";
    document.getElementById("insurance-state").textContent = critical > 0.85 ? "STOPPED" : guarded > 0.5 ? "REPRICING" : "OPEN";
  }

  function updateOutro(t) {
    set("--outro-main", ease(progress(t, 96.1, 97.6)));
    set("--outro-proof", ease(progress(t, 97.2, 98.8)));
    set("--outro-links", ease(progress(t, 99.0, 100.2)));
    set("--built-new", ease(progress(t, 97.0, 98.0)));
  }

  function updateCaption(t) {
    const cue = captions.find(([start, end]) => t >= start && t <= end);
    const caption = document.getElementById("caption");
    if (!cue) {
      caption.textContent = "";
      set("--caption-show", 0);
      return;
    }
    caption.textContent = cue[2];
    const fade = Math.min(ease(progress(t, cue[0], cue[0] + 0.18)), 1 - smooth(progress(t, cue[1] - 0.14, cue[1])));
    set("--caption-show", fade);
  }

  function render(t) {
    const time = clamp(t, 0, DURATION);
    set("--film-progress", time / DURATION);
    updateScenes(time);
    updateHook(time);
    updateDemo(time);
    updateConsensus(time);
    updatePipeline(time);
    updateProof(time);
    updateProtocols(time);
    updateOutro(time);
    updateCaption(time);
    document.getElementById("timecode").textContent = `${String(Math.floor(time / 60)).padStart(2, "0")}:${String(Math.floor(time % 60)).padStart(2, "0")}`;
    film.dataset.time = time.toFixed(3);
  }

  function tick(now) {
    if (!playing) return;
    const t = (now - startAt) / 1000;
    render(t);
    if (t < DURATION + 0.25) frameId = requestAnimationFrame(tick);
    else {
      playing = false;
      window.__movieFinished = true;
    }
  }

  window.startMovie = () => {
    cancelAnimationFrame(frameId);
    window.__movieFinished = false;
    playing = true;
    startAt = performance.now();
    render(0);
    frameId = requestAnimationFrame(tick);
    return { duration: DURATION, startedAt: startAt };
  };

  window.seekMovie = (seconds) => {
    playing = false;
    cancelAnimationFrame(frameId);
    render(seconds);
  };

  render(0);
  window.__movieReady = true;
})();
