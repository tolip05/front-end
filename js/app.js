let constants = {
    serviceUrl: "http://127.0.0.1:8000"
};

function loadNavbar() {
    if (app.authorizationService.getRole() === 'ADMIN') {
        app.templateLoader.loadTemplate('.navbar-holder', 'navbar-admin');
    } else if (app.authorizationService.getRole() === 'MODERATOR') {
        app.templateLoader.loadTemplate('.navbar-holder', 'navbar-moderator');
    } else if (app.authorizationService.getRole() === 'USER') {
        app.templateLoader.loadTemplate('.navbar-holder', 'navbar-user');
    } else {
        app.templateLoader.loadTemplate('.navbar-holder', 'navbar-guest');
    }
}

app.router.on('#/', null, function () {
    loadNavbar();
    app.templateLoader.loadTemplate('.app', 'home-guest');
});

app.router.on("#/home", null, function () {
    $.ajax({
        type: 'GET',
        url: constants.serviceUrl + '/watches/top',
        headers: {
            'Authorization': app.authorizationService.getCredentials()
        }
    }).done((data) => {
        loadNavbar();

        app.templateLoader.loadTemplate('.app', 'home-user', function () {
            for (let elem of data) {
                $('.watches')
                    .append('<div class="col-md-3">'
                        + '<div class="watch-image text-center">'
                        + '<img src="' + elem['image'] + '" class="img-thumbnail" width="200" height="200">'
                        + '</div>'
                        + '<div class="watch-name mt-2">'
                        + '<h4 class="text-center">' + elem['name'] + '</h4>'
                        + '</div>'
                        + '<div class="watch-price mt-2">'
                        + '<h4 class="text-center">$' + elem['price'] + '</h4>'
                        + '</div>'
                        + '<div class="watch-link">'
                        + '<a class="nav-link text-center" href="#/watches/details?id=' + elem['id'] + '">'
                        + '<h4>Details</h4>'
                        + '</a>'
                        + '</div>');
            }
        });
    }).fail((err) => {
        console.log(err);
    });
});

app.router.on("#/users/login", null, function () {
    app.templateLoader.loadTemplate('.app', 'login', function () {
        $('#login-user').click(function (e) {
            let username = $('#username').val();
            let password = $('#password').val();

            $.ajax({
                type: 'POST',
                url: constants.serviceUrl + '/login',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: JSON.stringify({
                    "username": username,
                    "password": password
                })
            }).done((data, status, request) => {
                let authToken = data.split('Bearer ')[1];
                app.authorizationService.saveCredentials(authToken);

                window.location.href = '#/home';
            }).fail((err) => {
                console.log(err);
            });
        });
    });
});

app.router.on("#/users/register", null, function () {
    app.templateLoader.loadTemplate('.app', 'register', function () {
        $('#register-user').click(function (e) {
            let username = $('#username').val();
            let password = $('#password').val();
            let confirmPassword = $('#confirmPassword').val();

            $.ajax({
                type: 'POST',
                url: constants.serviceUrl + '/users/register',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: JSON.stringify({
                    "username": username,
                    "password": password,
                    "confirmPassword": confirmPassword
                })
            }).done((data) => {
                window.location.href = '#/users/login';
            }).fail((err) => {
                console.log(err);
            });
        });
    });
});

app.router.on("#/users/logout", null, function () {
    app.authorizationService.evictCredentials();
    window.location.href = '#/';
});

