export type TaskStatus = 'todo' | 'in-progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskType = 'task' | 'meal' | 'water' | 'schedule';

export interface RecurrencePattern {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval?: number;
  endDate?: string;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  deadline: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  isRecurring?: boolean;
  isActive?: boolean;
  recurrencePattern?: RecurrencePattern;
  tags?: string[];
}

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface MealSchedule {
  dayOfWeek: DayOfWeek;
  enabled: boolean;
}

export interface Meal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  calories?: number;
  time: string;
  date: string;
  mealType?: 'regular' | 'supplement';
  isRecurring?: boolean;
  recurrencePattern?: RecurrencePattern;
  daySchedule?: MealSchedule[];
  createdAt: string;
}

export interface Sleep {
  id: string;
  userId: string;
  bedTime: string; // ISO string for start time
  wakeTime: string; // ISO string for end time
  date: string; // ISO string for the day
  quality?: 'poor' | 'fair' | 'good' | 'excellent';
  isRecurring?: boolean;
  recurrencePattern?: RecurrencePattern;
  createdAt: string;
}

export interface WaterIntake {
  id: string;
  userId: string;
  amount: number; // in ml
  time: string; // ISO string
  date: string; // ISO string
  isRecurring?: boolean;
  recurrencePattern?: RecurrencePattern;
  createdAt: string;
}

export interface ScheduleItem {
  id: string;
  userId: string;
  title: string;
  description?: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  date: string; // ISO string
  location?: string;
  isRecurring?: boolean;
  recurrencePattern?: RecurrencePattern;
  createdAt: string;
}

export interface TimeRecord {
  id: string;
  userId: string;
  date: string; // ISO date string
  startTime: string;
  endTime: string;
  duration: number; // in minutes
  category: string;
  description: string;
  tags?: string[];
}

export interface DailyLog {
  id: string;
  userId: string;
  date: string; // ISO date string
  wakeUpTime?: string; // ISO date string for wake up time
  totalWorkTime: number; // in minutes
  totalBreakTime: number; // in minutes
  records: TimeRecord[];
  notes: string;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: string; // ISO string format
}

export interface PerformanceMetric {
  id: string;
  userId: string;
  date: string; // ISO date string
  taskCompletionRate: number; // percentage
  focusedTime: number; // in minutes
  productivityScore: number; // 0-100
  breakTime: number; // in minutes
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
}

export interface PerformanceMetrics {
  totalTasksCreated: number;
  totalTasksCompleted: number;
  completionRate: number; // percentage
  avgCompletionTime: number; // in hours
  tasksCompletedByPriority: {
    high: number;
    medium: number;
    low: number;
  };
  deadlinesMissed: number;
  avgSleepDuration?: number; // in hours
  avgWorkDuration?: number; // in hours
} 