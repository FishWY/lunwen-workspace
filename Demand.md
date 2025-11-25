I want to build a modern AI Knowledge Workspace web application called "Ponder".
Please act as a Senior Frontend Engineer. Use **React**, **Tailwind CSS**, **Lucide React**, and **React Flow**.

**Project Structure:**
The app has two main views/routes:
1.  **Home Dashboard** (`/`)
2.  **Workspace / Deep Read Interface** (`/workspace`)

---

### 1. Global Design System
-   **Visual Style:** Minimalist, clean, heavy use of rounded corners (`rounded-xl`), white cards on soft gray backgrounds (`bg-gray-50`).
-   **Typography:** Use Sans-serif for UI. Use a high-quality **Serif font** for the main greetings to give a "literary" feel.
-   **Sidebar (Global):** A collapsible left sidebar.
    -   Top: Logo, Collapse button.
    -   Menu: Home, Think, Chat, Space.
    -   Bottom: User profile, Settings, "Upgrade" button.

---

### 2. View: Home Dashboard
-   **Layout:** Centered content.
-   **Hero Section:** Large Serif text: "Hi fishy. Ready to Dive Into Knowledge?".
-   **Main Input:** A large text area container with shadow.
    -   Tabs: "Ponder" / "Chat".
    -   Tools: Web Search toggle, Language selector, Deep Think mode.
-   **Starter Cards:** Two prominent cards below input: "Start with File" (navigates to workspace) and "Writing" (Coming Soon).

---

### 3. View: Workspace (Split Screen)
**Layout:** A split-screen layout (40% Left / 60% Right).

**Left Panel: PDF Viewer**
-   A container mimicking a PDF reader.
-   Header: Filename, Page controls (1/8), Zoom.
-   Content: Placeholder for document pages.

**Right Panel: Infinite Canvas (The "Brain")**
-   **Tech:** Use **React Flow** components.
-   **Background:** Dot pattern.
-   **Content:**
    -   **Right Sidebar:** A vertical timeline/outline showing document structure (e.g., "Abstract", "Methodology").
    -   **Bottom Dock:** Floating toolbar with icons (Docs, Ideas, Search).
    -   **Node Types:**
        1.  **File Node:** Thumbnail of the PDF.
        2.  **Summary Node:** Text summary card.
        3.  **Generation Node:** "AI is writing..." with a loading spinner.
    -   **Interaction (Active State):**
        -   When a node is selected (e.g., the Summary Node), show a **Floating Toolbar** immediately below it.
        -   Toolbar includes: Copy, Link, "Ask AI" button.
        -   **Menu Action:** Clicking "..." on the toolbar opens a Dropdown Menu (white, shadow) with "Delete Branch" and "Delete Node" options.

---

### Implementation Goals
-   Please set up the basic routing.
-   Ensure the Split View is responsive.
-   Mock the "Active Node" state in React Flow to demonstrate the floating menu interaction.