-- 予約カレンダーのデータ問題を調査するためのSQLクエリ
--
-- 使い方:
-- 1. 下の `SET` 文にある `your_service_type_id` を、テストしたい実際の `service_type_id` に置き換えてください。
-- 2. このクエリ全体をSupabaseのSQL Editorに貼り付けて実行します。
-- 3. 3つのクエリ結果を確認し、データが期待通りに存在するかをチェックします。

-- 変数の設定
SET a.service_type_id = 1; -- <<< ここをテストしたい service_type_id に変更してください

-- クエリ1: サービスタイプの詳細を確認
-- 結果のチェックポイント:
-- - `duration` カラムに、予約枠の分数 (例: 30, 60) が正しく設定されていますか？ NULL になっていませんか？
SELECT
  id,
  name,
  duration,
  color
FROM
  public.service_types
WHERE
  id = current_setting('a.service_type_id')::integer;

-- クエリ2: 予約可能時間設定を確認
-- 結果のチェックポイント:
-- - テストしたいサービスIDに対応する設定が存在しますか？
-- - `is_available` は `true` になっていますか？
-- - `day_of_week` (週次設定) や `specific_date` (特定日設定) は正しいですか？
-- - `start_time` と `end_time` は期待通りの時間ですか？
SELECT
  *
FROM
  public.availability_settings
WHERE
  service_type_id = current_setting('a.service_type_id')::integer
ORDER BY
  specific_date, day_of_week, start_time;


-- クエリ3: 今月の既存の予約を確認 (予約済みスロットのチェック用)
-- 結果のチェックポイント:
-- - 予約済みにしたい日時に、正しくデータが存在しますか？
SELECT
  id,
  reservation_date,
  start_time,
  status,
  patient_name
FROM
  public.reservations
WHERE
  service_type_id = current_setting('a.service_type_id')::integer
  AND reservation_date >= date_trunc('month', CURRENT_DATE)
  AND reservation_date < date_trunc('month', CURRENT_DATE) + interval '1 month'
ORDER BY
  reservation_date, start_time;
