import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  Timestamp,
  writeBatch,
  serverTimestamp,
  WhereFilterOp,
  Query,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

// Type definitions for our data models
export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
  dreamJob: string;
  preferences?: Record<string, string>;
  stripeCustomerId?: string;
}

export interface Profile {
  id: string;
  userId: string;
  bio?: string;
  structuredData?: Record<string, string>;
  dreamJob?: string;
  dreamCompany?: string;
  dreamSalary?: string;
  skills: Skill[];
}

export interface Skill {
  id: string;
  name: string;
  profileId: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: string;
  dueDate: Date;
  completed: boolean;
  userId: string;
}

export interface CareerAnalysis {
  id: string;
  userId: string;
  analysis: string;
  createdAt: Date;
  updatedAt: Date;
  progressPercentage: Record<string, number>;
  totalProgress: number;
  skillsAnalysis: Record<string, number>;
  aiRoadmap: Record<string, number>[];
  trendAnalysis: Record<string, number>;
  certificationPath: Record<string, number>[];
  projectRecommendations: Record<string, number>[];
  communityStrategy: Record<string, number>;
  riskAssessment: {
    level: string;
    factors: string[];
    mitigationSteps: string[];
    automationThreat: string;
    skillDecay: string;
    marketCompetition: string;
  };
}

export interface Step {
  id: string;
  title: string;
  description: string;
  timeframe: string;
  priority: string;
  status: string;
  timelineProgress: number;
  startedAt?: Date;
  completedAt?: Date;
  skillType?: string;
  successMetrics: string[];
  analysisId: string;
  resources: Resource[];
  category: string;
}

export interface Resource {
  id: string;
  name: string;
  url?: string;
  description: string;
  type: string;
  provider?: string;
  level?: string;
  aiRelevance?: string;
  timeCommitment?: string;
  category: string;
  tags: string;
  isFree: boolean;
  isPremium: boolean;
  stepId: string;
}

export interface StepProgress {
  id: string;
  userId: string;
  stepId: string;
  status: string;
  startedAt?: Date;
  completedAt?: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  message: string;
  date: Date;
  read: boolean;
  stepId?: string;
}

export interface Subscription {
  id: string;
  stripeSubId: string;
  userId: string;
  status: string;
  plan: string;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Invoice {
  id: string;
  userId: string;
  stripeInvoiceId: string;
  subscriptionId?: string;
  amount: number;
  status: string;
  currency: string;
  periodStart: Date;
  periodEnd: Date;
  createdAt: Date;
  paidAt?: Date;
}

// Utility functions for converting between Firestore and our types
export const convertTimestamp = (timestamp: Timestamp | Date): Date => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  return new Date();
};

export const convertToTimestamp = (date: Date): Timestamp => {
  if (date instanceof Timestamp) {
    return date;
  }
  return Timestamp.fromDate(date);
};

// Generic CRUD operations
export const createDocument = async <T>(
  collectionName: string, 
  data: Omit<T, 'id'>
): Promise<string> => {
  const docRef = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return docRef.id;
};

export const getDocument = async <T>(
  collectionName: string, 
  id: string
): Promise<T | null> => {
  const docRef = doc(db, collectionName, id);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as T;
  }
  return null;
};

export const updateDocument = async <T>(
  collectionName: string, 
  id: string, 
  data: Partial<T>
): Promise<void> => {
  const docRef = doc(db, collectionName, id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp()
  });
};

export const deleteDocument = async (
  collectionName: string, 
  id: string
): Promise<void> => {
  const docRef = doc(db, collectionName, id);
  await deleteDoc(docRef);
};

export const getDocuments = async <T>(
  collectionName: string,
  conditions?: Array<{ field: string; operator: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'in' | 'not-in' | 'array-contains' | 'array-contains-any'; value: string | number }>,
  orderByField?: string,
  orderDirection: 'asc' | 'desc' = 'asc',
  limitCount?: number
): Promise<T[]> => {
  let q = collection(db, collectionName) as Query<T>;
  
  if (conditions) {
    conditions.forEach(condition => {
      q = query(q, where(condition.field, condition.operator as WhereFilterOp, condition.value));
    });
  }
  
  if (orderByField) {
    q = query(q, orderBy(orderByField, orderDirection));
  }
  
  if (limitCount) {
    q = query(q, limit(limitCount));
  }
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as T);
};

export const getDocumentsByField = async <T>(
  collectionName: string,
  field: string,
  value: string | number
): Promise<T[]> => {
  const q = query(collection(db, collectionName), where(field, '==', value));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as T);
};

// Batch operations
export const batchCreate = async <T>(
  collectionName: string, 
  documents: Omit<T, 'id'>[]
): Promise<string[]> => {
  const batch = writeBatch(db);
  const ids: string[] = [];
  
  documents.forEach(docData => {
    const docRef = doc(collection(db, collectionName));
    batch.set(docRef, {
      ...docData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    ids.push(docRef.id);
  });
  
  await batch.commit();
  return ids;
};

export const batchUpdate = async <T>(
  collectionName: string, 
  updates: Array<{ id: string; data: Partial<T> }>
): Promise<void> => {
  const batch = writeBatch(db);
  
  updates.forEach(({ id, data }) => {
    const docRef = doc(db, collectionName, id);
    batch.update(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  });
  
  await batch.commit();
};

export const batchDelete = async (
  collectionName: string, 
  ids: string[]
): Promise<void> => {
  const batch = writeBatch(db);
  
  ids.forEach(id => {
    const docRef = doc(db, collectionName, id);
    batch.delete(docRef);
  });
  
  await batch.commit();
};
