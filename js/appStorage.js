import { FirebaseClient } from "./firebaseClient.js";

const AppStorage = {
  async save(path, data) {
    const online = navigator.onLine;
    if (online) {
      const ok = await FirebaseClient.save(path, data);
      if (ok) return;
    }

    console.warn("⚠ Using localStorage fallback for save:", path);
    localStorage.setItem(path, JSON.stringify(data));
  },

  async load(path) {
    const online = navigator.onLine;
    if (online) {
      const result = await FirebaseClient.load(path);
      if (result !== null) return result;
    }

    console.warn("⚠ Using localStorage fallback for load:", path);
    const raw = localStorage.getItem(path);
    return raw ? JSON.parse(raw) : null;
  },

  async remove(path) {
    const online = navigator.onLine;
    if (online) {
      const ok = await FirebaseClient.remove(path);
      if (ok) return;
    }

    console.warn("⚠ Using localStorage fallback for remove:", path);
    localStorage.removeItem(path);
  },

  // Migration function to move localStorage data to Firebase
  async migrateLocalStorageToFirebase() {
    // Check if migration already done
    const migrationDone = localStorage.getItem('firebase_migration_done');
    if (migrationDone) {
      console.log('Firebase migration already completed');
      return;
    }

    console.log('Starting Firebase migration...');

    const migrationData = {
      // MoodSense data
      'mood-sense/moodHistory': localStorage.getItem('moodHistory'),
      'mood-sense/chatHistory': localStorage.getItem('chatHistory'),
      'mood-sense/activitiesCompleted': localStorage.getItem('activitiesCompleted'),
      'mood-sense/songsExplored': localStorage.getItem('songsExplored'),
      'mood-sense/journalEntries': localStorage.getItem('journalEntries'),

      // Todo data
      'todo/tasks': localStorage.getItem('tasks_data'),
      'todo/schedule': localStorage.getItem('todo_schedule_today_v1'),
      'todo/kanban': localStorage.getItem('todo_kanban_state_v1'),
      'todo/focus': localStorage.getItem('todo_focus_stats_v1'),
      'todo/ai': localStorage.getItem('todo_ai_insights_v1'),

      // Magazine data
      'magazine/autosave': localStorage.getItem('magazine_autosave'),
      'magazine/state': localStorage.getItem('magazine_state'),
      'magazine/design': localStorage.getItem('magazine_design'),
      'magazine/state_v2': localStorage.getItem('magazine_state_v2'),

      // Poster data
      'poster/project': localStorage.getItem('posterDesignerProject'),
      'poster/design': localStorage.getItem('poster_design'),

      // Certificate data
      'certificate/state': localStorage.getItem('cg.state.v2'),

      // Event Planner data
      'event-planner/preferences': localStorage.getItem('uiPreferences'),
      'event-planner/state': localStorage.getItem('eventPlannerState'),
      'event-planner/currentEvent': localStorage.getItem('currentEventId'),

      // Activity Report data
      'activity-report/draft': localStorage.getItem('report_draft'),
      'activity-report/templates': localStorage.getItem('customTemplates'),

      // Dashboard data
      'dashboard/sidebarCollapsed': localStorage.getItem('sidebarCollapsed'),

      // Theme data
      'theme': localStorage.getItem('theme'),

      // Auth data (keep local only)
      // 'auth/session': localStorage.getItem('cs.session'), // Don't migrate session
    };

    let migratedCount = 0;
    for (const [path, rawData] of Object.entries(migrationData)) {
      if (rawData) {
        try {
          const data = JSON.parse(rawData);
          const success = await FirebaseClient.save(path, data);
          if (success) {
            migratedCount++;
            console.log(`Migrated: ${path}`);
          } else {
            console.warn(`Failed to migrate: ${path}`);
          }
        } catch (e) {
          console.warn(`Error parsing data for ${path}:`, e);
        }
      }
    }

    if (migratedCount > 0) {
      // Mark migration as done
      localStorage.setItem('firebase_migration_done', 'true');
      console.log(`Firebase migration completed! Migrated ${migratedCount} data items.`);
    } else {
      console.log('No data to migrate or migration failed.');
    }
  }
};

export default AppStorage;

// Make available globally for non-module scripts
window.AppStorage = AppStorage;