import config from "config";
import {LeagueApi, CurrentGameInfo} from "./utils/leagueApi";
import {TwitchApi} from "./utils/twitchApi";

import {AsyncTask, SimpleIntervalJob, ToadScheduler} from "toad-scheduler";

const display_name: string = config.get('league.display_name');
const server: string = config.get('league.server');
const api_key: string = config.get('league.api_key');

const broadcaster_name: string = config.get('twitch.broadcaster_name');
const token: string = config.get('twitch.token');
const client_id: string = config.get('twitch.client_id');


// Set up league API.
const leagueApi = new LeagueApi();
// leagueApi.init(display_name, server, api_key).then(r => console.log('done'));

// Set up twitch API.
const twitchApi = new TwitchApi();
// twitchApi.init(broadcaster_name, token, client_id).then(r => console.log('done'));

let ingame = false;

let leagueInit = false;
let twitchInit = false;

const scheduler = new ToadScheduler();
const task = new AsyncTask(
    'check_game',
    async () => { await main(); }
)

const job = new SimpleIntervalJob({ minutes: 2, runImmediately: true}, task);
scheduler.addSimpleIntervalJob(job);

async function main() {
    if (!leagueInit) {
        leagueInit = true;
        await leagueApi.init(display_name, server, api_key);
        console.log('League API initialized.');
    }
    if (!twitchInit) {
        twitchInit = true;
        await twitchApi.init(broadcaster_name, token, client_id)
        console.log('Twitch API initialized.');
    }
    let game = await leagueApi.getCurrentGame();
    console.log("Got current game.");
    console.log("In game: " + game !== null);
    if (game === null && !ingame) { return; }
    if (game !== null && !ingame) {
        console.log("Starting prediction loop.");
        ingame = true;
        let prediction = await twitchApi.getLastPrediction();
        if (prediction === null || ['ACTIVE', 'LOCKED'].includes(prediction.status)) { return; }
        console.log("Creating prediction.");
        await twitchApi.createPrediction();
        return;
    }
    if (game !== null && ingame) { return; }
    if (game === null && ingame) {
        ingame = false;
        console.log("Starting end prediction loop.");
        let prediction = await twitchApi.getLastPrediction();
        if (prediction === null || ['RESOLVED', 'CANCELLED']) { return; }
        console.log("Getting the winner.");
        let isWinner: boolean = await leagueApi.isWinner();
        console.log("Closing prediction.");
        await twitchApi.closePrediction(isWinner);
        return;
    }
}
