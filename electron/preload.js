const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  // Books
  addBook: (data) => ipcRenderer.invoke("add-book", data),
  getBooks: (params) => ipcRenderer.invoke("get-books", params),
  deleteBook: (id) => ipcRenderer.invoke("delete-book", id),
  updateBook: (data) => ipcRenderer.invoke("update-book", data),

  // Categories
  getCategories: () => ipcRenderer.invoke("get-categories"),
  addCategory: (name) => ipcRenderer.invoke("add-category", name),
  updateCategory: (category) => ipcRenderer.invoke("update-category", category),
  deleteCategory: (id) => ipcRenderer.invoke("delete-category", id),

  // Classes
  getClasses: () => ipcRenderer.invoke("get-classes"),
  addClass: (name) => ipcRenderer.invoke("add-class", name),
  deleteClass: (id) => ipcRenderer.invoke("delete-class", id),
  updateClass: (cls) => ipcRenderer.invoke("update-class", cls),

  // Students
  getStudents: (params) => ipcRenderer.invoke("get-students", params),
  addStudent: (data) => ipcRenderer.invoke("add-student", data),
  deleteStudent: (id) => ipcRenderer.invoke("delete-student", id),
  updateStudent: (data) => ipcRenderer.invoke("update-student", data),

  // Borrowings
  borrowBook: (data) => ipcRenderer.invoke("borrow-book", data),
  getActiveBorrowings: () => ipcRenderer.invoke("get-active-borrowings"),
  returnBook: (id) => ipcRenderer.invoke("return-book", id),

  // Settings
  getSetting: (key) => ipcRenderer.invoke("get-setting", key),
  setSetting: (data) => ipcRenderer.invoke("set-setting", data),

  // Dashboard
  getDashboardStats: () => ipcRenderer.invoke("get-dashboard-stats"),

  // Legacy (persons)
  addPerson: (name) => ipcRenderer.invoke("add-person", name),
  getPersons: () => ipcRenderer.invoke("get-persons"),

  // File Backup: Books
  exportBooksToFile: () => ipcRenderer.invoke("books-export-to-file"),
  importBooksFromFile: (opts) => ipcRenderer.invoke("books-import-from-file", opts),

  // File Backup: Students
  exportStudentsToFile: () => ipcRenderer.invoke("students-export-to-file"),
  importStudentsFromFile: (opts) => ipcRenderer.invoke("students-import-from-file", opts),

  // File Backup: Classes
  exportClassesToFile: () => ipcRenderer.invoke("classes-export-to-file"),
  importClassesFromFile: (opts) => ipcRenderer.invoke("classes-import-from-file", opts),

  // File Backup: Borrowings
  exportBorrowingsToFile: () => ipcRenderer.invoke("borrowings-export-to-file"),
  importBorrowingsFromFile: (opts) => ipcRenderer.invoke("borrowings-import-from-file", opts),

  // PDF Save
  savePdfFile: (payload) => ipcRenderer.invoke("save-pdf-file", payload),
});
