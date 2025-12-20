import "../../src/styles.css";

const style = document.createElement("style");
style.textContent = `
  *, *::before, *::after {
    animation: none !important;
    transition: none !important;
    scroll-behavior: auto !important;
  }
`;
document.head.appendChild(style);
