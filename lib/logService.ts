import { db } from './firebase';
import { collection, query, where, orderBy, limit, addDoc, updateDoc, deleteDoc, doc, getDoc, getDocs, Timestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { DailyLog, PerformanceMetrics, Task } from './types';
import { differenceInHours, parseISO, format, differenceInDays } from 'date-fns';
import { getTasksByStatus } from './taskService';

// Collection references
const logsCollection = 'dailyLogs';
const tasksCollection = 'tasks';

// Create or update a daily log
export async function logDailyActivity(userId: string, logData: Partial<DailyLog>): Promise<DailyLog> {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if there's already a log for today
    const q = query(
      collection(db, logsCollection),
      where('userId', '==', userId),
      where('date', '>=', today),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      // Update existing log
      const logId = snapshot.docs[0].id;
      const logRef = doc(db, logsCollection, logId);
      await updateDoc(logRef, logData);
      
      const updatedLog = await getDoc(logRef);
      return { id: updatedLog.id, ...updatedLog.data() } as DailyLog;
    } else {
      // Create new log
      const newLog = {
        userId,
        date: today,
        tasksCompleted: 0,
        ...logData,
      };
      
      const docRef = await addDoc(collection(db, logsCollection), newLog);
      return { id: docRef.id, ...newLog };
    }
  } catch (error) {
    console.error('Error logging daily activity:', error);
    throw error;
  }
}

// Log wake up time
export async function logWakeUpTime(userId: string): Promise<DailyLog> {
  const now = new Date().toISOString();
  return logDailyActivity(userId, { wakeUpTime: now });
}

// Log sleep time
export async function logSleepTime(userId: string): Promise<DailyLog> {
  const now = new Date().toISOString();
  return logDailyActivity(userId, { sleepTime: now });
}

// Log work start time
export async function logWorkStartTime(userId: string): Promise<DailyLog> {
  const now = new Date().toISOString();
  return logDailyActivity(userId, { workStartTime: now });
}

// Log work end time
export async function logWorkEndTime(userId: string): Promise<DailyLog> {
  const now = new Date().toISOString();
  return logDailyActivity(userId, { workEndTime: now });
}

// Get daily log by date
export async function getDailyLog(userId: string, date?: string): Promise<DailyLog | null> {
  try {
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    const q = query(
      collection(db, logsCollection),
      where('userId', '==', userId),
      where('date', '==', targetDate),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as DailyLog;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting daily log:', error);
    throw error;
  }
}

// Calculate performance metrics
export async function calculatePerformanceMetrics(userId: string, days: number = 30): Promise<PerformanceMetrics> {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Get all tasks in the date range
    const tasksQuery = query(
      collection(db, tasksCollection),
      where('userId', '==', userId),
      where('createdAt', '>=', startDate.toISOString()),
      where('createdAt', '<=', endDate.toISOString())
    );
    
    const snapshot = await getDocs(tasksQuery);
    const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
    
    // Get logs for the date range
    const logsQuery = query(
      collection(db, logsCollection),
      where('userId', '==', userId),
      where('date', '>=', startDate.toISOString().split('T')[0]),
      where('date', '<=', endDate.toISOString().split('T')[0]),
      orderBy('date', 'asc')
    );
    
    const logsSnapshot = await getDocs(logsQuery);
    const logs = logsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailyLog));
    
    // Calculate metrics
    const totalTasksCreated = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'completed');
    const totalTasksCompleted = completedTasks.length;
    const completionRate = totalTasksCreated > 0 ? (totalTasksCompleted / totalTasksCreated) * 100 : 0;
    
    // Tasks completed by priority
    const tasksCompletedByPriority = {
      high: completedTasks.filter(task => task.priority === 'high').length,
      medium: completedTasks.filter(task => task.priority === 'medium').length,
      low: completedTasks.filter(task => task.priority === 'low').length,
    };
    
    // Calculate average completion time
    let totalCompletionTime = 0;
    let tasksWithCompletionTime = 0;
    
    for (const task of completedTasks) {
      if (task.completedAt && task.createdAt) {
        const completedAtDate = parseISO(task.completedAt);
        const createdAtDate = parseISO(task.createdAt);
        const completionTime = differenceInHours(completedAtDate, createdAtDate);
        
        if (completionTime > 0) {
          totalCompletionTime += completionTime;
          tasksWithCompletionTime++;
        }
      }
    }
    
    const avgCompletionTime = tasksWithCompletionTime > 0 ? totalCompletionTime / tasksWithCompletionTime : 0;
    
    // Calculate deadlines missed
    const deadlinesMissed = tasks.filter(task => {
      if (task.deadline && (task.status !== 'completed' || (task.completedAt && task.deadline))) {
        const deadlineDate = parseISO(task.deadline);
        const completedDate = task.completedAt ? parseISO(task.completedAt) : null;
        
        return !completedDate || (completedDate && completedDate > deadlineDate);
      }
      return false;
    }).length;
    
    // Calculate average sleep and work duration
    let totalSleepDuration = 0;
    let daysWithSleepData = 0;
    let totalWorkDuration = 0;
    let daysWithWorkData = 0;
    
    for (const log of logs) {
      if (log.wakeUpTime && log.sleepTime) {
        const wakeUpDate = parseISO(log.wakeUpTime);
        const sleepDate = parseISO(log.sleepTime);
        
        // Handle case where sleep time is for the next day
        if (sleepDate > wakeUpDate) {
          const sleepDuration = differenceInHours(sleepDate, wakeUpDate);
          totalSleepDuration += sleepDuration;
          daysWithSleepData++;
        }
      }
      
      if (log.workStartTime && log.workEndTime) {
        const workStartDate = parseISO(log.workStartTime);
        const workEndDate = parseISO(log.workEndTime);
        
        if (workEndDate > workStartDate) {
          const workDuration = differenceInHours(workEndDate, workStartDate);
          totalWorkDuration += workDuration;
          daysWithWorkData++;
        }
      }
    }
    
    const avgSleepDuration = daysWithSleepData > 0 ? totalSleepDuration / daysWithSleepData : undefined;
    const avgWorkDuration = daysWithWorkData > 0 ? totalWorkDuration / daysWithWorkData : undefined;
    
    return {
      totalTasksCreated,
      totalTasksCompleted,
      completionRate,
      avgCompletionTime,
      tasksCompletedByPriority,
      deadlinesMissed,
      avgSleepDuration,
      avgWorkDuration,
    };
  } catch (error) {
    console.error('Error calculating performance metrics:', error);
    throw error;
  }
}

