import { byId, setText } from "../core/dom.js";
import { registerTranslationApplier, t } from "../core/i18n.js";
import {
  FEATURE_RUNTIME_STATE,
  STORAGE_KEYS,
  getStoredJson,
  setStoredJson,
} from "../core/state.js";

const todoState = FEATURE_RUNTIME_STATE.todoNotes;
const MAX_TODO_ITEMS = 300;
const MAX_NOTES_ITEMS = 300;
const TODO_VISIBILITY_MODES = ["all", "active", "done"];
const NOTE_PREVIEW_MAX_LEN = 180;
let draggedTodoItemId = "";
let draggedNoteId = "";

function buildNotePreview(text) {
  const normalized = String(text || "")
    .replace(/\s+/g, " ")
    .trim();
  if (normalized.length <= NOTE_PREVIEW_MAX_LEN) return normalized;
  return `${normalized.slice(0, NOTE_PREVIEW_MAX_LEN).trimEnd()}...`;
}

function getNotesEditor() {
  return byId("todo-notes-input");
}

function setEditorContent(note = null) {
  const editor = getNotesEditor();
  if (!editor) return;
  if (!note) {
    editor.innerHTML = "";
    return;
  }
  if (typeof note.html === "string" && note.html.trim()) {
    editor.innerHTML = note.html;
    return;
  }
  editor.textContent = note.text || "";
}

function getEditorText() {
  const editor = getNotesEditor();
  if (!editor) return "";
  return String(editor.textContent || "").trim();
}

function getEditorHtml() {
  const editor = getNotesEditor();
  if (!editor) return "";
  return String(editor.innerHTML || "").trim();
}

function ensureTodoState() {
  if (!Array.isArray(todoState.items)) todoState.items = [];
  if (!Array.isArray(todoState.notes)) todoState.notes = [];
  if (!["tasks", "notes"].includes(todoState.activeTab)) {
    todoState.activeTab = "tasks";
  }
  if (!TODO_VISIBILITY_MODES.includes(todoState.visibilityMode)) {
    todoState.visibilityMode = "all";
  }
  if (typeof todoState.initialized !== "boolean") todoState.initialized = false;
  if (typeof todoState.selectedNoteId !== "string")
    todoState.selectedNoteId = "";
}

function saveTodoData() {
  setStoredJson(STORAGE_KEYS.todoNotesData, {
    items: todoState.items,
    notes: todoState.notes,
    activeTab: todoState.activeTab,
    visibilityMode: todoState.visibilityMode,
  });
}

function loadTodoData() {
  ensureTodoState();
  const data = getStoredJson(STORAGE_KEYS.todoNotesData, null);
  if (!data || typeof data !== "object") return;
  if (Array.isArray(data.items)) {
    todoState.items = data.items
      .map((item) => ({
        id: String(item?.id || ""),
        text: String(item?.text || "").trim(),
        done: Boolean(item?.done),
      }))
      .filter((item) => item.id && item.text);
  }
  if (Array.isArray(data.notes)) {
    todoState.notes = data.notes
      .map((note) => ({
        id: String(note?.id || ""),
        title: String(note?.title || "").trim(),
        text: String(note?.text || "").trim(),
        html: String(note?.html || "").trim(),
        isTaskLike: Object.prototype.hasOwnProperty.call(note || {}, "done"),
      }))
      .filter((note) => note.id && note.text && !note.isTaskLike)
      .map(({ id, title, text, html }) => ({
        id,
        title: title || buildNotePreview(text),
        text,
        html,
      }));
  }
  if (!todoState.notes.length && typeof data.notesText === "string") {
    const legacyText = data.notesText.trim();
    if (legacyText) {
      todoState.notes = [
        {
          id: `${Date.now()}-legacy`,
          title: buildNotePreview(legacyText),
          text: legacyText,
          html: "",
        },
      ];
    }
  }
  if (["tasks", "notes"].includes(data.activeTab)) {
    todoState.activeTab = data.activeTab;
  }
  if (TODO_VISIBILITY_MODES.includes(data.visibilityMode)) {
    todoState.visibilityMode = data.visibilityMode;
  }
}

