import { db } from './firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Task, TaskStatus } from '@/lib/types';

// Get all tasks for a user
export const getTasks = async (userId: string): Promise<Task[]> => {
  const tasksRef = collection(db, 'tasks');
  const q = query(tasksRef, where('userId', '==', userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
};

// Add a new task
export const addTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> => {
  const tasksRef = collection(db, 'tasks');
  const now = serverTimestamp();
  const docRef = await addDoc(tasksRef, {
    ...taskData,
    createdAt: now,
    updatedAt: now
  });
  return {
    id: docRef.id,
    ...taskData,
    createdAt: now.toString(),
    updatedAt: now.toString()
  } as Task;
};

// Update an existing task
export const updateTask = async (taskId: string, updates: Partial<Task>): Promise<void> => {
  const taskRef = doc(db, 'tasks', taskId);
  await updateDoc(taskRef, {
    ...updates,
    updatedAt: serverTimestamp()
  });
};

// Delete a task
export const deleteTask = async (taskId: string): Promise<void> => {
  const taskRef = doc(db, 'tasks', taskId);
  await deleteDoc(taskRef);
};

// ... existing code ... 