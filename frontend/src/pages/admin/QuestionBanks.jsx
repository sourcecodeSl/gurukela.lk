import QuestionBankManager from '../../components/QuestionBankManager.jsx'

// Admin-facing MCQ bank manager. Admins prepare shared question sets and give
// the password to teachers, who import them into their own tests.
export default function QuestionBanks() {
  return (
    <QuestionBankManager intro="Prepare reusable sets of MCQ questions for teachers. Share a bank’s password so any teacher can import its questions into their tests." />
  )
}
