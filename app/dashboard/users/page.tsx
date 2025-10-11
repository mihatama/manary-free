import { FeatureDisabledMessage } from "@/components/feature-disabled-message"
import { UserManagementClient } from "@/components/user-management-client"

export default function UsersPage() {
  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">利用者管理</h1>
        <p className="mt-2 text-gray-600">
          Supabase の代わりにブラウザのローカルストレージを使って、簡易的なユーザー情報を保持します。
        </p>
      </div>
      <FeatureDisabledMessage
        title="外部認証は無効化されています"
        description="ここで追加した利用者情報はサンプルデータとしてローカルに保存されます。"
      />
      <UserManagementClient />
    </div>
  )
}
