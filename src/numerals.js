// src/numerals.js
// Float-up numeral animation. Pure DOM/CSS; styles live in styles.css.

export function numeralClassFor(digit) {
  if (!Number.isInteger(digit) || digit < 1 || digit > 10) {
    throw new Error(`numeral out of range: ${digit}`);
  }
  return `n-${digit}`;
}

// Float a numeral upward from a screen-space rect.
//
//   parent: container that owns absolute-positioned numerals (e.g. .numeral-layer)
//   digit:  1..10
//   originRect: { left, top, width, height } in viewport coordinates
//
// The CSS class .numeral handles the keyframe animation; we just inject the
// element with the right position and remove it on animationend.
export function floatNumeral(parent, digit, originRect) {
  const el = document.createElement("span");
  el.className = `numeral ${numeralClassFor(digit)}`;
  el.textContent = String(digit);

  const parentRect = parent.getBoundingClientRect();
  const cx = originRect.left + originRect.width / 2 - parentRect.left;
  const cy = originRect.top + originRect.height / 2 - parentRect.top;
  el.style.left = `${cx}px`;
  el.style.top = `${cy}px`;

  parent.appendChild(el);
  el.addEventListener("animationend", () => el.remove(), { once: true });
}
