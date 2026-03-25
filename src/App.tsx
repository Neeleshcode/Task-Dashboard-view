// ─────────────────────────────────────────────────────────
//  App entry point
//
//  Tree structure:
//    <AppProvider>        — global state (React Context + useReducer)
//      <AppContent>
//        <Header>         — view switcher + collaborator presence
//        <FilterPanel>    — sidebar filters (synced to URL)
//        <KanbanView>  ┐
//        <ListView>    ├─ only the active view is mounted
//        <TimelineView>┘
// ─────────────────────────────────────────────────────────

import { AppProvider, useApp } from "./context/AppContext";
import { Header }       from "./components/Header";
import { FilterPanel }  from "./components/FilterPanel";
import { KanbanView }   from "./views/KanbanView";
import { ListView }     from "./views/ListView";
import { TimelineView } from "./views/TimelineView";

/** Inner shell — consumes global state to decide which view to render. */
function AppContent() {
  const { state } = useApp();

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Top navigation bar */}
      <Header />

      <div className="flex flex-1 gap-4 p-4 overflow-hidden min-h-0">
        {/* Sidebar filter panel */}
        <aside className="flex-shrink-0 w-64">
          <FilterPanel />
        </aside>

        {/* Main content area — renders the active view */}
        <main className="flex-1 overflow-hidden min-w-0">
          {state.view === "kanban"   && <KanbanView />}
          {state.view === "list"     && <ListView />}
          {state.view === "timeline" && <TimelineView />}
        </main>
      </div>
    </div>
  );
}

/** Root component — wraps everything in the global state provider. */
function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
