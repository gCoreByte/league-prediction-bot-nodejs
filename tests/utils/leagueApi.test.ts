/**
 * This test suite provides unit tests for everything in the utils/leagueApi.ts file
 */

import { LeagueApi } from "../../utils/leagueApi";

const displayname = 'gCoreByte';
const server = 'euw';
const leagueApiKey = 'APIKEY';

// TODO: Move to different file
/**
 * Axios mock responses
 */

describe('LeagueApi', () => {
  let leagueApi;
  beforeEach(() => {
    leagueApi = new LeagueApi();
  });
  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });
});