app.router.on("#/users/all", null, function () {
    $.ajax({
        type: 'GET',
        url: constants.serviceUrl + '/users/all',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': app.authorizationService.getCredentials()
        }
    }).done((data) => {
        app.templateLoader.loadTemplate('.app', 'users-all', function () {
            let i = 1;

            for (let elem of data.sort((first, second) => {
                if(first['role'] > second['role']) return 1;
                if(first['role'] < second['role']) return -1;
                return 0;
            })) {
                let uniqueElementId = elem['id'];
                let actionsId = 'actions-' + uniqueElementId;

                $('.all-users')
                    .append('<tr class="row">'
                        + '<td class="col-md-1" scope="col"><h5>' + i + '</h5></td>'
                        + '<td class="col-md-5" scope="col"><h5>' + elem['username'] + '</h5></td>'
                        + '<td class="col-md-3" scope="col"><h5>' + elem['role'] + '</h5></td>'
                        + '<td id="' + actionsId + '" class="col-md-3 d-flex justify-content-between" scope="col">'
                        + '</td>'
                        + '</tr>');

                if (elem['role'] === 'USER') {
                    $('#' + actionsId)
                        .append('<h5><button class="btn btn-primary promote-button">Promote</button></h5>')
                } else if (elem['role'] === 'ADMIN') {
                    $('#' + actionsId)
                        .append('<h5><button class="btn btn-danger demote-button">Demote</button></h5>');
                } else {
                    $('#' + actionsId)
                        .append('<h5><button class="btn btn-primary promote-button">Promote</button></h5>')
                        .append('<h5><button class="btn btn-danger demote-button">Demote</button></h5>');
                }

                $('#' + actionsId + '>h5>.promote-button').click(function (e) {
                    $.ajax({
                        type: 'POST',
                        url: constants.serviceUrl + '/users/promote?id=' + uniqueElementId,
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': app.authorizationService.getCredentials()
                        }
                    }).done(function (data) {
                        console.log(data);
                    }).fail(function (err) {
                        console.log(err);
                    }).always(function () {
                        app.router.reload('#/users/all');
                    })
                });

                $('#' + actionsId + '>h5>.demote-button').click(function (e) {
                    $.ajax({
                        type: 'POST',
                        url: constants.serviceUrl + '/users/demote?id=' + uniqueElementId,
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': app.authorizationService.getCredentials()
                        }
                    }).done(function (data) {
                        console.log(data);
                    }).fail(function (err) {
                        console.log(err);
                    }).always(function () {
                        app.router.reload('#/users/all');
                    });
                });

                $('#refresh-users-button').click(function() {
                    app.router.reload('#/users/all');
                });

                i++;
            }
        });
    }).fail((err) => {
        console.log(err);
    });
});

app.router.on("#/watches/all", null, function () {
    $.ajax({
        type: 'GET',
        url: constants.serviceUrl + '/watches/all',
        headers: {
            'Authorization': app.authorizationService.getCredentials()
        }
    }).done((data) => {
        app.templateLoader.loadTemplate('.app', 'watches-all', function () {
            let i = 1;

            for (let elem of data) {
                $('.all-watches')
                    .append('<tr class="row">'
                        + '<td class="col-md-1" scope="col"><h5>' + i + '</h5></td>'
                        + '<td class="col-md-5" scope="col"><h5>' + elem['name'] + '</h5></td>'
                        + '<td class="col-md-4" scope="col"><h5>$' + elem['price'] + '</h5></td>'
                        + '<td class="col-md-2" scope="col">'
                        + '<h5>'
                        + '<a class="nav-link nav-link-black p-0" href="#/watches/details?id=' + elem['id'] + '">Details</a>'
                        + '</h5>'
                        + '</td>'
                        + '</tr>');

                i++;
            }
        });
    }).fail((err) => {
        console.log(err);
    });
});

app.router.on("#/watches/add", null, function () {
    app.templateLoader.loadTemplate('.app', 'watches-add', function () {
        $('#submit-watch').click(function (e) {
            let name = $('#name').val();
            let price = $('#price').val();
            let image = $('#image').val();
            let description = $('#description').val();

            $.ajax({
                type: 'POST',
                url: constants.serviceUrl + '/watches/add',
                headers: {
                    'Authorization': app.authorizationService.getCredentials()
                },
                data: {
                    name: name,
                    price: price,
                    image: image,
                    description: description
                }
            }).done((data) => {
                window.location.href = '#/';
            }).fail((err) => {
                console.log(err);
            });
        })
    });
});

app.router.on('#/watches/details', ['id'], function (id) {
    $.ajax({
        type: 'GET',
        url: constants.serviceUrl + '/watches/details?id=' + id,
        headers: {
            'Authorization': app.authorizationService.getCredentials()
        }
    }).done((data) => {
        app.templateLoader.loadTemplate('.app', 'watches-details', function () {
            $('.watch-details')
                .append('<div class="col-md-5">'
                    + '<div class="watch-image text-center">'
                    + '<img src="' + data['image'] + '" class="img-thumbnail" width="500" height="500">'
                    + '</div>'
                    + '</div>'
                    + '<div class="col-md-5 d-flex flex-column">'
                    + '<h1 class="text-center">' + data['name'] + '</h1>'
                    + '<h2 class="text-center">Price: $' + data['price'] + '</h2>'
                    + '<h2 class="text-center mt-3">Viewed: ' + data['views'] + ' times</h2>'
                    + '<h2 class="text-center mt-3">Description</h2>'
                    + '<p class="mt-3 text-center">'
                    + data['description']
                    + '</p>'
                    + '</div>');
        });
    }).fail((err) => {
        console.log(err);
    });

    app.templateLoader.loadTemplate('.app', 'watches-details');
});

window.location.href = '#/';