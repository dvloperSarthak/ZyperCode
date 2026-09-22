// ZyperCode Interactive Landing Page Script
document.addEventListener("DOMContentLoaded", () => {
  // 1. Header scroll blur
  const header = document.querySelector("header.header");
  window.addEventListener("scroll", () => {
    if (window.scrollY > 20) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  });

  // 2. Typewriter Effect
  const typewriterElement = document.querySelector(".hero-typewriter");
  if (typewriterElement) {
    const phrases = [
      "dev workspace",
      "AI terminal",
      "code editor",
      "agent platform",
    ];
    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typingSpeed = 100;

    function type() {
      const currentPhrase = phrases[phraseIndex];

      if (isDeleting) {
        typewriterElement.textContent = currentPhrase.substring(0, charIndex - 1);
        charIndex--;
        typingSpeed = 50;
      } else {
        typewriterElement.textContent = currentPhrase.substring(0, charIndex + 1);
        charIndex++;
        typingSpeed = 110;
      }

      if (!isDeleting && charIndex === currentPhrase.length) {
        typingSpeed = 2000; // Pause at end
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        typingSpeed = 400; // Pause before new phrase
      }

      setTimeout(type, typingSpeed);
    }

    type();
  }

  // 3. OS Detection & Hero Download Button
  const heroDownloadBtn = document.getElementById("hero-download-btn");
  const platform = navigator.userAgent.toLowerCase();
  const WIN_INSTALLER_URL = "https://github.com/dvloperSarthak/ZyperCode/releases/download/v1.0.1/zypercode-v1.0.1-beta-installer.exe";
  const WIN_PORTABLE_URL = "https://github.com/dvloperSarthak/ZyperCode/releases/download/v1.0.1/zypercode-v1.0.1-beta-standalone.exe";
  const GITHUB_RELEASES_URL = "https://github.com/dvloperSarthak/ZyperCode/releases/tag/v1.0.1";

  if (heroDownloadBtn) {
    if (platform.includes("win")) {
      heroDownloadBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/><polyline points="8 12 12 16 16 12"/><line x1="12" y1="2" x2="12" y2="16"/></svg>
        Download for Windows (v1.0.1)
      `;
      heroDownloadBtn.href = WIN_INSTALLER_URL;
    } else if (platform.includes("mac")) {
      heroDownloadBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5.75C12 3.75 13.5 1.75 15.5 1.75C15.5 3.75 14 5.75 12 5.75Z"/><path d="M12.5 8.09C11.98 8.09 11.58 7.92 11.14 7.74C10.57 7.51 9.93 7.25 8.89 7.25C7.02 7.25 4 8.74 4 12.74C4 17.4 7.1 22.25 9.1 22.25C9.77 22.25 10.37 21.98 10.95 21.73C11.48 21.5 11.98 21.28 12.5 21.28C13.01 21.28 13.51 21.5 14.04 21.73C14.62 21.98 15.22 22.25 15.89 22.25C17.28 22.25 18.95 19.89 20 16.9C18.37 16.22 17.33 14.61 17.33 12.75C17.33 11.12 18.2 10.03 19.5 9.25C18.5 7.75 17.01 7.25 15.94 7.25C14.89 7.25 14.26 7.51 13.69 7.74C13.25 7.92 13.01 8.09 12.5 8.09Z"/></svg>
        Download for macOS
      `;
      heroDownloadBtn.href = GITHUB_RELEASES_URL;
    } else if (platform.includes("linux")) {
      heroDownloadBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/><polyline points="8 12 12 16 16 12"/><line x1="12" y1="2" x2="12" y2="16"/></svg>
        Download for Linux
      `;
      heroDownloadBtn.href = GITHUB_RELEASES_URL;
    }
  }

  // 4. FAQ Accordion
  const faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach((item) => {
    const questionBtn = item.querySelector(".faq-question");
    const answerDiv = item.querySelector(".faq-answer");

    questionBtn.addEventListener("click", () => {
      const isActive = item.classList.contains("active");

      // Close all other items
      faqItems.forEach((other) => {
        if (other !== item) {
          other.classList.remove("active");
          const otherAnswer = other.querySelector(".faq-answer");
          if (otherAnswer) otherAnswer.style.maxHeight = null;
        }
      });

      // Toggle current
      if (isActive) {
        item.classList.remove("active");
        answerDiv.style.maxHeight = null;
      } else {
        item.classList.add("active");
        answerDiv.style.maxHeight = answerDiv.scrollHeight + "px";
      }
    });
  });

  // 5. Copy Command Buttons
  const copyButtons = document.querySelectorAll(".copy-btn");
  copyButtons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const text = btn.getAttribute("data-copy");
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
        const origText = btn.textContent;
        btn.textContent = "Copied!";
        btn.style.color = "#10b981";
        setTimeout(() => {
          btn.textContent = origText;
          btn.style.color = "";
        }, 2000);
      } catch (err) {
        console.error("Failed to copy", err);
      }
    });
  });

  // 6. Theme Toggle (Dark / Light) with 'd' shortcut
  const themeToggleBtn = document.getElementById("theme-toggle-btn");
  const savedTheme = localStorage.getItem("zypercode-theme") || "dark";
  document.documentElement.setAttribute("data-theme", savedTheme);

  function toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("zypercode-theme", next);
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", toggleTheme);
  }

  window.addEventListener("keydown", (e) => {
    // Only toggle if not focused in an input
    if (
      e.key.toLowerCase() === "d" &&
      !["input", "textarea"].includes(document.activeElement?.tagName?.toLowerCase())
    ) {
      toggleTheme();
    }
  });

  // 7. Interactive Demo Video Trigger
  const demoButton = document.querySelector(".demo-play-trigger");
  if (demoButton) {
    demoButton.addEventListener("click", () => {
      const modal = document.createElement("div");
      modal.className = "video-modal-backdrop";
      modal.style.cssText = `
        position: fixed; inset: 0; z-index: 1000;
        background: rgba(0,0,0,0.85); backdrop-filter: blur(10px);
        display: flex; align-items: center; justify-content: center; p: 20px;
      `;
      modal.innerHTML = `
        <div style="position: relative; width: 100%; max-width: 960px; aspect-ratio: 16/9; background: #000; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
          <iframe width="100%" height="100%" src="https://www.youtube.com/embed/kykgXa7sm1g?autoplay=1" title="ZyperCode Demo" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
          <button id="close-demo-modal" style="position: absolute; top: 12px; right: 12px; background: rgba(0,0,0,0.7); border: 1px solid rgba(255,255,255,0.2); color: #fff; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 16px;">✕</button>
        </div>
      `;
      document.body.appendChild(modal);

      const closeModal = () => {
        modal.remove();
        window.removeEventListener("keydown", handleEsc);
      };

      const handleEsc = (e) => {
        if (e.key === "Escape") closeModal();
      };

      modal.querySelector("#close-demo-modal").addEventListener("click", closeModal);
      modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal();
      });
      window.addEventListener("keydown", handleEsc);
    });
  }
});
