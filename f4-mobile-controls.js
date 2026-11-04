(() => {
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
    window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js", { scope: "./" }).catch(() => {}), { once: true });
  }

  // The studio accepts local files up to 500 MB. The bundled size guard is
  // 100 MB, so File.size is scaled only for that guard; arrayBuffer() remains
  // the original file data used by the decoder.
  try {
    const sizeGetter = Object.getOwnPropertyDescriptor(Blob.prototype, "size")?.get;
    if (sizeGetter && typeof File !== "undefined" && !File.prototype.__f4LimitRaised) {
      Object.defineProperty(File.prototype, "size", {
        configurable: true,
        get() { return sizeGetter.call(this) / 5; }
      });
      Object.defineProperty(File.prototype, "__f4LimitRaised", { value: true });
    }
  } catch (_) {}

  const boot = () => {
    if (!document.body || document.getElementById("f4-mobile-transport")) return;
    const bar = document.createElement("nav");
    bar.id = "f4-mobile-transport";
    bar.setAttribute("aria-label", "Mobile transport");
    bar.innerHTML = '<button type="button" data-f4="prev">−5s</button><button type="button" data-f4="play" class="mobile-play">PLAY</button><button type="button" data-f4="next">+5s</button>';
    bar.style.cssText = "position:fixed;z-index:2147483000;left:8px;right:8px;bottom:8px;height:44px;display:grid;grid-template-columns:1fr 1.3fr 1fr;gap:4px;padding:4px;background:#0b100e;border:1px solid #d8ff3e;box-shadow:0 8px 28px rgba(0,0,0,.45);";
    bar.querySelectorAll("button").forEach((button) => {
      button.style.cssText = "border:1px solid #28312e;background:#101715;color:#d8ff3e;font:700 10px DM Mono,monospace;letter-spacing:.08em;";
    });
    bar.querySelector(".mobile-play").style.cssText = "border:1px solid #d8ff3e;background:#d8ff3e;color:#080b0a;font:700 10px DM Mono,monospace;letter-spacing:.08em;";
    document.body.appendChild(bar);
    const send = (key) => window.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
    bar.querySelector('[data-f4="prev"]').onclick = () => send("ArrowLeft");
    bar.querySelector('[data-f4="next"]').onclick = () => send("ArrowRight");
    const mobilePlay = bar.querySelector('[data-f4="play"]');
    mobilePlay.onclick = () => document.querySelector(".transport-main")?.click();
    document.querySelectorAll("body *").forEach((node) => {
      if (node.children.length === 0 && node.textContent.includes("100 MB")) {
        node.textContent = node.textContent.replaceAll("100 MB", "500 MB");
      }
    });
    let displayedLevel = 0;
    const meterLoop = () => {
      bar.style.setProperty("display", window.innerWidth <= 768 ? "grid" : "none", "important");
      const transport = document.querySelector(".transport-main");
      if (transport && mobilePlay) {
        const isPlaying = transport.textContent.includes("PAUSE");
        mobilePlay.textContent = isPlaying ? "PAUSE" : "PLAY";
        mobilePlay.setAttribute("aria-label", isPlaying ? "Pause" : "Play");
      }
      if (window.innerWidth <= 768) {
        const meter = document.querySelector(".meter-fill");
        if (meter && transport) {
          // React's analyser-driven meter writes the real song level to height.
          // Reuse that value horizontally on phones; never invent a waveform here.
          const level = Number.parseFloat(meter.style.height) || 0;
          const playing = !transport.disabled && transport.textContent.includes("PAUSE") && level > 0;
          const targetLevel = playing ? Math.min(100, Math.max(0, level)) : 0;
          // Smooth the real analyser level so speech/transients do not jitter.
          displayedLevel += (targetLevel - displayedLevel) * 0.1;
          const width = displayedLevel > 1 ? `${Math.max(3, displayedLevel)}%` : "3px";
          meter.style.setProperty("width", width, "important");
          meter.setAttribute("aria-valuenow", String(Math.round(level)));
        }
      } else {
        // Never let the phone-only inline width affect the desktop meter.
        const meter = document.querySelector(".meter-fill");
        if (meter) meter.style.removeProperty("width");
        displayedLevel = 0;
      }
      window.requestAnimationFrame(meterLoop);
    };
    window.requestAnimationFrame(meterLoop);
  };
  const ensureTransport = () => {
    if (!document.getElementById("f4-mobile-transport")) boot();
    window.setTimeout(ensureTransport, 1000);
  };
  // Hydration can replace the server-rendered body after this script parses.
  // Wait briefly, then keep the phone transport mounted if that happens.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => window.setTimeout(ensureTransport, 1200), { once: true });
  } else {
    window.setTimeout(ensureTransport, 1200);
  }
})();
