import { beforeEach, describe, expect, it } from "vitest";
import { FEATURE_RUNTIME_STATE } from "../core/state.js";
import {
  addTodoItem,
  addTodoNote,
  clearCompletedTodo,
  initTodoNotes,
  openTodoNote,
  onTodoNotesInput,
  onTodoNotesSave,
  onTodoNotesInputKeydown,
  removeTodoNote,
  setTodoVisibility,
  setTodoTab,
  toggleTodoItem,
} from "../features/todo-notes.js";

function mountTodoDom() {
  document.body.innerHTML = `
    <span id="menu-todo"></span>
    <h2 id="title-todo"></h2>
    <input id="todo-input" />
    <button id="todo-add-btn"></button>
    <button id="todo-tab-tasks"></button>
    <button id="todo-tab-notes"></button>
    <button id="todo-clear-done-btn"></button>
    <button id="todo-filter-all"></button>
    <button id="todo-filter-active"></button>
    <button id="todo-filter-done"></button>
    <div id="todo-tasks-panel"></div>
    <div id="todo-notes-panel"></div>
    <div id="todo-summary"></div>
    <div id="todo-list"></div>
    <label id="todo-notes-label"></label>
    <input id="todo-notes-title" />
    <div id="todo-notes-input" contenteditable="true"></div>
    <button id="todo-notes-add-btn"></button>
    <div id="todo-notes-list"></div>
  `;
}

describe("todo notes module", () => {
  beforeEach(() => {
    localStorage.clear();
    FEATURE_RUNTIME_STATE.todoNotes.items = [];
    FEATURE_RUNTIME_STATE.todoNotes.notes = [];
    FEATURE_RUNTIME_STATE.todoNotes.activeTab = "tasks";
    FEATURE_RUNTIME_STATE.todoNotes.visibilityMode = "all";
    FEATURE_RUNTIME_STATE.todoNotes.initialized = false;
    mountTodoDom();
    initTodoNotes();
  });

  it("adds, toggles and filters tasks", () => {
    document.getElementById("todo-input").value = "Task A";
    addTodoItem();
    document.getElementById("todo-input").value = "Task B";
    addTodoItem();

    const firstCheckbox = document.querySelector(
      "#todo-list input[type='checkbox']",
    );
    firstCheckbox.checked = true;
    firstCheckbox.dispatchEvent(new Event("change"));

    setTodoVisibility("active");
    const activeText = document.getElementById("todo-list")?.textContent || "";
    expect(activeText).not.toContain("Task A");
    expect(activeText).toContain("Task B");

    setTodoVisibility("done");
    const doneText = document.getElementById("todo-list")?.textContent || "";
    expect(doneText).toContain("Task A");
    expect(doneText).not.toContain("Task B");
  });

  it("stores note cards, switches tab and clears done tasks", () => {
    document.getElementById("todo-input").value = "Task C";
    addTodoItem();
    const rawBefore = JSON.parse(localStorage.getItem("todoNotesData") || "{}");
    const firstId = rawBefore?.items?.[0]?.id;
    if (firstId) toggleTodoItem(firstId);

    const notesInput = document.getElementById("todo-notes-input");
    const notesTitle = document.getElementById("todo-notes-title");
    notesTitle.value = "Title A";
    notesInput.textContent = "Note A body";
    onTodoNotesSave();
    notesTitle.value = "Title B";
    notesInput.textContent = "Note B body";
    onTodoNotesInputKeydown({
      key: "Enter",
      ctrlKey: true,
      metaKey: false,
      preventDefault() {},
    });
    setTodoTab("notes");

    clearCompletedTodo();
    const listText = document.getElementById("todo-list")?.textContent || "";
    expect(listText).toContain("todoEmpty");
    expect(document.getElementById("todo-notes-panel")?.hidden).toBe(false);
    const notesText =
      document.getElementById("todo-notes-list")?.textContent || "";
    expect(notesText).toContain("Title A");
    expect(notesText).toContain("Title B");

    const rawWithNotes = JSON.parse(
      localStorage.getItem("todoNotesData") || "{}",
    );
    const firstNoteId = rawWithNotes?.notes?.[0]?.id;
    if (firstNoteId) openTodoNote(firstNoteId);
    expect(document.getElementById("todo-notes-title")?.value).toBe("Title B");
    expect(document.getElementById("todo-notes-input")?.textContent).toContain(
      "Note B body",
    );
    if (firstNoteId) removeTodoNote(firstNoteId);

    const raw = JSON.parse(localStorage.getItem("todoNotesData") || "{}");
    expect(Array.isArray(raw.notes)).toBe(true);
    expect(Array.isArray(raw.items)).toBe(true);
    expect(raw.notes.length).toBe(1);
  });
});
