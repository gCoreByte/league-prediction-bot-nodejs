/**
 * This test suite provides unit tests for everything in the utils/leagueApi.ts file
 */

import { LeagueApi, SummonerDTO } from "../../utils/leagueApi";
import axios from "axios";

const displayname = 'gCoreByte';
const server = 'eune';
const leagueApiKey = 'APIKEY';

// TODO: Move to different file
/**
 * Axios mock responses
 */
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

/**
 * Generic mocked types
 */
const summonerDTO: SummonerDTO = {
  accountId: 'account ID',
  profileIconId: 1,
  revisionDate: 1,
  name: 'account name',
  id: 'encrypted id',
  puuid: 'puuid',
  summonerLevel: 30
};

/**
 * Test suite
 */
describe('LeagueApi', () => {
  let leagueApi: LeagueApi;
  beforeEach(() => {
    leagueApi = new LeagueApi();
  });
  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe('#init', () => {
    describe('has invalid parameters', () => {
      it('has no name', async () => {
        await expect(leagueApi.init('', server, leagueApiKey))
            .rejects.toThrowError(new Error('Display name cannot be empty.'));
      });
      it('has no server', async () => {
        await expect(leagueApi.init(displayname, '', leagueApiKey))
            .rejects.toThrowError(new Error('Server cannot be empty.'));
      });
      it('has no api key', async () => {
        await expect(leagueApi.init(displayname, server, ''))
            .rejects.toThrowError(new Error('leagueApiKey cannot be empty.'));
      });
    });
    it('is valid', async () => {
      jest.spyOn(leagueApi, 'getSummoner').mockResolvedValue(summonerDTO);
      await leagueApi.init(displayname, server, leagueApiKey);
      expect(leagueApi.displayname).toEqual(displayname);
      expect(leagueApi.server).toEqual(server);
    });
  });
  describe('#getSummoner', () => {
    beforeEach(async () => {
      jest.spyOn(leagueApi, 'getSummoner').mockResolvedValueOnce(summonerDTO);
      await leagueApi.init(displayname, server, leagueApiKey);
      jest.spyOn(leagueApi, 'getSummoner').mockClear();
    });
    it('returns 200', async () => {
      mockedAxios.get.mockResolvedValueOnce({status: 200, data: summonerDTO});
      let data = await leagueApi.getSummoner();
      expect(data).toEqual(summonerDTO);
    });
    it('returns 404', async () => {
      mockedAxios.get.mockRejectedValueOnce({response: {status: 404}});
      mockedAxios.isAxiosError.mockReturnValueOnce(true);
      await expect(leagueApi.getSummoner()).rejects.toThrowError(new Error('gCoreByte was not found on eune.'));
    });
  })
});
