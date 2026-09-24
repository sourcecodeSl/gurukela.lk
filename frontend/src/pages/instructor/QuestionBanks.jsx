import QuestionBankManager from '../../components/QuestionBankManager.jsx'

// Instructor-facing MCQ bank manager. Build reusable question sets ahead of a
// live test, then import them into any quiz using the bank's password.
export default function QuestionBanks() {
  return (
    <QuestionBankManager intro="Build reusable sets of MCQ questions ahead of time. When you run a test, import a bank with its password to load all its questions at once." />
  )
}
