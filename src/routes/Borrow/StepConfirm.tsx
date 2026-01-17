import { useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import type { Book } from "../../types/book";
import type { Student } from "../../types/student";
import {
  CheckCircle,
  ArrowLeft,
  User,
  BookOpen,
  Calendar,
  Loader2,
  PartyPopper,
} from "lucide-react";

export default function StepConfirm({
  student,
  book,
  onBack,
}: {
  student: Student;
  book: Book;
  onBack: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const navigate = useNavigate();

  const confirm = async () => {
    setLoading(true);

    try {
      await window.api.borrowBook({
        studentId: student.id,
        bookId: book.id,
      });

      setDone(true);
      toast.success(`"${book.title}" kitabı ${student.fullName} öğrencisine ödünç verildi!`);

      setTimeout(() => {
        navigate("/borrow/active");
      }, 2000);
    } catch (error) {
      toast.error("Kitap ödünç verilirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toLocaleDateString("tr-TR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (done) {
    return (
      <div className="text-center py-8">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <PartyPopper size={40} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-green-700 mb-2">
          Kitap Ödünç Verildi!
        </h2>
        <p className="text-gray-600 mb-4">
          <strong>{book.title}</strong> kitabı <strong>{student.fullName}</strong> öğrencisine başarıyla ödünç verildi.
        </p>
        <p className="text-sm text-gray-500">
          Aktif ödünçler sayfasına yönlendiriliyorsunuz...
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <CheckCircle size={20} className="text-green-600" />
          Onaylayın
        </h2>

        <button
          className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-colors flex items-center gap-2"
          onClick={onBack}
        >
          <ArrowLeft size={16} />
          Geri
        </button>
      </div>

      {/* Summary Cards */}
      <div className="space-y-4 mb-6">
        {/* Student Card */}
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <User size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-blue-600 font-medium">Öğrenci</p>
              <p className="text-lg font-bold text-gray-800">{student.fullName}</p>
            </div>
          </div>
        </div>

        {/* Book Card */}
        <div className="p-4 rounded-xl bg-green-50 border border-green-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <BookOpen size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-green-600 font-medium">Kitap</p>
              <p className="text-lg font-bold text-gray-800">{book.title}</p>
              <p className="text-sm text-gray-600">{book.author}</p>
            </div>
          </div>
        </div>

        {/* Date Card */}
        <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
              <Calendar size={20} className="text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Ödünç Tarihi</p>
              <p className="text-lg font-bold text-gray-800">{today}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Button */}
      <button
        onClick={confirm}
        disabled={loading}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold text-lg shadow-lg shadow-green-200 hover:shadow-xl hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            İşleniyor...
          </>
        ) : (
          <>
            <CheckCircle size={20} />
            Onayla ve Ödünç Ver
          </>
        )}
      </button>
    </div>
  );
}