// Calculate daily performance score (0-100)
export async function calculateDailyPerformance(userId: string, date?: string): Promise<number> {
  try {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);
    
    // Get daily log
    const log = await getDailyLog(userId, targetDate);
    
    // Get tasks due on this day
    const tasksQuery = query(
      collection(db, tasksCollection),
      where('userId', '==', userId),
      where('deadline', '>=', targetDate + 'T00:00:00.000Z'),
      where('deadline', '<', nextDate.toISOString().split('T')[0] + 'T00:00:00.000Z')
    );
    
    const snapshot = await getDocs(tasksQuery);
    const dueTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
    
    // Get completed tasks on this day
    const completedTasksQuery = query(
      collection(db, tasksCollection),
      where('userId', '==', userId),
      where('completedAt', '>=', targetDate + 'T00:00:00.000Z'),
      where('completedAt', '<', nextDate.toISOString().split('T')[0] + 'T00:00:00.000Z')
    );
    
    const completedSnapshot = await getDocs(completedTasksQuery);
    const completedTasks = completedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
    
    // Calculate metrics for performance score
    const totalDueTasks = dueTasks.length;
    const totalCompletedTasks = completedTasks.length;
    const completedDueTasks = dueTasks.filter(task => task.status === 'completed').length;
    
    // Base score starts at 50
    let performanceScore = 50;
    
    // Task completion: +30 max
    const completionScore = totalDueTasks > 0 
      ? Math.min(30, 30 * (completedDueTasks / totalDueTasks))
      : (totalCompletedTasks > 0 ? 15 : 0); // Some credit for completing tasks even if none were due
    
    performanceScore += completionScore;
    
    // Priority handling: +10 max
    const highPriorityCompleted = completedTasks.filter(task => task.priority === 'high').length;
    const mediumPriorityCompleted = completedTasks.filter(task => task.priority === 'medium').length;
    const highPriorityDue = dueTasks.filter(task => task.priority === 'high').length;
    
    let priorityScore = 0;
    if (highPriorityDue > 0) {
      priorityScore += Math.min(10, 10 * (highPriorityCompleted / highPriorityDue));
    } else if (highPriorityCompleted > 0) {
      priorityScore += 5; // Bonus for completing high priority tasks even if none were due
    }
    
    performanceScore += priorityScore;
    
    // Sleep and work tracking: +10 max
    let wellnessScore = 0;
    if (log) {
      if (log.wakeUpTime) wellnessScore += 2;
      if (log.sleepTime) wellnessScore += 2;
      if (log.workStartTime) wellnessScore += 2;
      if (log.workEndTime) wellnessScore += 2;
      
      // If work duration is tracked and between 6-10 hours: +2
      if (log.workStartTime && log.workEndTime) {
        const workStartDate = parseISO(log.workStartTime);
        const workEndDate = parseISO(log.workEndTime);
        const workHours = differenceInHours(workEndDate, workStartDate);
        
        if (workHours >= 6 && workHours <= 10) {
          wellnessScore += 2;
        }
      }
    }
    
    performanceScore += wellnessScore;
    
    // Update the daily log with the performance score
    if (log) {
      await updateDoc(doc(db, logsCollection, log.id), { 
        performance: performanceScore,
        tasksCompleted: totalCompletedTasks 
      });
    }
    
    return performanceScore;
  } catch (error) {
    console.error('Error calculating daily performance:', error);
    throw error;
  }
} 