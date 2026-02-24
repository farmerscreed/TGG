export const UNIVERSITIES = ['UST', 'IAUE', 'UNIPORT'] as const
export type University = typeof UNIVERSITIES[number]

export const UNIVERSITY_LABELS: Record<University, string> = {
  UST: 'Rivers State University (UST)',
  IAUE: 'Ignatius Ajuru University of Education (IAUE)',
  UNIPORT: 'University of Port Harcourt (UNIPORT)',
}

export const ROLES = ['participant', 'coordinator', 'admin', 'judge'] as const
export type Role = typeof ROLES[number]

export const SUBMISSION_STATUSES = ['draft', 'submitted', 'under_review', 'shortlisted', 'winner', 'not_selected'] as const
export type SubmissionStatus = typeof SUBMISSION_STATUSES[number]

export const STATUS_CONFIG: Record<SubmissionStatus, { label: string; color: string; bgColor: string }> = {
  draft: { label: 'Draft', color: '#9e9e9e', bgColor: '#f5f5f5' },
  submitted: { label: 'Submitted', color: '#1565c0', bgColor: '#e3f2fd' },
  under_review: { label: 'Under Review', color: '#f59e0b', bgColor: '#fffbeb' },
  shortlisted: { label: 'Shortlisted', color: '#7c3aed', bgColor: '#f5f3ff' },
  winner: { label: 'Winner', color: '#16a34a', bgColor: '#f0fdf4' },
  not_selected: { label: 'Not Selected', color: '#dc2626', bgColor: '#fef2f2' },
}

export const GENDERS = ['Male', 'Female', 'Prefer not to say'] as const
export const YEARS_OF_STUDY = ['100L', '200L', '300L', '400L', '500L', 'Postgraduate'] as const

export const BRAND_COLORS = {
  primary: '#1a5c38',
  accent: '#e8f5e9',
  text: '#1a1a1a',
  background: '#ffffff',
} as const

export const SUBMISSION_STEPS = [
  { step: 1, label: 'Project Basics' },
  { step: 2, label: 'The Problem' },
  { step: 3, label: 'Your Solution' },
  { step: 4, label: 'Expected Impact' },
  { step: 5, label: 'Supporting Materials' },
  { step: 6, label: 'Review & Submit' },
] as const

export const MAX_TEAM_SIZE = 5
export const MIN_TEAM_SIZE = 2

export const FILE_LIMITS = {
  document: { maxSizeMB: 10, types: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'], accept: '.pdf,.doc,.docx,.ppt,.pptx', max: 3 },
  image: { maxSizeMB: 5, types: ['image/jpeg', 'image/png'], accept: 'image/jpeg,image/png', max: 5 },
} as const

export const WORD_LIMITS = {
  problem_statement: 500,
  proposed_solution: 800,
  innovation_approach: 300,
  expected_impact: 300,
} as const

export const AUTOSAVE_INTERVAL_MS = 60000 // 60 seconds
