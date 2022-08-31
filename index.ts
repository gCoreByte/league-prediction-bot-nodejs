import config from "config";
import {LeagueApi, CurrentGameInfo} from "./utils/leagueApi";

const display_name: string = config.get('league.display_name');
const server: string = config.get('league.server');
const api_key: string = config.get('league.api_key');

const leagueApi = new LeagueApi();
leagueApi.init(display_name, server, api_key).then();


