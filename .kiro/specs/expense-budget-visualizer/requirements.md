# Requirements Document

## Introduction

The Expense & Budget Visualizer is a client-side web application built with HTML, CSS, and Vanilla JavaScript. It allows users to track personal expenses by adding transactions with a name, amount, and category. The app displays a running total balance, a scrollable transaction list with delete capability, and a live-updating pie chart that visualizes spending distribution by category. All data is persisted in the browser's Local Storage with no backend server required.

## Glossary

- **App**: The Expense & Budget Visualizer web application running in the browser.
- **Transaction**: A single expense entry consisting of an item name, a monetary amount, and a category.
- **Category**: A classification label for a transaction. Supported values: Food, Transport, Fun.
- **Transaction_List**: The scrollable UI component that renders all stored transactions.
- **Balance_Display**: The UI element at the top of the page that shows the current total of all transaction amounts.
- **Input_Form**: The HTML form through which users create new transactions.
- **Pie_Chart**: The visual chart component that shows spending distribution across categories.
- **Local_Storage**: The browser's Web Storage API used as the sole persistence mechanism.
- **Validator**: The client-side logic component responsible for validating Input_Form field values before submission.

---

## Requirements

### Requirement 1: Transaction Input Form

**User Story:** As a user, I want to fill in a form with an item name, amount, and category so that I can record a new expense transaction.

#### Acceptance Criteria

1. THE Input_Form SHALL provide a text field for the item name, a numeric field for the amount, and a dropdown selector for the category with options: Food, Transport, and Fun.
2. WHEN the user submits the Input_Form with all fields filled and a valid positive numeric amount, THE App SHALL add the new Transaction to the Transaction_List and persist it to Local_Storage.
3. WHEN the user submits the Input_Form, THE Validator SHALL verify that the item name field is not empty, the amount field contains a positive number greater than zero, and a category is selected.
4. IF the Validator detects that any required field is empty or the amount is not a positive number, THEN THE Input_Form SHALL display an inline error message identifying the invalid field and SHALL NOT add the Transaction.
5. WHEN a Transaction is successfully added, THE Input_Form SHALL reset all fields to their default empty or placeholder state.

---

### Requirement 2: Transaction List Display

**User Story:** As a user, I want to see all my recorded transactions in a scrollable list so that I can review my spending history.

#### Acceptance Criteria

1. THE Transaction_List SHALL display all stored transactions, each showing the item name, amount (formatted as currency), and category.
2. WHEN the number of transactions exceeds the visible area, THE Transaction_List SHALL be scrollable without affecting the rest of the page layout.
3. THE Transaction_List SHALL render transactions in the order they were added, with the most recently added transaction appearing at the top of the list.
4. WHEN the App loads in the browser, THE Transaction_List SHALL populate with all transactions previously saved in Local_Storage.

---

### Requirement 3: Delete Transaction

**User Story:** As a user, I want to delete a transaction from the list so that I can correct mistakes or remove outdated entries.

#### Acceptance Criteria

1. THE Transaction_List SHALL display a delete control for each Transaction entry.
2. WHEN the user activates the delete control for a Transaction, THE App SHALL remove that Transaction from Local_Storage and re-render the Transaction_List without the deleted entry.
3. WHEN a Transaction is deleted, THE Balance_Display SHALL update to reflect the new total within the same rendering cycle.
4. WHEN a Transaction is deleted, THE Pie_Chart SHALL update to reflect the new category distribution within the same rendering cycle.

---

### Requirement 4: Total Balance Display

**User Story:** As a user, I want to see my total spending balance at the top of the page so that I always know my cumulative expense amount at a glance.

#### Acceptance Criteria

1. THE Balance_Display SHALL show the sum of all Transaction amounts, formatted as a currency value, at the top of the page.
2. WHEN a new Transaction is added, THE Balance_Display SHALL update to the new total without requiring a page reload.
3. WHEN a Transaction is deleted, THE Balance_Display SHALL update to the new total without requiring a page reload.
4. WHEN no transactions exist, THE Balance_Display SHALL show a total of zero formatted as currency.

---

### Requirement 5: Pie Chart Visualization

**User Story:** As a user, I want to see a pie chart of my spending by category so that I can understand where my money is going at a glance.

#### Acceptance Criteria

1. THE Pie_Chart SHALL display each category (Food, Transport, Fun) as a proportional slice representing that category's share of the total transaction amount.
2. WHEN a new Transaction is added, THE Pie_Chart SHALL re-render to reflect the updated category distribution without requiring a page reload.
3. WHEN a Transaction is deleted, THE Pie_Chart SHALL re-render to reflect the updated category distribution without requiring a page reload.
4. WHEN all transactions belong to a single category, THE Pie_Chart SHALL render that category as a full circle occupying 100% of the chart area.
5. WHEN no transactions exist, THE Pie_Chart SHALL display an empty or placeholder state indicating that no data is available.
6. THE Pie_Chart SHALL display a legend or labels that associate each color-coded slice with its corresponding category name.

---

### Requirement 6: Data Persistence

**User Story:** As a user, I want my transactions to be saved between browser sessions so that I do not lose my expense history when I close or refresh the page.

#### Acceptance Criteria

1. WHEN a Transaction is added, THE App SHALL immediately serialize the full Transaction_List to Local_Storage.
2. WHEN a Transaction is deleted, THE App SHALL immediately serialize the updated Transaction_List to Local_Storage.
3. WHEN the App initializes, THE App SHALL deserialize the Transaction_List from Local_Storage and restore all previously saved transactions before rendering the UI.
4. IF Local_Storage is empty or contains no recognizable transaction data, THEN THE App SHALL initialize with an empty Transaction_List and a zero balance.
5. FOR ALL valid Transaction_List states, serializing to Local_Storage and then deserializing SHALL produce a Transaction_List identical in content and order to the original (round-trip property).

---

### Requirement 7: Responsive and Accessible UI

**User Story:** As a user, I want the application to be easy to read and use across different screen sizes so that I can access it from a desktop or a smaller browser window.

#### Acceptance Criteria

1. THE App SHALL render correctly and remain fully usable on viewport widths between 320px and 1920px.
2. THE App SHALL use a single CSS file located at `css/style.css` for all visual styling.
3. THE App SHALL use a single JavaScript file located at `js/app.js` for all application logic.
4. THE Input_Form, Balance_Display, Transaction_List, and Pie_Chart SHALL maintain a clear visual hierarchy with readable typography at all supported viewport widths.
5. WHEN the App loads, THE App SHALL complete initial rendering in under 2 seconds on a standard broadband connection.

---

### Requirement 8: Browser Compatibility

**User Story:** As a user, I want the application to work in any modern browser so that I am not restricted to a specific environment.

#### Acceptance Criteria

1. THE App SHALL function correctly in the current stable releases of Chrome, Firefox, Edge, and Safari.
2. THE App SHALL operate as a standalone web application without requiring a backend server or build step.
3. THE App SHALL use only browser-native APIs and optionally Chart.js (loaded via CDN) with no other external framework dependencies.
