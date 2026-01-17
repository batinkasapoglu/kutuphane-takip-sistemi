export {};
declare module "bwip-js";
import type { Book, Category } from "./book";
import type { Student, Class } from "./student";
import type { Borrowing, DashboardStats } from "./borrowing";

declare global {
  interface Window {
    api: {
      // Books
      addBook: (
        data: Omit<Book, "id" | "code" | "entryDate">
      ) => Promise<{ id: string; code: string }>;
      getBooks: (params?: {
        search?: string;
        categoryId?: string;
        code?: string;
      }) => Promise<Book[]>;
      deleteBook: (id: string) => Promise<{ success: boolean }>;
      updateBook: (
        data: Pick<Book, "id" | "title" | "author" | "categoryId">
      ) => Promise<boolean>;

      // ✅ FILE BACKUP (Books)
      exportBooksToFile: () => Promise<{
        canceled: boolean;
        filePath?: string;
        count?: number;
      }>;
      importBooksFromFile: (opts?: {
        mode?: "merge" | "overwrite";
      }) => Promise<{
        canceled: boolean;
        filePath?: string;
        restored?: number;
      }>;

      // Categories
      getCategories: () => Promise<Category[]>;
      addCategory: (name: string) => Promise<{ id: string }>;
      updateCategory: (category: Category) => Promise<boolean>;
      deleteCategory: (id: string) => Promise<boolean>;

      // Students
      getStudents: (params?: {
        search?: string;
        classId?: string;
      }) => Promise<Student[]>;
      addStudent: (data: Omit<Student, "id">) => Promise<{ id: string }>;
      updateStudent: (student: Student) => Promise<boolean>;
      deleteStudent: (id: string) => Promise<boolean>;

      // ✅ FILE BACKUP (Students)
      exportStudentsToFile: () => Promise<{
        canceled: boolean;
        filePath?: string;
        count?: number;
      }>;
      importStudentsFromFile: (opts?: {
        mode?: "merge" | "overwrite";
      }) => Promise<{
        canceled: boolean;
        filePath?: string;
        restored?: number;
      }>;

      // Classes
      getClasses: () => Promise<Class[]>;
      addClass: (name: string) => Promise<{ id: string }>;
      deleteClass: (id: string) => Promise<boolean>;
      updateClass: (cls: Class) => Promise<boolean>;

      // Borrowings
      borrowBook: (data: {
        bookId: string;
        studentId: string;
      }) => Promise<{ id: string }>;
      getActiveBorrowings: () => Promise<Borrowing[]>;
      returnBook: (id: string) => Promise<boolean>;

      // Settings
      getSetting: (key: string) => Promise<string>;
      setSetting: (data: { key: string; value: string }) => Promise<boolean>;

      // Dashboard
      getDashboardStats: () => Promise<DashboardStats>;

      // Legacy
      addPerson: (name: string) => Promise<{ id: string }>;
      getPersons: () => Promise<{ id: string; name: string }[]>;
      // ✅ FILE BACKUP (Classes)
      exportClassesToFile: () => Promise<{
        canceled: boolean;
        filePath?: string;
        count?: number;
      }>;
      importClassesFromFile: (opts?: {
        mode?: "merge" | "overwrite";
      }) => Promise<{
        canceled: boolean;
        filePath?: string;
        restored?: number;
      }>;

      // ✅ FILE BACKUP (Borrowings)
      exportBorrowingsToFile: () => Promise<{
        canceled: boolean;
        filePath?: string;
        count?: number;
      }>;
      importBorrowingsFromFile: (opts?: {
        mode?: "merge" | "overwrite";
      }) => Promise<{
        canceled: boolean;
        filePath?: string;
        restored?: number;
      }>;
      // PDF Save
      savePdfFile: (data: {
        defaultName: string;
        bytes: number[];
      }) => Promise<{ canceled: boolean; filePath?: string }>;
    };
  }
}
