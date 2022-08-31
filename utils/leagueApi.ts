/**
 * Main exported class
 */
import axios, { AxiosError, AxiosRequestHeaders } from "axios";

// type ServerHeaders = {
//     eune: ServerURLString,
//     br: ServerURLString,
//     euw: ServerURLString,
//     jp: ServerURLString,
//     kr: ServerURLString,
//     la: ServerURLString,
//     na: ServerURLString,
//     oce: ServerURLString,
//     ru: ServerURLString,
//     tr: ServerURLString
// };

const ServerHeaders = {
    eune: 'eun1',
    br: 'br1',
    euw: 'euw1',
    jp: 'jp1',
    kr: 'kr',
    la: 'la1',
    na: 'na1',
    oce: 'oc1',
    ru: 'ru',
    tr: 'tr1'
} as const;

type ServerString = keyof typeof ServerHeaders;
type ServerURLString = string;

function getServerHeader(server: ServerString) {
    if (server in ServerHeaders) {
        return ServerHeaders[server] as ServerURLString;
    }
    throw Error('Invalid server type.');
}

function createBaseURL(server: string) {
    let server_string = server.trim().toLowerCase() as ServerString;
    let serverURLString = getServerHeader(server_string);
    return `https://${serverURLString}.api.riotgames.com`;
}

export interface SummonerDTO {
    accountId: string,
    profileIconId: number,
    revisionDate: number,
    name: string,
    id: EncryptedId,
    puuid: string,
    summonerLevel: number
}

export interface CurrentGameInfo {
    gameId: number,
    gameType: string,
    gameStartTime: number,
    mapId: number,
    gameLength: number,
    platformId: string,
    gameMode: string,
    bannedChampions: [BannedChampion],
    gameQueueConfigId: number,
    observers: Observer,
    participants: [CurrentGameParticipant]
}

interface BannedChampion {
    pickTurn: number,
    championId: number,
    teamId: number
}

interface Observer {
    encryptionKey: string
}

interface CurrentGameParticipant {
    championId: number,
    perks: Perks,
    profileIconId: number,
    bot: boolean,
    teamId: number,
    summonerName: string,
    summonerId: string,
    spell1Id: string,
    spell2Id: string,
    gameCustomizationObjects: [GameCustomizationObject]
}

interface Perks {
    perkIds: [number],
    perkStyle: number,
    perkSubStyle: number
}

interface GameCustomizationObject {
    category: string,
    content: string
}

type EncryptedId = string;



export class LeagueApi {
    displayname!: string;
    server!: string;
    // Summoner DTO
    private summoner!: SummonerDTO;
    // Riot API key
    private leagueApiKey!: string;

    constructor() { }

    /**
     * Async initializer
     * @param displayname
     * @param server
     * @param leagueApiKey
     */
    async init(displayname: string, server: string, leagueApiKey: string) {
        this.displayname = displayname;
        this.server = server;
        this.leagueApiKey = leagueApiKey;

        this.validatePresence();
        this.summoner = await this.getSummoner();
    }

    /**
     * Validates the presence of all necessary variables
     */
    validatePresence() {
        if (this.displayname == "" || this.displayname == null) {
            throw new Error('Display name cannot be empty.');
        }
        if (this.server == "" || this.server == null) {
            throw new Error('Server cannot be empty.');
        }
        if (this.leagueApiKey == "" || this.leagueApiKey == null) {
            throw new Error('leagueApiKey cannot be empty.');
        }
    }

    /**
     * Creates the auth header
     * @returns AxiosRequestHeaders
     */
    riotHeader(): AxiosRequestHeaders {
        return {
            "X-Riot-Token": this.leagueApiKey
        };
    }
    /**
     * Gets the users encrypted summoner ID
     * @returns Promise<SummonerDTO>
     */
    async getSummoner(): Promise<SummonerDTO> {
        try {
            let res = await axios.get<SummonerDTO>(createBaseURL + `/lol/summoner/v4/summoners/by-name/${this.displayname}`, {
                headers: this.riotHeader()
            });
            return res.data;

        } catch (err) {
            // TODO: better error handling
            if (!axios.isAxiosError(err)) {
                console.error('Something went wrong. Error dumped.');
                throw err;
            }
            const error = err as AxiosError;
            if (error.response) {
                debugger;
                if (error.response!.status === 401) {
                    throw new Error("Your API key has expired.");
                }
                if (error.response!.status === 404) {
                    throw new Error(`${this.displayname} was not found on ${this.server}.`);
                }
                if ([500, 502, 503, 504].includes(error.response!.status)) {
                    throw new Error("Riot-side API issue. Try again in a while.");
                }
                throw new Error(`Error code: ${error.response!.status}. Something went wrong.`);
            } else {
                throw new Error("Something went wrong. Try checking your connection.");
            }
        }
    }

    /**
     * Gets the current game of the user
     * @returns Promise<CurrentGameInfo>
     */
    async getCurrentGame(): Promise<CurrentGameInfo> {
        let id: EncryptedId = this.summoner.id;
        try {
            let res = await axios.get<CurrentGameInfo>(createBaseURL + `/lol/spectator/v4/active-games/by-summoner/${id}`, {
                headers: this.riotHeader()
            });
            return res.data;
        } catch (err) {
            // TODO: better error handling
            if (!axios.isAxiosError(err)) {
                console.error('Something went wrong. Error dumped.');
                throw err;
            }
            const error = err as AxiosError;
            if (error.response) {
                debugger;
                if (error.response!.status === 401) {
                    throw new Error("Your API key has expired.");
                }
                if (error.response!.status === 404) {
                    throw new Error(`${this.displayname} is not in a game.`);
                }
                if ([500, 502, 503, 504].includes(error.response!.status)) {
                    throw new Error("Riot-side API issue. Try again in a while.");
                }
                throw new Error(`Error code: ${error.response!.status}. Something went wrong.`);
            } else {
                throw new Error("Something went wrong. Try checking your connection.");
            }
        }
    }


}
