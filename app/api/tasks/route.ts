import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';

// Collection names
const tasksCollection = 'tasks';

export async function POST(request: Request) {
  try {
    const taskData = await request.json();
    
    if (!taskData || !taskData.userId) {
      return NextResponse.json(
        { error: 'User ID and task data are required' },
        { status: 400 }
      );
    }

    // Add the task to Firestore
    const docRef = await addDoc(collection(db, tasksCollection), taskData);
    
    // Return the created task with its ID
    return NextResponse.json({
      success: true,
      message: 'Task created successfully',
      task: {
        id: docRef.id,
        ...taskData
      }
    });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...updateData } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    // Get the task reference
    const taskRef = doc(db, tasksCollection, id);
    
    // Check if the task exists
    const taskSnapshot = await getDoc(taskRef);
    if (!taskSnapshot.exists()) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }
    
    // Update the task
    await updateDoc(taskRef, updateData);
    
    // Return success
    return NextResponse.json({
      success: true,
      message: 'Task updated successfully',
      task: {
        id,
        ...taskSnapshot.data(),
        ...updateData
      }
    });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    // Get the task reference
    const taskRef = doc(db, tasksCollection, id);
    
    // Check if the task exists
    const taskSnapshot = await getDoc(taskRef);
    if (!taskSnapshot.exists()) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }
    
    // Delete the task
    await deleteDoc(taskRef);
    
    // Return success
    return NextResponse.json({
      success: true,
      message: 'Task deleted successfully',
      id
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    );
  }
} 