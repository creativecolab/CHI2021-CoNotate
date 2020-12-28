import { GOOGLE_AUTOSUGGESTION_API } from '../settings';

class googleAPI {
    async autoComplete_retry (query, n) {
        for (let i = 1; i <= n; i++) {
            try {
                return await fetch(`${GOOGLE_AUTOSUGGESTION_API}&q=${query}`).then(res => res.json());
            } catch(e) {
                if (i === n) throw Error;
            }
        }
    }
}

const GoogleAPI = new googleAPI();
export default GoogleAPI;