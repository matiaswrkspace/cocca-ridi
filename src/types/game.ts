export type GamePhase =
  | 'waiting'
  | 'countdown'
  | 'cards'
  | 'question'
  | 'selecting'
  | 'revealing'
  | 'voting'
  | 'results'
  | 'finished'

export interface Room {
  id: string
  code: string
  host_player_id: string | null
  max_players: number
  total_rounds: number
  current_round: number
  phase: GamePhase
  phase_started_at: string | null
  reveal_index: number
  current_question_id: number | null
  created_at: string
}

export interface Player {
  id: string
  room_id: string
  name: string
  is_host: boolean
  score: number
  session_id: string | null
  created_at: string
}

export interface PlayerHand {
  id: string
  player_id: string
  room_id: string
  card_id: number
}

export interface RoundSubmission {
  id: string
  room_id: string
  round_num: number
  player_id: string
  card_id: number
  display_order: number | null
  created_at: string
}

export interface RoundVote {
  id: string
  room_id: string
  round_num: number
  voter_id: string
  submission_id: string
  created_at: string
}

export interface QuestionCard {
  id: number
  text: string
}

export interface AnswerCard {
  id: number
  text: string
}

export const PHASE_DURATIONS: Partial<Record<GamePhase, number>> = {
  countdown: 15,
  cards: 30,
  question: 10,
  selecting: 30,
  voting: 60,
  results: 6,
}

export const REVEAL_DURATION = 4
