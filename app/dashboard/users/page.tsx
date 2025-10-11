import { getUsers } from "@/app/actions/user-actions"
import { FeatureDisabledMessage } from "@/components/feature-disabled-message"
import { UserManagementClient } from "@/components/user-management-client"
import { requireAuth } from "@/lib/auth"
import { hasSupabaseAdminConfig } from "@/lib/supabase/env"

export default async function UsersPage() {
  if (!hasSupabaseAdminConfig()) {
    return (
      <div className="p-4 md:p-8">
        <FeatureDisabledMessage
          title="利用者管理は現在利用できません"
          description="Supabaseの管理者キーが設定されていないため、利用者一覧を読み込むことができません。NEXT_PUBLIC_SUPABASE_URLとSUPABASE_SERVICE_ROLE_KEYをAmplifyの環境変数に追加してください。"
        />
      </div>
    )
  }

  await requireAuth() // Ensure only authenticated users can access
  const users = await getUsers()

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-semibold text-gray-800">利用者管理</h1>
      <p className="mt-2 mb-6 text-gray-600">
        このページでは、システムの利用者を管理します。新しい利用者を追加したり、既存の利用者情報を確認できます。
      </p>
      <UserManagementClient users={users} />
    </div>
  )
}
