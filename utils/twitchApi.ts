import axios, {AxiosError} from "axios";
import { ToadScheduler, AsyncTask, SimpleIntervalJob } from "toad-scheduler";
import {string} from "yaml/dist/schema/common/string";

type APIToken = string;
type ClientID = string;
type ClientSecret = string;

interface OAuthValidate {
    client_id: ClientID,
    login: string,
    scopes: [],
    user_id: string,
    expires_in: number
}

interface Users {
    data: User[]
}

interface User {
    id: string,
    login: string,
    display_name: string,
    type: string,
    broadcaster_type: string,
    description: string,
    profile_image_url: string,
    offline_image_url: string,
    view_count: number,
    email: string,
    created_at: string
}

interface Predictions {
    data: Prediction[],
    pagination: {}
}

interface Prediction {
    id: string,
    broadcaster_id: string,
    broadcaster_name: string,
    broadcaster_login: string,
    title: string,
    winning_outcome_id: string | null,
    outcomes: Outcome[],
    prediction_window: number,
    status: string,
    created_at: string,
    ended_at: string | null,
    locked_at: string | null
}

interface Outcome {
    id: string,
    title: string,
    users: number,
    channel_points: number,
    top_predictors: TopPredictor[] | null,
    color: string
}

interface TopPredictor {
    id: string,
    name: string,
    login: string,
    channel_points_used: number,
    channel_points_won: number
}

export class TwitchApi {
    scheduler!: ToadScheduler;
    private token!: APIToken;
    private client_id!: ClientID;
    private client_secret!: ClientSecret;
    private broadcaster_id!: string;
    private refresh_token!: APIToken;
    broadcaster_name!: string
    private last_prediction!: string;
    private last_winning_id!: string;
    private last_losing_id!: string;

    constructor() { }

    /**
     * Async constructor
     * @param broadcaster_name
     * @param token - twitch oauth token
     * @param client_id
     */
    async init(broadcaster_name: string, token: string, client_id: string) {
        this.broadcaster_name = broadcaster_name;
        this.token = token;
        this.client_id = client_id;

        // twitch api states we need to validate once per hour
        this.scheduler = new ToadScheduler();

        // check tokens
        let validateTask = new AsyncTask('ValidateTwitchToken', async () => {
            await this.validateTwitchToken()
        });
        let validate = new SimpleIntervalJob({ hours: 1, runImmediately: true }, validateTask);
        this.scheduler.addSimpleIntervalJob(validate);

        this.broadcaster_id = await this.getBroadcasterId();
    }

    /**
     * Formats auth headers
     * @returns {{Authorization: string, "Client-ID": string}}
     */
    getTwitchHeaders() {
        return {
            'Authorization': `Bearer ${this.token}`,
            'Client-Id': this.client_id
        };
    }

    /**
     * Validate our OAuth token. If this fails, it will prepare to fallback to the refundless program
     */
    async validateTwitchToken() {
        try {
            let res = await axios.get<OAuthValidate>('https://id.twitch.tv/oauth2/validate', {
                headers: { 'Authorization': `OAuth ${this.token}` }
            });
        } catch (err) {
            // TODO: better error handling
            if (!axios.isAxiosError(err)) {
                console.error('Something went wrong. Error dumped.');
                throw err;
            }
            const error = err as AxiosError;
            if (error.response) {
                if (error.response!.status === 401) {
                    throw new Error("Token has expired.");
                    // TODO: request new token with refresh token.
                }
                if ([500, 502, 503, 504].includes(error.response!.status)) {
                    throw new Error("Twitch API issue. Try again in a while.");
                }
                throw new Error(`Error code: ${error.response!.status}. Something went wrong.`);
            } else {
                throw new Error("Something went wrong. Try checking your connection.");
            }
        }
    }

    /**
     * Gets current broadcaster_id from channel_name
     */
    async getBroadcasterId() {
        try {
            let res = await axios.get<Users>('https://api.twitch.tv/helix/users',
                {
                    params: { 'login': this.broadcaster_name },
                    headers: this.getTwitchHeaders()
                });
            return res.data.data[0].id;
        } catch (error) {
            let err = error as AxiosError;
            throw error;
            //throw new Error(`Failed to get broadcaster_id with error code: ${err.response!.status}`);
        }
    }

    async getLastPrediction() {
        try {
            let res = await axios.get<Predictions>('https://api.twitch.tv/helix/predictions',
                {
                    headers: this.getTwitchHeaders(),
                    params: {
                        'broadcaster_id': this.broadcaster_id,
                        'first': '1'
                    }
                });
            if (res.data.data.length === 0) {
                return null;
            }
            return res.data.data[0];
        } catch (err) {
            let error = err as AxiosError;
            throw new Error(`Failed to get prediction with error code: ${error.response!.status}`);
        }
    }

    async createPrediction() {
        try {
            let res = await axios.post<Predictions>('https://api.twitch.tv/helix/predictions',
                {
                        'broadcaster_id': this.broadcaster_id,
                        'title': 'Will we get a big W?',
                        'outcomes':[
                            {
                                'title': 'YES 110%'
                            },
                            {
                                'title': 'nope teams fault'
                            }
                        ],
                        'prediction_window': 120
                }, {
                    headers: this.getTwitchHeaders()
                });
            this.last_prediction = res.data.data[0].id;
            this.last_winning_id = res.data.data[0].outcomes[0].id;
            this.last_losing_id = res.data.data[0].outcomes[1].id;
        } catch (err) {
            let error = err as AxiosError;
            throw new Error(`Failed to create prediction with error code: ${error.response!.status}`);
        }
    }

    async closePrediction(won: boolean) {
        try {
            let outcome: string;
            if (won) {
                outcome = this.last_winning_id;
            } else {
                outcome = this.last_losing_id;
            }
            let res = await axios.patch<Predictions>('https://api.twitch.tv/helix/predictions',
                {
                        'broadcaster_id': this.broadcaster_id,
                        'id': this.last_prediction,
                        'status': 'RESOLVED',
                        'winning_outcome_id': outcome
                    }, {
                    headers: this.getTwitchHeaders(),
                });
        } catch (err) {
            let error = err as AxiosError;
            throw new Error(`Failed to create prediction with error code: ${error.response!.status}`);
        }
    }
}