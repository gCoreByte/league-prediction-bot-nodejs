/**
 * Main exported class
 */
import axios, {Axios, AxiosError} from "axios";

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

function getServerHeader(server: string) {
    server = server.toLowerCase().trim();
    if (server in ServerHeaders) {
        return ServerHeaders[server as keyof typeof ServerHeaders] as string;
    }
    throw Error('Invalid server type.');
}

interface SummonerDTO {
    accountId: string,
    profileIconId: number,
    revisionDate: number,
    name: string,
    id: string,
    puuid: string,
    summonerLevel: number
}



export class LeagueApi {
    private username: string;
    private server: string;
    // Encrypted summoner ID
    private summonerId: string;
    private leagueApiKey: string;

    constructor() {
        this.username = "";
        this.server = "";
        this.summonerId = "";
        this.leagueApiKey = "";
    }

    /**
     * Async initializer
     * @param username
     * @param server
     */
    async init(username: string, server: string, leagueApiKey: string) {
        this.username = username;
        this.server = server;
        this.leagueApiKey = leagueApiKey;

        this.summonerId = await this.getSummonerId();
    }

    validatePresence() {
        if (this.username == "" || this.username == null) {
            throw Error('Username cannot be empty.');
        }
        if (this.server == "" || this.server == null) {
            throw Error('Server cannot be empty.');
        }
        if (this.leagueApiKey == "" || this.leagueApiKey == null) {
            throw Error('leagueApiKey cannot be empty.');
        }
    }

    riotHeader() {
        return {
            "X-Riot-Token": this.leagueApiKey
        };
    }
    /**
     * Gets the users encrypted summoner ID
     * @param username
     * @param server
     */
    async getSummonerId(username = this.username, server = this.server) {
        try {
            let res = await axios.get<SummonerDTO>(`https://${getServerHeader(server)}`, {
                headers: this.riotHeader()
            });

        } catch (err) {
            if (!axios.isAxiosError(err)) {
                console.error('Something went wrong. Error dumped.');
                console.error(err);
            }
            const error = err as AxiosError;
            if (error.response) {
                // TODO: handle errors
            } else {
                console.error("Something went wrong.");
                console.error("Try checking your connection.");
            }
        }
    }


}