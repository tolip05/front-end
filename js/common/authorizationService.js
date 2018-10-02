var app = app || {};

let auth = {};

function saveCredentials(credentials) {
    auth['token'] = credentials;
    auth['role'] = JSON.parse(
        atob(credentials.split('.')[1])
    )['role'];
}

function getCredentials() {
    if(auth['token']) return 'Bearer ' + auth['token'];
}

function getRole() {
    if(auth['role']) return auth['role'];
}

function evictCredentials() {
    auth = {};
}

app.authorizationService = (function () {
    return {
        saveCredentials: saveCredentials,
        getCredentials: getCredentials,
        getRole: getRole,
        evictCredentials: evictCredentials
    };
})();