function renderTodoTabs() {
  const tasksBtn = byId("todo-tab-tasks");
  const notesBtn = byId("todo-tab-notes");
  const tasksPanel = byId("todo-tasks-panel");
  const notesPanel = byId("todo-notes-panel");

  if (tasksBtn)
    tasksBtn.classList.toggle("active", todoState.activeTab === "tasks");
  if (notesBtn)
    notesBtn.classList.toggle("active", todoState.activeTab === "notes");
  if (tasksPanel) tasksPanel.hidden = todoState.activeTab !== "tasks";
  if (notesPanel) notesPanel.hidden = todoState.activeTab !== "notes";
}

function renderTodoList() {
  const holder = byId("todo-list");
  if (!holder) return;
  const visibleItems = todoState.items.filter((item) => {
    if (todoState.visibilityMode === "active") return !item.done;
    if (todoState.visibilityMode === "done") return item.done;
    return true;
  });
  if (!visibleItems.length) {
    holder.textContent = t("todoEmpty");
    return;
  }
  const rows = visibleItems.map((item) => {
    const row = document.createElement("article");
    row.className = "todo-task-item";
    row.draggable = true;
    row.dataset.todoId = item.id;
    row.addEventListener("dragstart", () => {
      draggedTodoItemId = item.id;
      row.classList.add("is-dragging");
    });
    row.addEventListener("dragend", () => {
      draggedTodoItemId = "";
      row.classList.remove("is-dragging");
      holder.querySelectorAll(".todo-drop-target").forEach((x) => {
        x.classList.remove("todo-drop-target");
      });
    });
    row.addEventListener("dragover", (event) => {
      event.preventDefault();
      if (!draggedTodoItemId || draggedTodoItemId === item.id) return;
      row.classList.add("todo-drop-target");
    });
    row.addEventListener("dragleave", () => {
      row.classList.remove("todo-drop-target");
    });
    row.addEventListener("drop", (event) => {
      event.preventDefault();
      row.classList.remove("todo-drop-target");
      reorderTodoItems(draggedTodoItemId, item.id);
    });

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = item.done;
    checkbox.addEventListener("change", () => toggleTodoItem(item.id));

    const text = document.createElement("span");
    text.textContent = item.text;
    text.className = "todo-task-text";
    if (item.done) text.classList.add("done");

    const actions = document.createElement("div");
    actions.className = "todo-task-actions";

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "text-action-btn todo-remove-btn";
    removeBtn.title = t("todoRemove");
    removeBtn.setAttribute("aria-label", t("todoRemove"));
    removeBtn.innerHTML =
      '<svg class="icon-svg btn-icon" aria-hidden="true"><use href="#i-x"></use></svg>';
    removeBtn.addEventListener("click", () => removeTodoItem(item.id));

    actions.append(removeBtn);
    row.append(checkbox, text, actions);
    return row;
  });
  holder.replaceChildren(...rows);
}

function renderTodoVisibilityGroups() {
  const allBtn = byId("todo-filter-all");
  const activeBtn = byId("todo-filter-active");
  const doneBtn = byId("todo-filter-done");
  if (allBtn)
    allBtn.classList.toggle("active", todoState.visibilityMode === "all");
  if (activeBtn)
    activeBtn.classList.toggle("active", todoState.visibilityMode === "active");
  if (doneBtn)
    doneBtn.classList.toggle("active", todoState.visibilityMode === "done");
}

function renderTodoSummary() {
  const summary = byId("todo-summary");
  if (!summary) return;
  const done = todoState.items.filter((x) => x.done).length;
  const total = todoState.items.length;
  summary.textContent = `${t("todoSummary")}: ${done}/${total}`;
}

