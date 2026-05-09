const { Pool, types } = require('pg');
const config = require('./config.json');

types.setTypeParser(20, val => parseInt(val, 10));

const connection = new Pool({
  host: config.rds_host,
  user: config.rds_user,
  password: config.rds_password,
  port: config.rds_port,
  database: config.rds_db,
  ssl: { rejectUnauthorized: false },
});
connection.connect((err) => err && console.log(err));

// ROUTE 1: GET /tournament_specialists
const tournament_specialists = async function(req, res) {
  const tourneyName = req.query.tourney_name.trim();
  const minAppearances = req.query.min_appearances ?? 10;
  const topN = req.query.top_n ?? 10;
  if (!tourneyName) return res.status(400).json({ error: 'tourney_name is required.' });
  connection.query(`
    WITH player_wins AS (
      SELECT m.winner_id AS player_id, COUNT(*) AS wins
      FROM matches m
      JOIN tournaments t ON m.tourney_id = t.tourney_id
      WHERE UPPER(t.tourney_name) = UPPER('${tourneyName}')
      GROUP BY m.winner_id
    ),
    player_appearances AS (
      SELECT player_id, COUNT(*) AS appearances
      FROM (
        SELECT winner_id AS player_id, tourney_id FROM matches
        UNION ALL
        SELECT loser_id AS player_id, tourney_id FROM matches
      ) all_matches
      JOIN tournaments t ON all_matches.tourney_id = t.tourney_id
      WHERE UPPER(t.tourney_name) = UPPER('${tourneyName}')
      GROUP BY player_id
    ),
    tournament_win_rates AS (
      SELECT
        p.player_id, p.name_first, p.name_last,
        COALESCE(w.wins, 0) AS wins,
        a.appearances,
        ROUND(COALESCE(w.wins, 0) * 1.0 / a.appearances, 4) AS win_pct
      FROM player_appearances a
      JOIN players p ON a.player_id = p.player_id
      LEFT JOIN player_wins w ON a.player_id = w.player_id
      WHERE a.appearances >= ${minAppearances}
    )
    SELECT name_first, name_last, wins, appearances, win_pct,
      RANK() OVER (ORDER BY win_pct DESC, wins DESC) AS tourney_rank
    FROM tournament_win_rates
    ORDER BY tourney_rank
    LIMIT ${topN}
  `, (err, data) => {
    if (err) { console.log(err); res.json([]); }
    else res.json(data.rows);
  });
};

// ROUTE 2: GET /rankings/streaks
const ranking_streaks = async function(req, res) {
  const rankThreshold = req.query.rank_threshold;
  const topN = req.query.top_n ?? 10;
  if (!rankThreshold) return res.status(400).json({ error: 'rank_threshold is required.' });
  connection.query(`
    WITH flagged AS (
      SELECT
        r.player AS player_id,
        r.ranking_date,
        r.rank,
        ROW_NUMBER() OVER (PARTITION BY r.player ORDER BY r.ranking_date)
        -
        ROW_NUMBER() OVER (PARTITION BY r.player, (r.rank <= ${rankThreshold}) ORDER BY r.ranking_date) AS island
      FROM rankings r
    ),
    streaks AS (
      SELECT
        player_id,
        MIN(ranking_date) AS streak_start,
        MAX(ranking_date) AS streak_end,
        EXTRACT(DAY FROM MAX(ranking_date) - MIN(ranking_date)) AS streak_days,
        MIN(rank) AS peak_rank_during_streak
      FROM flagged
      WHERE rank <= ${rankThreshold}
      GROUP BY player_id, island
    )
    SELECT
      p.name_first || ' ' || p.name_last AS player_name,
      p.ioc AS country,
      CAST(s.streak_start AS DATE) AS streak_start,
      CAST(s.streak_end AS DATE) AS streak_end,
      s.streak_days,
      s.peak_rank_during_streak
    FROM streaks s
    JOIN players p ON p.player_id = s.player_id
    ORDER BY s.streak_days DESC, s.peak_rank_during_streak ASC
    LIMIT ${topN}
  `, (err, data) => {
    if (err) { console.log(err); res.json([]); }
    else res.json(data.rows);
  });
};

