import Link from "next/link"
import { CheckCircle } from "lucide-react"

export default function QuestionnaireSuccessPage() {
  return (
    <div className="container mx-auto flex min-h-[80vh] flex-col items-center justify-center p-4 text-center">
      <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
      <h1 className="text-3xl font-bold text-gray-800 mb-2">問診票の送信が完了しました</h1>
      <p className="text-gray-600 mb-6">ご協力いただき、誠にありがとうございます。</p>
      <p className="text-gray-600 mb-8">ご予約内容の確認や変更は、予約管理ページから行えます。</p>
      <Link
        href="/"
        className="inline-flex items-center justify-center rounded-md bg-[#f8a0a0] px-6 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#f78b8b] focus:outline-none focus:ring-2 focus:ring-[#f8a0a0] focus:ring-offset-2"
      >
        トップページに戻る
      </Link>
    </div>
  )
}