function renderTodoNotes() {
  const holder = byId("todo-notes-list");
  if (!holder) return;
  if (!todoState.notes.length) {
    holder.textContent = t("todoNotesEmpty");
    return;
  }
  const cards = todoState.notes.map((note) => {
    const card = document.createElement("article");
    card.className = "todo-note-card";
    card.draggable = true;
    card.dataset.noteId = note.id;
    card.addEventListener("dragstart", () => {
      draggedNoteId = note.id;
      card.classList.add("is-dragging");
    });
    card.addEventListener("dragend", () => {
      draggedNoteId = "";
      card.classList.remove("is-dragging");
      holder.querySelectorAll(".todo-drop-target").forEach((x) => {
        x.classList.remove("todo-drop-target");
      });
    });
    card.addEventListener("dragover", (event) => {
      event.preventDefault();
      if (!draggedNoteId || draggedNoteId === note.id) return;
      card.classList.add("todo-drop-target");
    });
    card.addEventListener("dragleave", () => {
      card.classList.remove("todo-drop-target");
    });
    card.addEventListener("drop", (event) => {
      event.preventDefault();
      card.classList.remove("todo-drop-target");
      reorderNotes(draggedNoteId, note.id);
    });
    if (todoState.selectedNoteId === note.id) {
      card.classList.add("active");
    }

    const text = document.createElement("div");
    text.className = "todo-note-text";
    text.textContent = note.title || buildNotePreview(note.text);
    text.title = note.text;
    text.addEventListener("click", () => openTodoNote(note.id));

    const actions = document.createElement("div");
    actions.className = "todo-task-actions";

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "text-action-btn todo-remove-btn";
    removeBtn.title = t("todoRemove");
    removeBtn.setAttribute("aria-label", t("todoRemove"));
    removeBtn.innerHTML =
      '<svg class="icon-svg btn-icon" aria-hidden="true"><use href="#i-x"></use></svg>';
    removeBtn.addEventListener("click", () => removeTodoNote(note.id));

    actions.append(removeBtn);
    card.append(text, actions);
    return card;
  });
  holder.replaceChildren(...cards);
}

function renderTodoNoteEditorState() {
  const addBtn = byId("todo-notes-add-btn");
  const saveBtn = byId("todo-notes-save-btn");
  const isEditing = Boolean(todoState.selectedNoteId);

  if (addBtn) {
    const addLabel = t("todoAdd");
    addBtn.title = addLabel;
    addBtn.setAttribute("aria-label", addLabel);
    addBtn.classList.remove("active");
    setText("todo-notes-add-label", addLabel);
  }

  if (saveBtn) {
    const saveLabel = t("todoSave");
    saveBtn.title = saveLabel;
    saveBtn.setAttribute("aria-label", saveLabel);
    saveBtn.classList.toggle("active", isEditing);
  }
}

function moveById(list, fromId, toId) {
  const fromIndex = list.findIndex((x) => x.id === fromId);
  const toIndex = list.findIndex((x) => x.id === toId);
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return list;
  const copy = list.slice();
  const [moved] = copy.splice(fromIndex, 1);
  copy.splice(toIndex, 0, moved);
  return copy;
}

function reorderTodoItems(fromId, toId) {
  ensureTodoState();
  if (!fromId || !toId || fromId === toId) return;
  const next = moveById(todoState.items, fromId, toId);
  if (next === todoState.items) return;
  todoState.items = next;
  saveTodoData();
  renderTodoUi();
}

function reorderNotes(fromId, toId) {
  ensureTodoState();
  if (!fromId || !toId || fromId === toId) return;
  const next = moveById(todoState.notes, fromId, toId);
  if (next === todoState.notes) return;
  todoState.notes = next;
  saveTodoData();
  renderTodoUi();
}

function renderTodoUi() {
  renderTodoTabs();
  renderTodoVisibilityGroups();
  renderTodoList();
  renderTodoSummary();
  renderTodoNotes();
  renderTodoNoteEditorState();
}

