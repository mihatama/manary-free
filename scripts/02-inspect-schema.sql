-- このクエリは、データベースの 'public' スキーマに存在するすべてのテーブルと
-- そのカラムの一覧を表示します。
-- Supabaseの「SQL Editor」でこのクエリを実行し、結果を確認してください。
--
-- 特に「reservations」テーブルのカラム一覧を見て、
-- ユーザーIDを保持していると思われるカラム名（例: client_id, customer_idなど）を
-- 見つけてください。
SELECT
  table_name,
  column_name,
  data_type
FROM
  information_schema.columns
WHERE
  table_schema = 'public'
ORDER BY
  table_name,
  ordinal_position;
