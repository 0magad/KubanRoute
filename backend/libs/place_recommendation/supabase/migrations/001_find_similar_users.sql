-- RPC: найти пользователей с похожими лайками (Jaccard similarity)
-- Ожидаемые таблицы: user_events (user_id, place_id, event_type), places (id, tags)
-- event_type = 'card_like' — лайк карточки места

CREATE OR REPLACE FUNCTION find_similar_users(target_uid uuid, lim int DEFAULT 50)
RETURNS TABLE (other_uid uuid, shared bigint, jaccard float)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH target_likes AS (
    SELECT place_id FROM user_events
    WHERE user_id = target_uid AND event_type = 'card_like'
  ),
  target_cnt AS (SELECT COUNT(*)::float AS c FROM target_likes),
  other_likes AS (
    SELECT ue.user_id AS other_uid, ue.place_id
    FROM user_events ue
    WHERE ue.event_type = 'card_like'
      AND ue.user_id != target_uid
      AND ue.place_id IN (SELECT place_id FROM target_likes)
  ),
  shared_counts AS (
    SELECT other_uid, COUNT(*)::bigint AS shared
    FROM other_likes
    GROUP BY other_uid
  ),
  other_totals AS (
    SELECT user_id, COUNT(*)::float AS c
    FROM user_events
    WHERE event_type = 'card_like' AND user_id != target_uid
    GROUP BY user_id
  )
  SELECT
    sc.other_uid,
    sc.shared,
    (sc.shared::float / (tc.c + ot.c - sc.shared::float + 1e-8)) AS jaccard
  FROM shared_counts sc
  JOIN target_cnt tc ON true
  JOIN other_totals ot ON ot.user_id = sc.other_uid
  ORDER BY jaccard DESC
  LIMIT lim;
END;
$$;

-- Если используете text вместо uuid для user_id, замените uuid на text в сигнатуре:
-- find_similar_users(target_uid text, lim int DEFAULT 50)
-- RETURNS TABLE (other_uid text, shared bigint, jaccard float)
