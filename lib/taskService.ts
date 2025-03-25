import { db } from './firebase';
import { collection, query, where, orderBy, addDoc, updateDoc, deleteDoc, doc, getDoc, getDocs, Timestamp, serverTimestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { Task, TaskStatus, TaskPriority, Meal, Sleep, WaterIntake, ScheduleItem, RecurrencePattern } from './types';
import { compareAsc, parseISO, format, isToday, addDays, isBefore, isSameDay, startOfDay, endOfDay } from 'date-fns';

// Collection references
const tasksCollection = 'tasks';
const mealsCollection = 'meals';
const sleepCollection = 'sleep';
const waterIntakeCollection = 'waterIntake';
const scheduleCollection = 'schedules';

// Get tasks by user ID and status
export async function getTasksByStatus(userId: string, status?: TaskStatus): Promise<Task[]> {
  try {
    let q = query(
      collection(db, tasksCollection),
      where('userId', '==', userId),
      orderBy('deadline', 'asc')
    );
    
    if (status) {
      q = query(
        collection(db, tasksCollection),
        where('userId', '==', userId),
        where('status', '==', status),
        orderBy('deadline', 'asc')
      );
    }
    
    const snapshot = await getDocs(q);
    const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
    
    // Filter out recurring tasks that aren't for today unless they are already in progress or completed
    return tasks.filter(task => {
      if (!task.isRecurring) return true;
      if (status === 'in-progress' || status === 'completed') return true;
      
      // For todo tasks, only show if it's scheduled for today or overdue
      const taskDate = parseISO(task.deadline);
      return isToday(taskDate) || isBefore(taskDate, new Date());
    });
  } catch (error) {
    console.error('Error getting tasks by status:', error);
    throw error;
  }
}

// Add a new task
export async function createTask(taskData: Omit<Task, 'id' | 'createdAt'>): Promise<Task> {
  try {
    const newTask = {
      ...taskData,
      createdAt: new Date().toISOString(),
      type: taskData.type || 'task'
    };
    
    const docRef = await addDoc(collection(db, tasksCollection), newTask);
    return { id: docRef.id, ...newTask };
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
}

// Update a task
export async function updateTask(taskId: string, taskData: Partial<Task>): Promise<void> {
  try {
    const taskRef = doc(db, tasksCollection, taskId);
    
    // If status is being updated to 'completed', set completedAt
    if (taskData.status === 'completed' && !taskData.completedAt) {
      taskData.completedAt = new Date().toISOString();
    }
    
    await updateDoc(taskRef, taskData);
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
}

// Delete a task
export async function deleteTask(taskId: string): Promise<void> {
  try {
    const taskRef = doc(db, tasksCollection, taskId);
    await deleteDoc(taskRef);
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
}

// Get a task by ID
export async function getTaskById(taskId: string): Promise<Task | null> {
  try {
    const taskRef = doc(db, tasksCollection, taskId);
    const taskSnap = await getDoc(taskRef);
    
    if (taskSnap.exists()) {
      return { id: taskSnap.id, ...taskSnap.data() } as Task;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting task by ID:', error);
    throw error;
  }
}

// Get tasks with approaching deadlines (next 24 hours)
export async function getUpcomingTasks(userId: string): Promise<Task[]> {
  try {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const tasks = await getTasksByStatus(userId);
    
    return tasks.filter(task => {
      const deadlineDate = parseISO(task.deadline);
      return (
        task.status !== 'completed' &&
        compareAsc(deadlineDate, now) >= 0 &&
        compareAsc(deadlineDate, tomorrow) <= 0
      );
    });
  } catch (error) {
    console.error('Error getting upcoming tasks:', error);
    throw error;
  }
}

// Get tasks by priority
export async function getTasksByPriority(userId: string, priority: TaskPriority): Promise<Task[]> {
  try {
    const q = query(
      collection(db, tasksCollection),
      where('userId', '==', userId),
      where('priority', '==', priority),
      where('status', '!=', 'completed'),
      orderBy('status'),
      orderBy('deadline', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
  } catch (error) {
    console.error('Error getting tasks by priority:', error);
    throw error;
  }
}

// Handle recurring task creation
export async function processRecurringTasks(userId: string): Promise<void> {
  try {
    const today = format(new Date(), 'yyyy-MM-dd');
    const startOfToday = startOfDay(new Date()).toISOString();
    const endOfToday = endOfDay(new Date()).toISOString();
    
    // Process regular tasks
    const taskQuery = query(
      collection(db, tasksCollection),
      where('userId', '==', userId),
      where('isRecurring', '==', true),
      where('isActive', '==', true)
    );
    
    const taskSnapshot = await getDocs(taskQuery);
    const recurringTasks = taskSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Task[];
    
    for (const task of recurringTasks) {
      await processRecurringItem(task, tasksCollection, userId, today, startOfToday, endOfToday);
    }
    
    // Process meals
    const mealQuery = query(
      collection(db, mealsCollection),
      where('userId', '==', userId),
      where('isRecurring', '==', true)
    );
    
    const mealSnapshot = await getDocs(mealQuery);
    const recurringMeals = mealSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Meal[];
    
    for (const meal of recurringMeals) {
      await processRecurringMeal(meal, userId, today);
    }
    
    // Process sleep schedule
    const sleepQuery = query(
      collection(db, sleepCollection),
      where('userId', '==', userId),
      where('isRecurring', '==', true)
    );
    
    const sleepSnapshot = await getDocs(sleepQuery);
    const recurringSleep = sleepSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Sleep[];
    
    for (const sleep of recurringSleep) {
      await processRecurringSleep(sleep, userId, today);
    }
    
    // Process water intake
    const waterQuery = query(
      collection(db, waterIntakeCollection),
      where('userId', '==', userId),
      where('isRecurring', '==', true)
    );
    
    const waterSnapshot = await getDocs(waterQuery);
    const recurringWater = waterSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as WaterIntake[];
    
    for (const water of recurringWater) {
      await processRecurringWater(water, userId, today);
    }
    
    // Process schedules
    const scheduleQuery = query(
      collection(db, scheduleCollection),
      where('userId', '==', userId),
      where('isRecurring', '==', true)
    );
    
    const scheduleSnapshot = await getDocs(scheduleQuery);
    const recurringSchedules = scheduleSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ScheduleItem[];
    
    for (const schedule of recurringSchedules) {
      await processRecurringSchedule(schedule, userId, today);
    }
    
  } catch (error) {
    console.error('Error processing recurring tasks:', error);
    throw error;
  }
}

// Helper function to process a recurring item
async function processRecurringItem(item: any, collectionName: string, userId: string, today: string, startOfToday: string, endOfToday: string): Promise<void> {
  try {
    // Check if we need to create a new instance based on recurrence pattern
    if (!item.recurrencePattern) return;
    
    const pattern = item.recurrencePattern;
    const itemDate = parseISO(item.deadline || item.date || item.startTime || new Date().toISOString());
    
    // Calculate if today is a day to create a new instance based on frequency and interval
    let shouldCreate = false;
    const interval = pattern.interval || 1;
    
    switch (pattern.frequency) {
      case 'daily':
        shouldCreate = true; // Daily always creates a new instance
        break;
      case 'weekly':
        // Check if today is the same day of week as the original task
        shouldCreate = itemDate.getDay() === new Date().getDay();
        break;
      case 'monthly':
        // Check if today is the same day of month as the original task
        shouldCreate = itemDate.getDate() === new Date().getDate();
        break;
    }
    
    if (!shouldCreate) return;
    
    // Check if this task already exists for today
    const existingQuery = query(
      collection(db, collectionName),
      where('userId', '==', userId),
      where('title', '==', item.title)
    );
    
    if (item.type === 'task') {
      // For tasks, check if there's already a todo task for today
      const startOfTodayDate = startOfDay(new Date());
      const endOfTodayDate = endOfDay(new Date());
      
      const existingTaskQuery = query(
        collection(db, collectionName),
        where('userId', '==', userId),
        where('title', '==', item.title),
        where('status', '==', 'todo'),
        where('deadline', '>=', startOfTodayDate.toISOString()),
        where('deadline', '<=', endOfTodayDate.toISOString()),
        where('isRecurring', '==', false)
      );
      
      const existingTaskSnapshot = await getDocs(existingTaskQuery);
      
      if (existingTaskSnapshot.empty) {
        // Create a new instance for today
        const newTaskData = {
          title: item.title,
          description: item.description || '',
          status: 'todo' as TaskStatus,
          priority: item.priority || 'medium',
          deadline: format(new Date(), 'yyyy-MM-dd') + 'T' + itemDate.toISOString().split('T')[1],
          userId: userId,
          isRecurring: false,
          completedAt: null,
          type: item.type || 'task',
          createdAt: new Date().toISOString()
        };
        
        await addDoc(collection(db, collectionName), newTaskData);
      }
    }
  } catch (error) {
    console.error('Error processing recurring item:', error);
    throw error;
  }
}

// Process recurring meal
async function processRecurringMeal(meal: Meal, userId: string, today: string): Promise<void> {
  try {
    if (!meal.isRecurring) return;

    let shouldCreate = false;
    const currentDate = new Date();
    const currentDayOfWeek = currentDate.getDay();
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    // Check if meal has day schedule
    if (meal.daySchedule && meal.daySchedule.length > 0) {
      // Check if today's day of week is enabled in the schedule
      const todaySchedule = meal.daySchedule.find(
        schedule => schedule.dayOfWeek === daysOfWeek[currentDayOfWeek]
      );
      shouldCreate = todaySchedule?.enabled || false;
    } else if (meal.recurrencePattern) {
      // Fall back to regular recurrence pattern if no day schedule
      const pattern = meal.recurrencePattern;
      const mealDate = parseISO(meal.date);
      const interval = pattern.interval || 1;
      
      switch (pattern.frequency) {
        case 'daily':
          shouldCreate = true;
          break;
        case 'weekly':
          shouldCreate = mealDate.getDay() === currentDate.getDay();
          break;
        case 'monthly':
          shouldCreate = mealDate.getDate() === currentDate.getDate();
          break;
      }
    }
    
    if (!shouldCreate) return;
    
    // Check if this meal already exists for today
    const existingMealQuery = query(
      collection(db, mealsCollection),
      where('userId', '==', userId),
      where('title', '==', meal.title),
      where('date', '==', today)
    );
    
    const existingMealSnapshot = await getDocs(existingMealQuery);
    
    if (existingMealSnapshot.empty) {
      // Create a new meal instance for today
      const newMealData = {
        title: meal.title,
        description: meal.description,
        time: meal.time,
        date: today,
        calories: meal.calories,
        userId: userId,
        isRecurring: false,
        mealType: meal.mealType || 'regular',
        createdAt: new Date().toISOString()
      };
      
      await addDoc(collection(db, mealsCollection), newMealData);
      
      // Also create a task for this meal so it appears in the Kanban board
      const mealTitle = meal.mealType === 'supplement' 
        ? `Supplement: ${meal.title}` 
        : `Meal: ${meal.title}`;
      
      const mealTaskData = {
        title: mealTitle,
        description: meal.description || '',
        status: 'todo' as TaskStatus,
        priority: meal.mealType === 'supplement' ? 'medium' as TaskPriority : 'high' as TaskPriority,
        deadline: today + 'T' + meal.time.split('T')[1],
        userId: userId,
        isRecurring: false,
        completedAt: null,
        type: 'meal',
        createdAt: new Date().toISOString()
      };
      
      await addDoc(collection(db, tasksCollection), mealTaskData);
    }
  } catch (error) {
    console.error('Error processing recurring meal:', error);
    throw error;
  }
}

// Process recurring sleep schedule
async function processRecurringSleep(sleep: Sleep, userId: string, today: string): Promise<void> {
  try {
    if (!sleep.recurrencePattern) return;
    
    const pattern = sleep.recurrencePattern;
    const sleepDate = parseISO(sleep.date);
    
    // Calculate if today is a day to create a new sleep instance
    let shouldCreate = false;
    const interval = pattern.interval || 1;
    
    switch (pattern.frequency) {
      case 'daily':
        shouldCreate = true;
        break;
      case 'weekly':
        shouldCreate = sleepDate.getDay() === new Date().getDay();
        break;
      case 'monthly':
        shouldCreate = sleepDate.getDate() === new Date().getDate();
        break;
    }
    
    if (!shouldCreate) return;
    
    // Check if sleep record already exists for today
    const existingSleepQuery = query(
      collection(db, sleepCollection),
      where('userId', '==', userId),
      where('date', '==', today)
    );
    
    const existingSleepSnapshot = await getDocs(existingSleepQuery);
    
    if (existingSleepSnapshot.empty) {
      // Create a new sleep instance for today
      const newSleepData = {
        bedTime: sleep.bedTime,
        wakeTime: sleep.wakeTime,
        date: today,
        userId: userId,
        isRecurring: false,
        createdAt: new Date().toISOString()
      };
      
      await addDoc(collection(db, sleepCollection), newSleepData);
      
      // Create bedtime task for Kanban board
      const bedtimeTaskData = {
        title: 'Bedtime',
        description: `Time to sleep`,
        status: 'todo' as TaskStatus,
        priority: 'high' as TaskPriority,
        deadline: today + 'T' + sleep.bedTime.split('T')[1],
        userId: userId,
        isRecurring: false,
        completedAt: null,
        type: 'sleep',
        createdAt: new Date().toISOString()
      };
      
      await addDoc(collection(db, tasksCollection), bedtimeTaskData);
    }
  } catch (error) {
    console.error('Error processing recurring sleep:', error);
    throw error;
  }
}

// Process recurring water intake
async function processRecurringWater(water: WaterIntake, userId: string, today: string): Promise<void> {
  try {
    if (!water.recurrencePattern) return;
    
    const pattern = water.recurrencePattern;
    const waterDate = parseISO(water.date);
    
    // Calculate if today is a day to create a new water intake instance
    let shouldCreate = false;
    const interval = pattern.interval || 1;
    
    switch (pattern.frequency) {
      case 'daily':
        shouldCreate = true;
        break;
      case 'weekly':
        shouldCreate = waterDate.getDay() === new Date().getDay();
        break;
      case 'monthly':
        shouldCreate = waterDate.getDate() === new Date().getDate();
        break;
    }
    
    if (!shouldCreate) return;
    
    // Check if water intake already exists for today
    const existingWaterQuery = query(
      collection(db, waterIntakeCollection),
      where('userId', '==', userId),
      where('date', '==', today),
      where('time', '==', water.time)
    );
    
    const existingWaterSnapshot = await getDocs(existingWaterQuery);
    
    if (existingWaterSnapshot.empty) {
      // Create a new water intake instance for today
      const newWaterData = {
        amount: water.amount,
        time: water.time,
        date: today,
        userId: userId,
        isRecurring: false,
        createdAt: new Date().toISOString()
      };
      
      await addDoc(collection(db, waterIntakeCollection), newWaterData);
      
      // Create water intake task for Kanban board
      const waterTaskData = {
        title: `Drink Water (${water.amount}ml)`,
        description: `Remember to stay hydrated!`,
        status: 'todo' as TaskStatus,
        priority: 'medium' as TaskPriority,
        deadline: today + 'T' + water.time.split('T')[1],
        userId: userId,
        isRecurring: false,
        completedAt: null,
        type: 'water',
        createdAt: new Date().toISOString()
      };
      
      await addDoc(collection(db, tasksCollection), waterTaskData);
    }
  } catch (error) {
    console.error('Error processing recurring water intake:', error);
    throw error;
  }
}

// Process recurring schedule
async function processRecurringSchedule(schedule: ScheduleItem, userId: string, today: string): Promise<void> {
  try {
    if (!schedule.recurrencePattern) return;
    
    const pattern = schedule.recurrencePattern;
    const scheduleDate = parseISO(schedule.date);
    
    // Calculate if today is a day to create a new schedule instance
    let shouldCreate = false;
    const interval = pattern.interval || 1;
    
    switch (pattern.frequency) {
      case 'daily':
        shouldCreate = true;
        break;
      case 'weekly':
        shouldCreate = scheduleDate.getDay() === new Date().getDay();
        break;
      case 'monthly':
        shouldCreate = scheduleDate.getDate() === new Date().getDate();
        break;
    }
    
    if (!shouldCreate) return;
    
    // Check if schedule already exists for today
    const existingScheduleQuery = query(
      collection(db, scheduleCollection),
      where('userId', '==', userId),
      where('title', '==', schedule.title),
      where('date', '==', today)
    );
    
    const existingScheduleSnapshot = await getDocs(existingScheduleQuery);
    
    if (existingScheduleSnapshot.empty) {
      // Create a new schedule instance for today
      const newScheduleData = {
        title: schedule.title,
        description: schedule.description,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        date: today,
        location: schedule.location,
        userId: userId,
        isRecurring: false,
        createdAt: new Date().toISOString()
      };
      
      await addDoc(collection(db, scheduleCollection), newScheduleData);
      
      // Create schedule task for Kanban board
      const scheduleTaskData = {
        title: schedule.title,
        description: `${schedule.description}${schedule.location ? ` @ ${schedule.location}` : ''}`,
        status: 'todo' as TaskStatus,
        priority: 'medium' as TaskPriority,
        deadline: today + 'T' + schedule.startTime.split('T')[1],
        userId: userId,
        isRecurring: false,
        completedAt: null,
        type: 'schedule',
        location: schedule.location,
        createdAt: new Date().toISOString()
      };
      
      await addDoc(collection(db, tasksCollection), scheduleTaskData);
    }
  } catch (error) {
    console.error('Error processing recurring schedule:', error);
    throw error;
  }
}

// CRUD operations for meals
export async function createMeal(mealData: Omit<Meal, 'id' | 'createdAt'>): Promise<Meal> {
  try {
    const newMeal = {
      ...mealData,
      createdAt: new Date().toISOString()
    };
    
    const docRef = await addDoc(collection(db, mealsCollection), newMeal);
    
    // If not recurring or if it's for today's day of week, create a task
    const currentDayOfWeek = new Date().getDay();
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const shouldCreateTask = !newMeal.isRecurring || 
      (newMeal.daySchedule?.some(schedule => 
        schedule.dayOfWeek === daysOfWeek[currentDayOfWeek] && schedule.enabled
      ));
    
    if (shouldCreateTask) {
      const mealTitle = newMeal.mealType === 'supplement' 
        ? `Supplement: ${newMeal.title}` 
        : `Meal: ${newMeal.title}`;
      
      const mealTaskData = {
        title: mealTitle,
        description: newMeal.description || '',
        status: 'todo' as TaskStatus,
        priority: newMeal.mealType === 'supplement' ? 'medium' as TaskPriority : 'high' as TaskPriority,
        deadline: newMeal.date + 'T' + newMeal.time.split('T')[1],
        userId: newMeal.userId,
        isRecurring: false,
        completedAt: null,
        type: 'meal',
        createdAt: new Date().toISOString()
      };
      
      await addDoc(collection(db, tasksCollection), mealTaskData);
    }
    
    return { id: docRef.id, ...newMeal };
  } catch (error) {
    console.error('Error creating meal:', error);
    throw error;
  }
}

// CRUD operations for sleep
export async function createSleep(sleepData: Omit<Sleep, 'id' | 'createdAt'>): Promise<Sleep> {
  try {
    const newSleep = {
      ...sleepData,
      createdAt: new Date().toISOString()
    };
    
    const docRef = await addDoc(collection(db, sleepCollection), newSleep);
    
    // If not recurring, also create a task for bedtime
    if (!newSleep.isRecurring) {
      const bedtimeTaskData = {
        title: 'Bedtime',
        description: `Time to sleep`,
        status: 'todo' as TaskStatus,
        priority: 'high' as TaskPriority,
        deadline: newSleep.date + 'T' + newSleep.bedTime.split('T')[1],
        userId: newSleep.userId,
        isRecurring: false,
        completedAt: null,
        type: 'sleep',
        createdAt: new Date().toISOString()
      };
      
      await addDoc(collection(db, tasksCollection), bedtimeTaskData);
    }
    
    return { id: docRef.id, ...newSleep };
  } catch (error) {
    console.error('Error creating sleep record:', error);
    throw error;
  }
}

// CRUD operations for water intake
export async function createWaterIntake(waterData: Omit<WaterIntake, 'id' | 'createdAt'>): Promise<WaterIntake> {
  try {
    const newWater = {
      ...waterData,
      createdAt: new Date().toISOString()
    };
    
    const docRef = await addDoc(collection(db, waterIntakeCollection), newWater);
    
    // If not recurring, also create a task for water intake
    if (!newWater.isRecurring) {
      const waterTaskData = {
        title: `Drink Water (${newWater.amount}ml)`,
        description: `Remember to stay hydrated!`,
        status: 'todo' as TaskStatus,
        priority: 'medium' as TaskPriority,
        deadline: newWater.date + 'T' + newWater.time.split('T')[1],
        userId: newWater.userId,
        isRecurring: false,
        completedAt: null,
        type: 'water',
        createdAt: new Date().toISOString()
      };
      
      await addDoc(collection(db, tasksCollection), waterTaskData);
    }
    
    return { id: docRef.id, ...newWater };
  } catch (error) {
    console.error('Error creating water intake record:', error);
    throw error;
  }
}

// CRUD operations for schedules
export async function createSchedule(scheduleData: Omit<ScheduleItem, 'id' | 'createdAt'>): Promise<ScheduleItem> {
  try {
    // Ensure location is a string or null, not undefined
    const newSchedule = {
      ...scheduleData,
      location: scheduleData.location || null,
      createdAt: new Date().toISOString()
    };
    
    const docRef = await addDoc(collection(db, scheduleCollection), newSchedule);
    
    // If not recurring, also create a task for this schedule item
    if (!newSchedule.isRecurring) {
      const scheduleTaskData = {
        title: newSchedule.title,
        description: newSchedule.description || '',
        status: 'todo' as TaskStatus,
        priority: 'medium' as TaskPriority,
        deadline: newSchedule.date + 'T' + newSchedule.startTime.split('T')[1],
        userId: newSchedule.userId,
        isRecurring: false,
        completedAt: null,
        type: 'schedule',
        location: newSchedule.location,
        createdAt: new Date().toISOString()
      };
      
      await addDoc(collection(db, tasksCollection), scheduleTaskData);
    }
    
    return { id: docRef.id, ...newSchedule };
  } catch (error) {
    console.error('Error creating schedule item:', error);
    throw error;
  }
} 