// ROUTE 3: GET /surface_specialists
const surface_specialists = async function(req, res) {
  const minMatches = req.query.min_matches ?? 20;
  const topN = req.query.top_n ?? 10;
  connection.query(`
    WITH surface_wins AS (
      SELECT m.winner_id AS player_id, t.surface, COUNT(*) AS wins
      FROM matches m
      JOIN tournaments t ON m.tourney_id = t.tourney_id
      WHERE t.surface IS NOT NULL
      GROUP BY m.winner_id, t.surface
    ),
    surface_losses AS (
      SELECT m.loser_id AS player_id, t.surface, COUNT(*) AS losses
      FROM matches m
      JOIN tournaments t ON m.tourney_id = t.tourney_id
      WHERE t.surface IS NOT NULL
      GROUP BY m.loser_id, t.surface
    ),
    player_surface_stats AS (
      SELECT
        p.player_id, p.name_first, p.name_last,
        COALESCE(w.surface, l.surface) AS surface,
        COALESCE(w.wins, 0) AS wins,
        COALESCE(l.losses, 0) AS losses,
        COALESCE(w.wins, 0) + COALESCE(l.losses, 0) AS matches_played,
        ROUND(COALESCE(w.wins, 0) * 1.0 / (COALESCE(w.wins, 0) + COALESCE(l.losses, 0)), 4) AS win_pct
      FROM surface_wins w
      FULL OUTER JOIN surface_losses l ON w.player_id = l.player_id AND w.surface = l.surface
      JOIN players p ON p.player_id = COALESCE(w.player_id, l.player_id)
      WHERE COALESCE(w.wins, 0) + COALESCE(l.losses, 0) >= ${minMatches}
    ),
    ranked_surface_players AS (
      SELECT name_first, name_last, surface, wins, losses, matches_played, win_pct,
        RANK() OVER (PARTITION BY surface ORDER BY win_pct DESC, wins DESC) AS surface_rank
      FROM player_surface_stats
    )
    SELECT name_first, name_last, surface, wins, losses, matches_played, win_pct, surface_rank
    FROM ranked_surface_players
    WHERE surface_rank <= ${topN}
    ORDER BY surface, surface_rank, name_last, name_first
  `, (err, data) => {
    if (err) { console.log(err); res.json([]); }
    else res.json(data.rows);
  });
};

// ROUTE 4: GET /players/rank-jumps
const rank_jumps = async function(req, res) {
  const startDate = req.query.start_date;
  const endDate = req.query.end_date;
  const topN = req.query.top_n ?? 10;
  if (!startDate || !endDate) return res.status(400).json({ error: 'start_date and end_date are required.' });
  connection.query(`
    SELECT
      p.player_id,
      p.name_first,
      p.name_last,
      sr.actual_start_date,
      er.actual_end_date,
      sr.start_rank,
      er.end_rank,
      (sr.start_rank - er.end_rank) AS rank_improvement
    FROM players p
    JOIN LATERAL (
      SELECT r.rank AS start_rank, r.ranking_date AS actual_start_date
      FROM rankings r
      WHERE r.player = p.player_id
        AND r.ranking_date <= '${startDate}'
      ORDER BY r.ranking_date DESC
      LIMIT 1
    ) sr ON TRUE
    JOIN LATERAL (
      SELECT r.rank AS end_rank, r.ranking_date AS actual_end_date
      FROM rankings r
      WHERE r.player = p.player_id
        AND r.ranking_date <= '${endDate}'
      ORDER BY r.ranking_date DESC
      LIMIT 1
    ) er ON TRUE
    WHERE (sr.start_rank - er.end_rank) > 0
    ORDER BY rank_improvement DESC
    LIMIT ${topN}
  `, (err, data) => {
    if (err) { console.log(err); res.json([]); }
    else res.json(data.rows);
  });
};

// ROUTE 5: GET /countries/top-tournament-hosts
const top_tournament_hosts = async function(req, res) {
  const levels = req.query.levels;
  const startDate = req.query.start_date;
  const endDate = req.query.end_date;
  const limit = req.query.limit ?? 10;
  if (!levels || !startDate || !endDate) return res.status(400).json({ error: 'levels, start_date, and end_date are required.' });
  const levelList = levels.split(',').map(l => `'${l.trim()}'`).join(', ');
  connection.query(`
    WITH filtered_tournaments AS (
      SELECT t.tourney_id, t.tourney_name, t.tourney_level, t.tourney_date
      FROM tournaments AS t
      WHERE t.tourney_level IN (${levelList})
        AND t.tourney_date BETWEEN '${startDate}' AND '${endDate}'
    ),
    tournament_countries AS (
      SELECT DISTINCT ft.tourney_id, v.country, v.venue AS venue
      FROM filtered_tournaments AS ft
      JOIN venues AS v ON ft.tourney_name ILIKE '%' || v.tourney_name|| '%'
    ),
    country_event_summary AS (
      SELECT
        tc.country,
        COUNT(DISTINCT tc.tourney_id) AS num_tournament_editions,
        COUNT(DISTINCT tc.venue) AS num_venues,
        COUNT(m.match_num) AS total_matches
      FROM tournament_countries AS tc
      LEFT JOIN matches AS m ON tc.tourney_id = m.tourney_id
      GROUP BY tc.country
    )
    SELECT country, num_tournament_editions, num_venues, total_matches
    FROM country_event_summary
    ORDER BY num_tournament_editions DESC, total_matches DESC, country ASC
    LIMIT ${limit}
  `, (err, data) => {
    if (err) { console.log(err); res.json([]); }
    else res.json(data.rows);
  });
};