export function setTodoTab(tab) {
  ensureTodoState();
  if (!["tasks", "notes"].includes(tab)) return;
  todoState.activeTab = tab;
  saveTodoData();
  renderTodoUi();
}

export function setTodoVisibility(mode) {
  ensureTodoState();
  if (!TODO_VISIBILITY_MODES.includes(mode)) return;
  todoState.visibilityMode = mode;
  saveTodoData();
  renderTodoUi();
}

export function addTodoItem() {
  ensureTodoState();
  const input = byId("todo-input");
  if (!input) return;
  const text = String(input.value || "").trim();
  if (!text) return;
  todoState.items.push({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    text,
    done: false,
  });
  if (todoState.items.length > MAX_TODO_ITEMS) {
    todoState.items.splice(0, todoState.items.length - MAX_TODO_ITEMS);
  }
  input.value = "";
  saveTodoData();
  renderTodoUi();
}

export function toggleTodoItem(id) {
  ensureTodoState();
  const item = todoState.items.find((x) => x.id === id);
  if (!item) return;
  item.done = !item.done;
  saveTodoData();
  renderTodoUi();
}

export function removeTodoItem(id) {
  ensureTodoState();
  const next = todoState.items.filter((x) => x.id !== id);
  if (next.length === todoState.items.length) return;
  todoState.items = next;
  saveTodoData();
  renderTodoUi();
}

export function clearCompletedTodo() {
  ensureTodoState();
  todoState.items = todoState.items.filter((x) => !x.done);
  saveTodoData();
  renderTodoUi();
}

export function onTodoInputKeydown(event) {
  if (event?.key !== "Enter") return;
  addTodoItem();
}

export function onTodoNotesInput() {
  renderTodoNoteEditorState();
}

export function onTodoNotesSave() {
  addTodoNote();
}

export function addTodoNote() {
  ensureTodoState();
  const titleInput = byId("todo-notes-title");
  const editor = getNotesEditor();
  if (!editor || !titleInput) return;
  const title = String(titleInput.value || "").trim();
  const text = getEditorText();
  const html = getEditorHtml();
  if (!title && !text) return;
  if (todoState.selectedNoteId) {
    const target = todoState.notes.find(
      (x) => x.id === todoState.selectedNoteId,
    );
    if (target) {
      target.title = title || buildNotePreview(text);
      target.text = text || title;
      target.html = html;
    }
  } else {
    todoState.notes.unshift({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title: title || buildNotePreview(text),
      text: text || title,
      html,
    });
  }
  if (todoState.notes.length > MAX_NOTES_ITEMS) {
    todoState.notes.length = MAX_NOTES_ITEMS;
  }
  todoState.selectedNoteId = "";
  titleInput.value = "";
  setEditorContent(null);
  saveTodoData();
  renderTodoUi();
}

export function onTodoNotesInputKeydown(event) {
  if (!event) return;
  if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    addTodoNote();
  }
}

function focusNotesEditor() {
  const editor = getNotesEditor();
  if (editor) editor.focus();
}

function applyEditorCommand(command) {
  focusNotesEditor();
  document.execCommand(command, false);
}

function insertEditorLink() {
  focusNotesEditor();
  const rawUrl = String(prompt(t("todoNoteLinkPrompt"), "https://") || "").trim();
  if (!rawUrl) return;
  const normalizedUrl =
    rawUrl.startsWith("http://") || rawUrl.startsWith("https://")
      ? rawUrl
      : `https://${rawUrl}`;

  const selection = window.getSelection();
  if (selection && !selection.isCollapsed) {
    document.execCommand("createLink", false, normalizedUrl);
    return;
  }

  document.execCommand(
    "insertHTML",
    false,
    `<a href="${normalizedUrl}" target="_blank" rel="noopener noreferrer">${normalizedUrl}</a>&nbsp;`,
  );
}

