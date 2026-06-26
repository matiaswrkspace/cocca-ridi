-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Rooms table
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(6) UNIQUE NOT NULL,
  max_players INT NOT NULL CHECK (max_players >= 4 AND max_players <= 12),
  total_rounds INT NOT NULL CHECK (total_rounds >= 5 AND total_rounds <= 15),
  current_round INT DEFAULT 0,
  phase VARCHAR(20) DEFAULT 'waiting',
  -- phases: waiting, countdown, cards, question, selecting, revealing, voting, results, finished
  phase_started_at TIMESTAMPTZ,
  reveal_index INT DEFAULT 0,
  current_question_id INT,
  host_player_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Players table
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  is_host BOOLEAN DEFAULT false,
  score INT DEFAULT 0,
  session_id VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key for host_player_id after players table exists
ALTER TABLE rooms ADD CONSTRAINT fk_host_player
  FOREIGN KEY (host_player_id) REFERENCES players(id) ON DELETE SET NULL;

-- Player hands (answer cards in hand)
CREATE TABLE player_hands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  card_id INT NOT NULL,
  UNIQUE(player_id, card_id)
);

-- Track used answer cards per room (prevent duplicates)
CREATE TABLE used_answer_cards (
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  card_id INT NOT NULL,
  PRIMARY KEY (room_id, card_id)
);

-- Track used question cards per room
CREATE TABLE used_question_cards (
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  card_id INT NOT NULL,
  PRIMARY KEY (room_id, card_id)
);

-- Round submissions
CREATE TABLE round_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  round_num INT NOT NULL,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  card_id INT NOT NULL,
  display_order INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, round_num, player_id)
);

-- Round votes
CREATE TABLE round_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  round_num INT NOT NULL,
  voter_id UUID REFERENCES players(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES round_submissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, round_num, voter_id)
);

-- Enable Row Level Security
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_hands ENABLE ROW LEVEL SECURITY;
ALTER TABLE used_answer_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE used_question_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE round_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE round_votes ENABLE ROW LEVEL SECURITY;

-- Public read policies (writes go through API with service role key)
CREATE POLICY "Public read rooms" ON rooms FOR SELECT USING (true);
CREATE POLICY "Public read players" ON players FOR SELECT USING (true);
CREATE POLICY "Public read hands" ON player_hands FOR SELECT USING (true);
CREATE POLICY "Public read submissions" ON round_submissions FOR SELECT USING (true);
CREATE POLICY "Public read votes" ON round_votes FOR SELECT USING (true);

-- Enable Realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE player_hands;
ALTER PUBLICATION supabase_realtime ADD TABLE round_submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE round_votes;
