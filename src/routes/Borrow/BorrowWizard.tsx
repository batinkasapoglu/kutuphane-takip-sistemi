import { useState } from "react";
import type { Book } from "../../types/book";
import type { Student } from "../../types/student";
import StepStudent from "./StepStudent";
import StepBook from "./StepBook";
import StepConfirm from "./StepConfirm";
import { BookOpenCheck, User, BookOpen, CheckCircle } from "lucide-react";

export default function BorrowWizard() {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  const next = () => setStep((s) => (s < 3 ? ((s + 1) as any) : s));
  const back = () => setStep((s) => (s > 1 ? ((s - 1) as any) : s));

  const steps = [
    { num: 1, label: "Öğrenci", icon: User },
    { num: 2, label: "Kitap", icon: BookOpen },
    { num: 3, label: "Onay", icon: CheckCircle },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <BookOpenCheck className="text-blue-600" size={32} />
          Kitap Ödünç Ver
        </h1>
        <p className="text-gray-500 mt-1">
          Öğrenci seçin, kitap seçin ve onaylayın
        </p>
      </div>

      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          {/* Progress Line */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 z-0">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${((step - 1) / 2) * 100}%` }}
            />
          </div>

          {steps.map((s) => {
            const Icon = s.icon;
            const isActive = step === s.num;
            const isCompleted = step > s.num;

            return (
              <div
                key={s.num}
                className="flex flex-col items-center relative z-10"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                      : isCompleted
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle size={20} />
                  ) : (
                    <Icon size={20} />
                  )}
                </div>
                <span
                  className={`mt-2 text-sm font-medium ${
                    isActive ? "text-blue-600" : "text-gray-500"
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Summary */}
      {(selectedStudent || selectedBook) && (
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            {selectedStudent && (
              <div className="flex items-center gap-2">
                <User size={16} className="text-blue-600" />
                <span className="font-medium">{selectedStudent.fullName}</span>
              </div>
            )}
            {selectedStudent && selectedBook && (
              <span className="text-blue-300">→</span>
            )}
            {selectedBook && (
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-blue-600" />
                <span className="font-medium">{selectedBook.title}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Steps */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        {step === 1 && (
          <StepStudent
            selectedStudent={selectedStudent}
            onSelect={(student) => {
              setSelectedStudent(student);
              next();
            }}
          />
        )}

        {step === 2 && (
          <StepBook
            selectedBook={selectedBook}
            onSelect={(book) => {
              setSelectedBook(book);
              next();
            }}
            onBack={back}
          />
        )}

        {step === 3 && selectedStudent && selectedBook && (
          <StepConfirm
            student={selectedStudent}
            book={selectedBook}
            onBack={back}
          />
        )}
      </div>
    </div>
  );
}
