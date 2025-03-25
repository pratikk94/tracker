import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { format } from 'date-fns';

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get today's date
    const today = format(new Date(), 'yyyy-MM-dd');
    
    // Check if there's already a daily log for today
    const logsRef = collection(db, 'dailyLogs');
    const q = query(
      logsRef,
      where('userId', '==', userId),
      where('date', '==', today)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      // Create a new daily log with wake up time
      const newLog = {
        userId,
        date: today,
        wakeUpTime: new Date().toISOString(),
        totalWorkTime: 0,
        totalBreakTime: 0,
        records: [],
        notes: ''
      };
      
      await addDoc(logsRef, newLog);
      
      return NextResponse.json({ 
        success: true,
        message: 'Wake up time logged successfully',
        log: newLog
      });
    } else {
      // Update the existing log with wake up time
      const logDoc = querySnapshot.docs[0];
      const logRef = doc(db, 'dailyLogs', logDoc.id);
      
      await updateDoc(logRef, {
        wakeUpTime: new Date().toISOString()
      });
      
      const updatedLog = {
        id: logDoc.id,
        ...logDoc.data(),
        wakeUpTime: new Date().toISOString()
      };
      
      return NextResponse.json({ 
        success: true,
        message: 'Wake up time updated successfully',
        log: updatedLog
      });
    }
  } catch (error) {
    console.error('Error logging wake up time:', error);
    return NextResponse.json(
      { error: 'Failed to log wake up time' },
      { status: 500 }
    );
  }
} 