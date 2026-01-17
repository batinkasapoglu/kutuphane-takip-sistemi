import { Routes, Route } from "react-router-dom";
import RootLayout from "./layout/RootLayout";

import Home from "./routes/Home";
import BookList from "./routes/Books/BookList";
import AddBook from "./routes/Books/AddBook";
import CategoryList from "./routes/Categories/CategoryList";
import StudentList from "./routes/Students/StudentList";
import AddStudent from "./routes/Students/AddStudent";
import ClassList from "./routes/Classes/ClassList";
import ActiveBorrowings from "./routes/Borrow/ActiveBorrowings";
import BorrowWizard from "./routes/Borrow/BorrowWizard";
import SettingsPage from "./routes/Settings/SettingsPage";
import DashboardPage from "./routes/Dashboard/DashboardPage";
import LabelPrintPage from "./routes/Labels/LabelPrintPage";

export default function App() {
  return (
    <RootLayout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/books" element={<BookList />} />
        <Route path="/books/add" element={<AddBook />} />
        <Route path="/categories" element={<CategoryList />} />
        <Route path="/students" element={<StudentList />} />
        <Route path="/students/new" element={<AddStudent />} />
        <Route path="/classes" element={<ClassList />} />
        <Route path="/borrow" element={<BorrowWizard />} />
        <Route path="/borrow/active" element={<ActiveBorrowings />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/labels" element={<LabelPrintPage />} />
      </Routes>
    </RootLayout>
  );
}
