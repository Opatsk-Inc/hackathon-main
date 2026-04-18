export const ROUTES = {
  HEAD: {
    DASHBOARD: '/head/dashboard',
    IMPORT: '/head/import',
    DISCREPANCIES: '/head/discrepancies',
    TASKS: '/head/tasks',
  },
  INSPECTOR: {
    TASKS: '/inspector/tasks',
    TASK_DETAIL: '/inspector/tasks/:taskId',
  },
} as const;
