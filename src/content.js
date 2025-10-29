chrome.storage.local.get(['robuxHiderEnabled'], (result) => {
  const isEnabled = result.robuxHiderEnabled !== false;
  if (!isEnabled) return;

  (function () {
    const hideStyle = document.createElement("style");
    hideStyle.id = "robux-hider-hide-style";
    hideStyle.textContent = `
#nav-robux-amount,
#nav-robux-balance,
#navbar-robux,
.text-robux,
.user-transactions-container,
.modal-content { visibility: hidden !important; }
`;
    document.documentElement.appendChild(hideStyle);

    function hasDigit(s) {
      return /\d/.test(s);
    }

    const numericGroupRe = /(?:[\d\u00A0\u202F.,]+(?:[KkMmBb+]?)(?:[\s\u00A0\u202F]+[\d\u00A0\u202F.,]+)*)/g;
    const multiQRe = /(\?{3})(?:[\s\u00A0\u202F]+)(\?{3})/g;

    function walkReplace(root) {
      if (!root) return false;
      let changed = false;

      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
      const nodes = [];

      while (walker.nextNode()) nodes.push(walker.currentNode);

      for (const n of nodes) {
        const t = n.nodeValue;
        if (!t || !hasDigit(t)) continue;
        let r = t.replace(numericGroupRe, "???");
        r = r.replace(multiQRe, "???");
        r = r.replace(/(\?{3})[\s\u00A0\u202F]+(\?{3})/g, "???");
        r = r.replace(/(\(\s*)\?{3}\s*([^\d\s)]+)/g, "$1??? $2");
        r = r.replace(/\?{3}\s*[KkMmBb]?\+/g, "???");
        if (r !== t) {
          n.nodeValue = r;
          changed = true;
        }
      }

      return changed;
    }

    function replaceAll() {
      const selectors = [
        "#nav-robux-amount",
        "#nav-robux-balance",
        "#navbar-robux",
        ".user-transactions-container",
        ".modal-footer",
        ".popover-content",
        ".dropdown-wallet"
      ];

      let any = false;

      for (const s of selectors) {
        document.querySelectorAll(s).forEach(el => {
          if (walkReplace(el)) any = true;
        });
      }

      const navAmount = document.getElementById("nav-robux-amount");
      if (navAmount && hasDigit(navAmount.textContent)) {
        let t = navAmount.textContent.replace(/\+$/g, "");
        t = t.replace(/[KkMmBb]\+$/g, "");
        navAmount.textContent = "???";
        any = true;
      }

      const navBalance = document.getElementById("nav-robux-balance");
      if (navBalance && /(\?{3})[\s\u00A0\u202F]+(\?{3})/.test(navBalance.textContent)) {
        navBalance.textContent = "???";
        any = true;
      }

      return any;
    }

    function removeHideStyle() {
      const el = document.getElementById("robux-hider-hide-style");
      if (el) el.remove();
    }

    let tries = 0;

    const maxTries = 8;
    const tryInterval = 400;

    const timer = setInterval(() => {
      tries++;
      const done = replaceAll();
      if (done || tries >= maxTries) {
        removeHideStyle();
        clearInterval(timer);
      }
    }, tryInterval);

    const obs = new MutationObserver(muts => {

      for (const m of muts) {
        if (m.addedNodes && m.addedNodes.length) {
          for (const n of m.addedNodes) {
            if (n.nodeType === 3 && hasDigit(n.nodeValue)) {
              replaceAll();
              return;
            }

            if (n.nodeType === 1 && hasDigit(n.innerText || "")) {
              replaceAll();
              return;
            }

          }
        }

        if (m.type === "characterData" && hasDigit(m.target.nodeValue || "")) {
          replaceAll();
          return;
        }
      }
    });

    obs.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  })();
});