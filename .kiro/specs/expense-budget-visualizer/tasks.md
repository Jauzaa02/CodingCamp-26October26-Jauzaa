# Implementation Plan: Expense & Budget Visualizer

## Overview

Build a single-page, client-side expense tracking app in three files (`index.html`, `css/style.css`, `js/app.js`) with no build step. State is managed through a central `setState()` helper that persists to Local Storage and triggers a full re-render. Chart.js is loaded via CDN for the pie chart.

## Tasks

- [x] 1. Create HTML skeleton and project structure
  - Create `index.html` with the full semantic structure: `<header>` containing `#balance-display` and `#balance-amount`, `<main>` with three `<section>` elements for `#form-section`, `#chart-section`, and `#list-section`
  - Add `<form id="transaction-form">` with `#item-name` (text), `#item-amount` (number), `#item-category` (select with Food/Transport/Fun options), and a submit button
  - Add `<canvas id="pie-chart">` inside `#chart-section` with `role="img"` and an `aria-label`
  - Add `<ul id="transaction-list">` inside `#list-section`
  - Add `<link>` to `css/style.css` and two `<script>` tags: Chart.js CDN before `js/app.js`
  - Ensure all `<input>` and `<select>` elements have associated `<label>` elements for accessibility
  - Create empty `css/style.css` and empty `js/app.js` placeholder files
  - _Requirements: 7.2, 7.3, 8.2, 8.3_

- [x] 2. Implement storage and state management
  - [x] 2.1 Implement storage module in `js/app.js`
    - Write `saveToStorage(transactions)` — serializes array to `localStorage.setItem("expense_transactions", JSON.stringify(transactions))`
    - Write `loadFromStorage()` — reads and parses key `"expense_transactions"`, returns `[]` on null or JSON parse error using `try/catch`
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ]* 2.2 Write property test for Local Storage round-trip (Property 5)
    - **Property 5: Local Storage round-trip preserves content and order**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.5**
    - Use `fast-check` with arbitrary `Transaction[]` arrays and a mocked `localStorage`
    - Assert that `loadFromStorage(saveToStorage(arr))` produces an array identical in length, content, and order

  - [x] 2.3 Implement state management in `js/app.js`
    - Declare module-level `let transactions = []` as the single source of truth
    - Write `getState()` — returns a shallow copy of the transactions array
    - Write `loadState()` — calls `loadFromStorage()`, assigns result to `transactions`, returns the array
    - Write `setState(newTransactions)` — assigns to `transactions`, calls `saveToStorage`, then calls `renderAll(transactions)`
    - _Requirements: 6.1, 6.2, 6.3_

- [x] 3. Implement validation module
  - [x] 3.1 Write `validateForm(name, amount, category)` in `js/app.js`
    - Returns `{ valid: boolean, errors: { name?, amount?, category? } }`
    - Name invalid if empty string or whitespace-only (`name.trim() === ""`)
    - Amount invalid if not a finite positive number (`isNaN`, `<= 0`, or `!isFinite`)
    - Category invalid if not one of `"Food"`, `"Transport"`, `"Fun"`
    - _Requirements: 1.3, 1.4_

  - [ ]* 3.2 Write property test for whitespace/empty name rejection (Property 1)
    - **Property 1: Whitespace and empty names are invalid**
    - **Validates: Requirements 1.3, 1.4**
    - Use `fc.string()` filtered to whitespace-only strings
    - Assert `validateForm(wsName, 10, "Food").valid === false` and errors.name is defined

  - [ ]* 3.3 Write property test for non-positive amount rejection (Property 2)
    - **Property 2: Non-positive amounts are invalid**
    - **Validates: Requirements 1.3, 1.4**
    - Use `fc.oneof(fc.constant(0), fc.float({ max: 0 }), fc.constant(NaN), fc.constant(-Infinity))`
    - Assert `validateForm("Item", badAmount, "Food").valid === false` and errors.amount is defined

- [x] 4. Implement rendering module and chart
  - [x] 4.1 Write `computeCategoryTotals(transactions)` helper in `js/app.js`
    - Iterates transactions, accumulates amounts keyed by category
    - Returns a `CategoryTotals` object `{ Food: number, Transport: number, Fun: number }` defaulting each to `0`
    - _Requirements: 5.1_

  - [ ]* 4.2 Write property test for category totals sum equals balance (Property 6)
    - **Property 6: Category totals sum equals overall balance**
    - **Validates: Requirements 5.1, 4.1**
    - Use arbitrary `Transaction[]` arrays
    - Assert `Object.values(computeCategoryTotals(arr)).reduce((a,b) => a+b, 0) === arr.reduce((s,t) => s+t.amount, 0)`

  - [x] 4.3 Write `renderBalance(transactions)` in `js/app.js`
    - Sums all `amount` fields, formats as currency (e.g., `$12.50` using `toLocaleString` or `toFixed(2)`)
    - Sets `document.getElementById("balance-amount").textContent`
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ]* 4.4 Write property test for balance display equals sum (Property 4)
    - **Property 4: Balance equals sum of all transaction amounts**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**
    - Use arbitrary `Transaction[]` arrays, call `renderBalance` against a mocked DOM element
    - Assert displayed value equals arithmetic sum of all `amount` fields

  - [x] 4.5 Write `renderList(transactions)` in `js/app.js`
    - Clears `#transaction-list`, then builds and inserts `<li>` elements newest-first (sort by `timestamp` descending)
    - Each `<li>` displays item name, formatted amount, category, and a delete `<button>` with `data-id` attribute and `aria-label="Delete {name}"`
    - _Requirements: 2.1, 2.2, 2.3, 3.1_

  - [x] 4.6 Implement chart module — `initChart()` and `updateChart(categoryTotals)` in `js/app.js`
    - `initChart()`: checks for `window.Chart`; if present, creates a `pie` Chart.js instance on `#pie-chart` with Food/Transport/Fun labels and placeholder data; if absent, renders a static fallback text message
    - `updateChart(categoryTotals)`: updates `chart.data.datasets[0].data` and calls `chart.update()`; handles empty-data state with a grey placeholder and "No data" label
    - _Requirements: 5.1, 5.4, 5.5, 5.6, 8.3_

  - [x] 4.7 Write `renderChart(transactions)` and `renderAll(transactions)` in `js/app.js`
    - `renderChart(transactions)`: calls `computeCategoryTotals`, then calls `updateChart(categoryTotals)`
    - `renderAll(transactions)`: calls `renderBalance`, `renderList`, and `renderChart` in sequence
    - _Requirements: 4.2, 4.3, 5.2, 5.3_

