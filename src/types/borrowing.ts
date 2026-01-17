export interface Borrowing {
  id: string;
  bookId: string;
  studentId: string;
  borrowDate: string;
  returnDate: string | null;
  status: 'borrowed' | 'returned';
  // Expanded fields from JOIN
  bookTitle?: string;
  bookAuthor?: string;
  studentName?: string;
  className?: string;
}

export interface DashboardStats {
  totalBooks: number;
  totalStudents: number;
  activeBorrowings: number;
}
