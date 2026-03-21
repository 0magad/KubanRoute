-- 2.1. Расширения
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2.2. Таблица places
CREATE TABLE places (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name              VARCHAR(255) NOT NULL,
  type              VARCHAR(50) NOT NULL,
  description       TEXT NOT NULL,
  short_desc        VARCHAR(500) NOT NULL,
  lat               DECIMAL(10,7) NOT NULL,
  lng               DECIMAL(10,7) NOT NULL,
  address           VARCHAR(500),
  region            VARCHAR(100),
  tags              TEXT[] DEFAULT '{}',
  seasons           SMALLINT[] DEFAULT '{}',
  outdoor           BOOLEAN DEFAULT true,
  weather_sensitive BOOLEAN DEFAULT true,
  price_min         INTEGER DEFAULT 0,
  price_max         INTEGER DEFAULT 0,
  car_required      BOOLEAN DEFAULT false,
  working_hours     JSONB DEFAULT '{}',
  photos            TEXT[] DEFAULT '{}',
  contacts          JSONB DEFAULT '{}',
  avg_rating        DECIMAL(3,2) DEFAULT 0,
  review_count      INTEGER DEFAULT 0,
  like_count        INTEGER DEFAULT 0,
  status            VARCHAR(20) DEFAULT 'pending',
  embedding         VECTOR(384),
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_places_tags ON places USING GIN(tags);
CREATE INDEX idx_places_seasons ON places USING GIN(seasons);
CREATE INDEX idx_places_status ON places(status);
CREATE INDEX idx_places_region ON places(region);
CREATE INDEX idx_places_embedding ON places USING ivfflat(embedding vector_cosine_ops) WITH (lists = 100);

-- 2.3. Таблица user_profiles
CREATE TABLE user_profiles (
  id                   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name         VARCHAR(255),
  avatar_url           TEXT,
  oauth_provider       VARCHAR(20),
  has_car              BOOLEAN,
  travel_style         VARCHAR(20),
  budget_tier          VARCHAR(10),
  has_children         BOOLEAN,
  age_group            VARCHAR(20),
  interests            TEXT[] DEFAULT '{}',
  dislikes             TEXT[] DEFAULT '{}',
  weather_preference   VARCHAR(20) DEFAULT 'any',
  min_temp_comfort     INTEGER DEFAULT 10,
  liked_place_ids      UUID[] DEFAULT '{}',
  viewed_place_ids     UUID[] DEFAULT '{}',
  reviewed_place_ids   UUID[] DEFAULT '{}',
  chat_summary         TEXT,
  chat_history         JSONB DEFAULT '[]',
  preference_vector    VECTOR(384),
  created_at           TIMESTAMP DEFAULT NOW(),
  updated_at           TIMESTAMP DEFAULT NOW()
);

-- 2.4. Таблица user_events
CREATE TABLE user_events (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  place_id    UUID REFERENCES places(id) ON DELETE CASCADE,
  event_type  VARCHAR(30) NOT NULL,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_events_user ON user_events(user_id);
CREATE INDEX idx_events_place ON user_events(place_id);
CREATE INDEX idx_events_type ON user_events(event_type);

-- 2.5. Таблица reviews
CREATE TABLE reviews (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  place_id        UUID REFERENCES places(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  rating          SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text            TEXT,
  sentiment_score DECIMAL(4,3),
  keywords        TEXT[] DEFAULT '{}',
  visited_at      DATE,
  created_at      TIMESTAMP DEFAULT NOW(),
  UNIQUE(place_id, user_id)
);
 
CREATE OR REPLACE FUNCTION update_place_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE places SET
    avg_rating   = (SELECT AVG(rating)::DECIMAL(3,2) FROM reviews WHERE place_id = NEW.place_id),
    review_count = (SELECT COUNT(*) FROM reviews WHERE place_id = NEW.place_id)
  WHERE id = NEW.place_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
 
CREATE TRIGGER trg_update_rating
AFTER INSERT OR UPDATE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_place_rating();

-- 2.6. Таблицы recommendations, routes, weather_cache
CREATE TABLE recommendations (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  place_ids         UUID[] NOT NULL,
  justifications    JSONB NOT NULL DEFAULT '{}',
  scores            JSONB NOT NULL DEFAULT '{}',
  weather_context   JSONB DEFAULT '{}',
  algorithm_version VARCHAR(20) DEFAULT 'v1',
  generated_at      TIMESTAMP DEFAULT NOW(),
  expires_at        TIMESTAMP DEFAULT (NOW() + INTERVAL '6 hours')
);
 
CREATE TABLE routes (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  profile_snapshot      JSONB NOT NULL,
  generated_json        JSONB NOT NULL,
  share_token           VARCHAR(32) UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  weather_at_generation JSONB,
  created_at            TIMESTAMP DEFAULT NOW()
);
 
CREATE TABLE weather_cache (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  region      VARCHAR(100) NOT NULL,
  data        JSONB NOT NULL,
  fetched_at  TIMESTAMP DEFAULT NOW(),
  expires_at  TIMESTAMP DEFAULT (NOW() + INTERVAL '3 hours')
);
CREATE UNIQUE INDEX idx_weather_region ON weather_cache(region);