- [ ] 5. Checkpoint — Ensure core logic tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement event handlers and wiring
  - [ ] 6.1 Write `handleFormSubmit(event)` in `js/app.js`
    - Calls `event.preventDefault()`, reads values from `#item-name`, `#item-amount`, `#item-category`
    - Clears any existing inline error `<span>` elements before re-validating
    - Calls `validateForm`; on failure injects inline error `<span>` elements adjacent to invalid fields
    - On success: creates a `Transaction` object with `id` (`crypto.randomUUID()` or `Date.now().toString(36)`), `name`, `amount` (parsed float), `category`, `timestamp` (`Date.now()`); calls `setState([...getState(), newTransaction])`; resets the form
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ]* 6.2 Write property test for valid transaction increases list by one (Property 3)
    - **Property 3: Valid transaction addition increases list length by exactly one**
    - **Validates: Requirements 1.2, 2.1**
    - Use arbitrary valid transaction objects and arbitrary existing transaction arrays (mocked `setState`)
    - Assert list length after add equals list length before add plus one

  - [ ] 6.3 Write `handleDeleteClick(id)` in `js/app.js`
    - Filters current state to remove the transaction matching `id`
    - Calls `setState` with the filtered array
    - _Requirements: 3.2, 3.3, 3.4_

  - [ ]* 6.4 Write property test for delete removes transaction from list and storage (Property 7)
    - **Property 7: Deleted transaction no longer appears in list or storage**
    - **Validates: Requirements 3.2, 3.3, 3.4**
    - Use arbitrary `Transaction[]` with at least one entry; pick a random `id` from the array
    - Assert that after `handleDeleteClick(id)`, no transaction with that `id` exists in state or in `loadFromStorage()`

  - [ ] 6.5 Write `init()` function in `js/app.js`
    - Attaches `handleFormSubmit` to `#transaction-form`'s `submit` event
    - Attaches `handleDeleteClick` to `#transaction-list` via event delegation (single listener on the `<ul>` checking `data-id` on click targets)
    - Calls `loadState()`, then `initChart()`, then `renderAll(transactions)`
    - Registers `init` on `DOMContentLoaded`
    - _Requirements: 2.4, 6.3, 8.1_

- [ ] 7. Style the application with CSS
  - [ ] 7.1 Write base styles and CSS custom properties in `css/style.css`
    - Define custom properties for colour palette, font sizes, spacing, and border-radius
    - Apply a CSS reset/base (`box-sizing: border-box`, `margin: 0`, `font-family`)
    - _Requirements: 7.2, 7.4_

  - [ ] 7.2 Implement responsive layout in `css/style.css`
    - Style `<header>` to show app title and `#balance-display` prominently at the top
    - Use CSS Grid or Flexbox for `<main>` to arrange `#form-section`, `#chart-section`, and `#list-section`
    - Add `overflow-y: auto` (or `scroll`) with a fixed `max-height` to `#transaction-list` so it scrolls independently
    - Add media queries so the layout adapts from 320 px (single-column stacked) to 1920 px (multi-column)
    - _Requirements: 7.1, 7.4, 2.2_

  - [ ] 7.3 Style form, list items, and error states in `css/style.css`
    - Style `#transaction-form` inputs, select, and submit button with clear focus indicators
    - Style `#transaction-list` `<li>` items to show name, amount, category, and delete button in a readable row
    - Style inline error `<span>` elements (e.g., red colour, small font) so they are visually distinct
    - Ensure colour contrast meets WCAG AA for all text
    - _Requirements: 1.4, 7.4_

- [ ] 8. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property-based tests use `fast-check`; unit tests can use Vitest or plain `assert` in Node.js
- The chart instance is created once in `initChart()` and mutated in-place by `updateChart()` — never recreated
- Event delegation on `#transaction-list` means delete handlers don't need to be re-attached on each render
- Checkpoints at Tasks 5 and 8 validate incremental progress before moving to the next phase

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1"] },
    { "id": 1, "tasks": ["2.2", "2.3"] },
    { "id": 2, "tasks": ["3.1"] },
    { "id": 3, "tasks": ["3.2", "3.3", "4.1"] },
    { "id": 4, "tasks": ["4.2", "4.3", "4.6"] },
    { "id": 5, "tasks": ["4.4", "4.5", "4.7"] },
    { "id": 6, "tasks": ["6.1", "7.1"] },
    { "id": 7, "tasks": ["6.2", "6.3", "7.2"] },
    { "id": 8, "tasks": ["6.4", "6.5", "7.3"] }
  ]
}
```