function clearNoteEditor() {
  const titleInput = byId("todo-notes-title");
  const input = getNotesEditor();
  if (titleInput) titleInput.value = "";
  if (input) input.innerHTML = "";
  todoState.selectedNoteId = "";
  renderTodoUi();
}

export function todoNoteEditorAction(action) {
  ensureTodoState();
  switch (action) {
    case "add":
      todoState.selectedNoteId = "";
      addTodoNote();
      break;
    case "bold":
      applyEditorCommand("bold");
      break;
    case "italic":
      applyEditorCommand("italic");
      break;
    case "underline":
      applyEditorCommand("underline");
      break;
    case "strike":
      applyEditorCommand("strikeThrough");
      break;
    case "ordered":
      applyEditorCommand("insertOrderedList");
      break;
    case "link":
      insertEditorLink();
      break;
    case "clear":
      clearNoteEditor();
      break;
    case "save":
    default:
      addTodoNote();
      break;
  }
}

export function removeTodoNote(id) {
  ensureTodoState();
  const next = todoState.notes.filter((x) => x.id !== id);
  if (next.length === todoState.notes.length) return;
  todoState.notes = next;
  if (todoState.selectedNoteId === id) {
    todoState.selectedNoteId = "";
    const titleInput = byId("todo-notes-title");
    const input = getNotesEditor();
    if (titleInput) titleInput.value = "";
    if (input) input.innerHTML = "";
  }
  saveTodoData();
  renderTodoUi();
}

export function openTodoNote(id) {
  ensureTodoState();
  const note = todoState.notes.find((x) => x.id === id);
  if (!note) return;
  const titleInput = byId("todo-notes-title");
  if (titleInput) titleInput.value = note.title || "";
  setEditorContent(note);
  todoState.selectedNoteId = id;
  renderTodoUi();
}

function applyTodoTranslations() {
  setText("menu-todo", t("todo"));
  setText("title-todo", t("todoTitle"));
  setText("todo-add-btn", t("todoAdd"));
  setText("todo-clear-done-label", t("todoClearDone"));
  setText("todo-tab-tasks", t("todoTabTasks"));
  setText("todo-tab-notes", t("todoTabNotes"));
  setText("todo-filter-all-label", t("todoFilterAll"));
  setText("todo-filter-active-label", t("todoFilterActive"));
  setText("todo-filter-done-label", t("todoFilterDone"));
  setText("todo-notes-label", t("todoNotesLabel"));
  const notesActions = [
    ["todo-note-bold-btn", t("todoNoteBold")],
    ["todo-note-italic-btn", t("todoNoteItalic")],
    ["todo-note-underline-btn", t("todoNoteUnderline")],
    ["todo-note-strike-btn", t("todoNoteStrike")],
    ["todo-note-ordered-btn", t("todoNoteOrdered")],
    ["todo-note-link-btn", t("todoNoteLink")],
    ["todo-notes-save-btn", t("todoSave")],
    ["todo-note-clear-btn", t("todoNoteClear")],
  ];
  notesActions.forEach(([id, label]) => {
    const btn = byId(id);
    if (!btn) return;
    btn.title = label;
    btn.setAttribute("aria-label", label);
  });
  renderTodoNoteEditorState();
  const input = byId("todo-input");
  if (input) input.placeholder = t("todoPlaceholder");
  const titleInput = byId("todo-notes-title");
  if (titleInput) titleInput.placeholder = t("todoNotesTitlePlaceholder");
  const notesInput = byId("todo-notes-input");
  if (notesInput) notesInput.dataset.placeholder = t("todoNotesPlaceholder");
  renderTodoUi();
}

export function initTodoNotes() {
  ensureTodoState();
  loadTodoData();
  renderTodoUi();
  if (!todoState.initialized) {
    registerTranslationApplier(applyTodoTranslations);
    todoState.initialized = true;
  }
}
