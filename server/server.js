const express = require('express');
const cors = require('cors');
const config = require('./config.json');
const routes = require('./routes');

const app = express();
app.use(cors({ origin: '*' }));

app.get('/tournament_specialists', routes.tournament_specialists);
app.get('/rankings/streaks', routes.ranking_streaks);
app.get('/surface_specialists', routes.surface_specialists);
app.get('/players/rank-jumps', routes.rank_jumps);
app.get('/countries/top-tournament-hosts', routes.top_tournament_hosts);
app.get('/players/titles_by_hand', routes.titles_by_hand);
app.get('/tournaments/difficulty', routes.tournament_difficulty);
app.get('/players/grand-slam-titles', routes.grand_slam_titles);
app.get('/upsets', routes.upsets);
app.get('/head_to_head', routes.head_to_head);

app.listen(config.server_port, () => {
  console.log(`Server running at http://${config.server_host}:${config.server_port}/`);
});

module.exports = app;
