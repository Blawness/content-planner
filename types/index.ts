export type User = {
  id: string
  email: string
}

export type Workspace = {
  id: string
  owner_id: string
  name: string
  created_at: string
}

export type Project = {
  id: string
  workspace_id: string
  name: string
  description: string | null
  start_date: string | null
  end_date: string | null
  created_at?: string
}

export type TaskStatus = 'Backlog' | 'In Progress' | 'Review' | 'Done'

export type Task = {
  id: string
  project_id: string
  title: string
  description: string | null
  status: TaskStatus
  assignee: string | null
  deadline: string | null
  created_at?: string
}

export type TimeEntry = {
  id: string
  task_id: string
  user_id: string
  start_time: string
  end_time: string | null
  duration: number | null
}

export type ContentIdea = {
  title: string
  hook: string
  format: string
  caption_draft?: string
  cta?: string
}

export type ScheduleSlot = {
  day: string
  theme: string
  label?: string
}

export type ContentPlanRow = {
  week_label: string
  date: string
  day: string
  topic: string
  format: string
  headline: string
  visual_description: string
  content_body: string
  hook_caption: string
  scheduled_time: string
  status: string
  notes: string
}

export type AIChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

export type TaskPrediction = {
  predictedHours: number
  confidence: number
}