// ROUTE 6: GET /players/titles_by_hand
const titles_by_hand = async function(req, res) {
  const hand = req.query.hand?.toUpperCase();
  if (!hand) return res.status(400).json({ error: 'hand is required (L, R, or A).' });
  connection.query(`
    WITH player_counts AS (
      SELECT hand, COUNT(*) AS num_players
      FROM players
      WHERE hand IS NOT NULL AND hand = '${hand}'
      GROUP BY hand
    ),
    champions AS (
      SELECT p.hand, COUNT(*) AS titles_won
      FROM matches AS m
      JOIN players AS p ON m.winner_id = p.player_id
      WHERE m.round = 'F'
        AND p.hand IS NOT NULL
        AND p.hand = '${hand}'
      GROUP BY p.hand
    )
    SELECT
      c.hand,
      c.titles_won,
      pc.num_players,
      (c.titles_won * 1.0) / pc.num_players AS titles_per_player
    FROM champions AS c
    JOIN player_counts AS pc ON c.hand = pc.hand
    ORDER BY titles_per_player DESC
  `, (err, data) => {
    if (err) { console.log(err); res.json({}); }
    else res.json(data.rows[0]);
  });
};

// ROUTE 7: GET /tournaments/difficulty
const tournament_difficulty = async function(req, res) {
  const tourneyName = (req.query.tourney_name ?? '').trim();
  const startDate = req.query.start_date;
  const endDate = req.query.end_date;
  const dateFilter = startDate && endDate
    ? `AND t.tourney_date BETWEEN '${startDate}' AND '${endDate}'`
    : '';
  connection.query(`
    WITH finals AS (
      SELECT tourney_id, winner_id
      FROM matches
      WHERE round = 'F'
    ),
    opponents AS (
      SELECT f.tourney_id, f.winner_id, m.loser_id AS opponent_id
      FROM finals f
      JOIN matches m ON f.tourney_id = m.tourney_id AND f.winner_id = m.winner_id
      WHERE EXISTS (
        SELECT 1 FROM matches m2
        WHERE m2.tourney_id = f.tourney_id AND m2.winner_id = f.winner_id
        GROUP BY m2.tourney_id, m2.winner_id HAVING COUNT(*) >= 3
      )
    ),
    opponent_rankings AS (
      SELECT o.tourney_id, o.winner_id, r.rank
      FROM opponents o
      JOIN tournaments t ON o.tourney_id = t.tourney_id
      JOIN rankings r ON r.player = o.opponent_id
        AND r.ranking_date = (
          SELECT MAX(r2.ranking_date) FROM rankings r2
          WHERE r2.player = o.opponent_id AND r2.ranking_date <= t.tourney_date
        )
    )
    SELECT
      t.tourney_name,
      t.tourney_date::DATE AS tourney_date,
      p.name_first || ' ' || p.name_last AS champion,
      ROUND(AVG(ora.rank), 2) AS avg_opponent_rank
    FROM opponent_rankings ora
    JOIN tournaments t ON ora.tourney_id = t.tourney_id
    JOIN players p ON ora.winner_id = p.player_id
    WHERE LOWER(t.tourney_name) LIKE LOWER('%${tourneyName}%')
    ${dateFilter}
    GROUP BY t.tourney_name, t.tourney_date, p.name_first, p.name_last
    ORDER BY avg_opponent_rank ASC
    LIMIT 30
  `, (err, data) => {
    if (err) { console.log(err); res.json([]); }
    else res.json(data.rows);
  });
};

// ROUTE 8: GET /players/grand-slam-titles
const grand_slam_titles = async function(req, res) {
  const firstName = req.query.first_name?.toUpperCase();
  const lastName = req.query.last_name?.toUpperCase();
  if (!firstName || !lastName) return res.status(400).json({ error: 'first_name and last_name are required.' });
  connection.query(`
    SELECT
      p.name_first,
      p.name_last,
      COUNT(CASE WHEN t.tourney_id IS NOT NULL THEN 1 END) AS total_grand_slam_titles,
      STRING_AGG(DISTINCT t.tourney_name, ', ' ORDER BY t.tourney_name) AS venues_won_at
    FROM players as p
    LEFT JOIN matches AS m ON m.winner_id = p.player_id AND m.round = 'F'
    LEFT JOIN tournaments AS t ON m.tourney_id = t.tourney_id AND t.tourney_level = 'G'
    WHERE p.name_first = '${firstName}'
      AND p.name_last = '${lastName}'
    GROUP BY p.name_first, p.name_last
  `, (err, data) => {
    if (err) { console.log(err); res.json({}); }
    else res.json(data.rows[0] ?? {});
  });
};

