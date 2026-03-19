export function byId(id) {
  return document.getElementById(id);
}

export function query(selector, root = document) {
  return root.querySelector(selector);
}

export function queryAll(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

export function setText(id, value) {
  const el = byId(id);
  if (el) el.textContent = value;
}

export function setHtml(id, value) {
  const el = byId(id);
  if (el) el.innerHTML = value;
}

export function setLabelText(forId, value) {
  const label = query(`label[for="${forId}"]`);
  if (label) label.textContent = value;
}

export function setSelectOptionText(selectId, value, text) {
  const option = query(`#${selectId} option[value="${value}"]`);
  if (option) option.textContent = text;
}

export function setIcon(id, iconName) {
  const el = byId(id);
  if (!el) return;
  el.innerHTML = `<svg class="icon-svg btn-icon"><use href="#${iconName}"></use></svg>`;
}

let toastTimerId = null;
export function showAppToast(message, durationMs = 1800) {
  const toast = byId("app-toast");
  if (!toast) return;
  if (toastTimerId) {
    clearTimeout(toastTimerId);
    toastTimerId = null;
  }
  toast.textContent = message;
  toast.classList.add("show");
  toastTimerId = setTimeout(() => {
    toast.classList.remove("show");
    toastTimerId = null;
  }, durationMs);
}
