const express = require("express");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
app.use(express.json());
const dbpath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server running");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
  }
};
initializeDbAndServer();
const convertDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};
const convertMatchToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};
const convertPlayerMatchScoreObject = (dbObject) => {
  return {
    playerMatchId: dbObject.player_match_id,
    playerId: dbObject.player_id,
    matchId: dbObject.match_id,
    score: dbObject.score,
    fours: dbObject.fours,
    sixes: dbObject.sixes,
  };
};

///
app.get("/players/", async (request, response) => {
  const getPlayerQuery = `SELECT * FROM  player_details;`;
  const dbResponse = await db.all(getPlayerQuery);
  response.send(
    dbResponse.map((eachPlayer) => convertDbObjectToResponseObject(eachPlayer))
  );
});
///
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerDetails = `SELECT * FROM player_details WHERE player_id=${playerId};`;
  const player = await db.get(getPlayerDetails);
  response.send(convertDbObjectToResponseObject(player));
});
///
app.put("/players/:playerId/", async (request, response) => {
  const { playerName } = request.body;
  const { playerId } = request.params;
  const updatePlayerQuery = `
  UPDATE
    player_details
  SET
    player_name = '${playerName}'
     
  WHERE
    player_id = ${playerId};`;

  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});
///
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `SELECT * FROM match_details WHERE match_id=${matchId};`;
  const dbResponse = await db.all(getMatchQuery);
  response.send(dbResponse.map((each) => convertMatchToResponseObject(each)));
});
//
app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getMatches = `SELECT * FROM player_match_score NATURAL JOIN match_details
  WHERE player_id=${playerId};`;
  const playerMatches = await db.all(getMatches);

  response.send(
    playerMatches.map((each) => convertMatchToResponseObject(each))
  );
});
///
app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetails = `SELECT * FROM player_match_score NATURAL JOIN  player_details WHERE match_id=${matchId}; `;

  const playerArray = await db.all(getMatchDetails);

  response.send(
    playerArray.map((each) => convertDbObjectToResponseObject(each))
  );
});
///
app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const sqlQuery = `SELECT player_details.player_id AS playerId,player_details.player_name AS playerName,SUM(player_match_score.score)AS totalScore,SUM(fours)AS totalFours,SUM(sixes)AS totalSixes FROM
    player_details INNER JOIN player_match_score ON player_details.player_id=player_match_score.player_id WHERE player_details.player_id=${playerId};`;
  const dbResponse = await db.all(sqlQuery);
  response.send(dbResponse);
});
module.exports = app;
