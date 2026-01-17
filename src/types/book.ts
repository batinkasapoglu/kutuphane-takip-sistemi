export interface Book {
  id: string;
  code: string;
  title: string;
  author: string;
  categoryId: string;
  publisher: string;
  publishYear: number | null;
  pageCount: number | null;
  shelfCode: string;
  description: string;
  entryDate: string;
  isBorrowed?: boolean; // true if book is currently borrowed
}

export interface Category {
  id: string;
  name: string;
}
