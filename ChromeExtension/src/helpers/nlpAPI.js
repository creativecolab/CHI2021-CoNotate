import { SERVER_API_URL } from '../settings';

class nlpAPI {
    async generateSuggestions_retry (query, autoComplete, note, serp, n) {
        for (let i = 1; i <= n; i++) {
            try {
                return await fetch(
                    `${SERVER_API_URL}:4000/all_in_one_json`,
                    {
                        method: 'POST',
                        'contentType': 'json',
                        body: JSON.stringify({
                            query,
                            autoComplete,
                            note,
                            serp
                        })
                    }
                ).then(res => res.json());
            } catch(e) {
                if (i === n) throw Error;
            }
        }
    }
}

const NlpAPI = new nlpAPI();
export default NlpAPI;