// ROUTE 9: GET /upsets
const upsets = async function(req, res) {
  const tournamentType = req.query.tournament_type.trim();
  const startDate = req.query.start_date;
  const endDate = req.query.end_date;
  const minRankDiff = req.query.min_rank_diff ?? 0;
  const topN = req.query.top_n ?? 10;
  if (!tournamentType || !startDate || !endDate) return res.status(400).json({ error: 'tournament_type, start_date, and end_date are required.' });
  connection.query(`
    SELECT
      t.tourney_name,
      CAST(t.tourney_date AS DATE) AS tourney_date,
      m.round,
      pw.name_first || ' ' || pw.name_last AS winner,
      rw.rank AS winner_rank,
      pl.name_first || ' ' || pl.name_last AS loser,
      rl.rank AS loser_rank,
      (rl.rank - rw.rank) AS rank_difference,
      m.score
    FROM matches m
    JOIN tournaments t ON m.tourney_id = t.tourney_id
    JOIN players pw ON m.winner_id = pw.player_id
    JOIN players pl ON m.loser_id = pl.player_id
    JOIN rankings rw ON rw.player = pw.player_id
      AND rw.ranking_date = (
        SELECT MAX(r2.ranking_date) FROM rankings r2
        WHERE r2.player = pw.player_id AND r2.ranking_date <= t.tourney_date
      )
    JOIN rankings rl ON rl.player = pl.player_id
      AND rl.ranking_date = (
        SELECT MAX(r3.ranking_date) FROM rankings r3
        WHERE r3.player = pl.player_id AND r3.ranking_date <= t.tourney_date
      )
    WHERE LOWER(t.tourney_name) LIKE LOWER('%${tournamentType}%')
      AND t.tourney_date BETWEEN '${startDate}' AND '${endDate}'
      AND (rw.rank - rl.rank) >= ${minRankDiff}
    ORDER BY rank_difference ASC
    LIMIT ${topN}
  `, (err, data) => {
    if (err) { console.log(err); res.json([]); }
    else res.json(data.rows);
  });
};

// ROUTE 10: GET /head_to_head
const head_to_head = async function(req, res) {
  const name_first_1 = req.query.name_first_1?.trim().toUpperCase();
  const name_last_1 = req.query.name_last_1?.trim().toUpperCase();
  const name_first_2 = req.query.name_first_2?.trim().toUpperCase();
  const name_last_2 = req.query.name_last_2?.trim().toUpperCase();
  if (!name_first_1 || !name_last_1 || !name_first_2 || !name_last_2)
    return res.status(400).json({ error: 'All four name parameters are required.' });
  connection.query(`
    WITH
    p1 AS (
      SELECT player_id, name_first, name_last FROM players
      WHERE name_first = '${name_first_1}' AND name_last = '${name_last_1}'
      LIMIT 1
    ),
    p2 AS (
      SELECT player_id, name_first, name_last FROM players
      WHERE name_first = '${name_first_2}' AND name_last = '${name_last_2}'
      LIMIT 1
    ),
    h2h AS (
      SELECT m.round, m.score, m.winner_id, m.loser_id,
             t.tourney_name, t.tourney_date, t.surface, t.tourney_level,
             p1.player_id AS p1_id, p2.player_id AS p2_id,
             INITCAP(p1.name_first || ' ' || p1.name_last) AS p1_name,
             INITCAP(p2.name_first || ' ' || p2.name_last) AS p2_name
      FROM matches m
      JOIN tournaments t ON t.tourney_id = m.tourney_id
      CROSS JOIN p1 CROSS JOIN p2
      WHERE (m.winner_id = p1.player_id AND m.loser_id = p2.player_id)
         OR (m.winner_id = p2.player_id AND m.loser_id = p1.player_id)
    )
    SELECT
      tourney_date::DATE AS tourney_date,
      tourney_name,
      CASE tourney_level
        WHEN 'G' THEN 'Grand Slam' WHEN 'M' THEN 'Masters 1000'
        WHEN 'F' THEN 'Tour Finals' WHEN 'A' THEN 'ATP 500 / 250'
        ELSE tourney_level END AS level,
      surface, round,
      CASE WHEN winner_id = p1_id THEN p1_name ELSE p2_name END AS winner,
      score
    FROM h2h
    ORDER BY tourney_date DESC
  `, (err, data) => {
    if (err) { console.log(err); res.json([]); }
    else res.json(data.rows);
  });
};

module.exports = {
  tournament_specialists, ranking_streaks, surface_specialists, rank_jumps,
  top_tournament_hosts, titles_by_hand, tournament_difficulty,
  grand_slam_titles, upsets, head_to_head,
};
