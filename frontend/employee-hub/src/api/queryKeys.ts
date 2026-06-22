export const queryKeys = {
  employees: ['employees'] as const,
  employee: (id: number) => ['employees', id] as const,

  departments: ['departments'] as const,
  department: (id: number) => ['departments', id] as const,

  positions: ['positions'] as const,
  position: (id: number) => ['positions', id] as const,

  payrolls: ['payrolls'] as const,

  leaves: ['leaves'] as const,

  attendance: ['attendance'] as const,

  announcements: ['announcements'] as const,
  announcement: (id: number) => ['announcements', id] as const,
};