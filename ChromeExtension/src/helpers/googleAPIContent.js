import { CORS_PROXY_URL, GOOGLE_DOCS_MACRO, GOOGLE_DOCS_API } from '../settings';

class googleAPI {
    setToken (token) {
        this.token = token;
    }

    getToken () {
        return this.token;
    }

    async createGoogleDoc (title) {
        const init = this.createInit('POST', { title });
        const response = await fetch(GOOGLE_DOCS_API, init).then((response) => response.json());
        return response;
    }

    async executeAppScript (documentId) {
        const init = this.createInit('GET');
        const response = await fetch(`${CORS_PROXY_URL}/${GOOGLE_DOCS_MACRO}/exec?id=${documentId}`, init)
            .then(response => response.json());
        return response;
    }

    createInit (type, data = null) {
        if (data)
            return {
                "method": type,
                headers: {
                    Authorization: "Bearer " + this.token
                },
                "contentType" : "application/json",
                "body": JSON.stringify(data)
            }
        else
            return {
                "method": type,
                headers: {
                    Authorization: "Bearer " + this.token
                },
                "contentType" : "application/json"
            }
    }
}

const GoogleAPI = new googleAPI();
export default GoogleAPI;