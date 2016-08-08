var request = require('request');

var config = {
    mail:       process.env.NICONICO_ACCOUNT_MAIL,
    password:   process.env.NICONICO_ACCOUNT_PASSWORD,
    mylistId:   process.env.NICONICO_MYLIST_ID,
    mylistSize: process.env.NICONICO_MYLIST_SIZE
};

var session = '';
var token = '';

function getSession(callback) {
    var options = {
        url: 'https://secure.nicovideo.jp/secure/login',
        form: {
            mail: config.mail,
            password: config.password
        }
    };
    request.post(options, function(error, response) {
        if (error) {
            throw error;
        }
        var session = null;
        var cookies = response.headers['set-cookie'] || [];
        for (var i = 0; i < cookies.length; ++i) {
            var cookie = cookies[i];
            if (cookie.match(/^user_session=user_session/)) {
                session = cookie.slice(0, cookie.indexOf(';'));
            }
        }
        callback(session);
    });
}

function getToken(session, callback) {
    var options = {
        url: 'http://www.nicovideo.jp/my/mylist',
        headers: {
            Cookie: session
        }
    };
    request.get(options, function(error, response, body) {
        if (error) {
            throw error;
        }
        callback(body.match(/NicoAPI\.token = "([\w-]+)";/)[1]);
    });
}

function addSessionToken(options, session, token) {
    if (!options.hasOwnProperty('headers')) {
        options.headers = {};
    }
    options.headers.Cookie = session;
    if (!options.hasOwnProperty('qs')) {
        options.qs = {};
    }
    options.qs.token = token;
}

function getWithSessionToken(options, callback) {
    addSessionToken(options, session, token);
    request.get(options, function(error, response, body) {
        var obj = JSON.parse(body);
        if (obj.hasOwnProperty('error') && obj.error.code == 'NOAUTH') {
            getSession(function(_session) {
                getToken(_session, function(_token) {
                    session = _session;
                    token = _token;
                    addSessionToken(options, session, token);
                    request.get(options, callback);
                })
            });
        } else {
            callback(error, response, body);
        }
    });
}

function addToMylist(itemId, callback) {
    var options = {
        url: 'http://www.nicovideo.jp/api/mylist/add',
        qs: {
            group_id: config.mylistId,
            item_id:  itemId
        }
    };
    getWithSessionToken(options, callback);
}

function getMyList(callback) {
    var options = {
        url: 'http://www.nicovideo.jp/api/mylist/list',
        qs: {
            group_id: config.mylistId,
        }
    };
    getWithSessionToken(options, callback);
}

function deleteFromMylist(itemId, callback) {
    var options = {
        url: 'http://www.nicovideo.jp/api/mylist/delete',
        qs: {
            group_id: config.mylistId,
            'id_list[0][]': itemId
        }
    };
    getWithSessionToken(options, callback);
}

function popMylist(callback) {
    getMyList(function(error, response, body) {
        var obj = JSON.parse(body);
        if (obj.mylistitem.length > config.mylistSize) {
            var minCreateTime = 0;
            var itemId = null;
            for (var i = 0; i < obj.mylistitem.length; ++i) {
                if (itemId == null || minCreateTime > obj.mylistitem[i].create_time) {
                    minCreateTime = obj.mylistitem[i].create_time;
                    itemId = obj.mylistitem[i].item_id;
                }
            }
            console.log('Delete ' + itemId);
            deleteFromMylist(itemId, function(error, response, body) {
                callback();
            });
        } else {
            callback();
        }
    });
}

module.exports = function(robot) {
    
    robot.respond(/http:\/\/(www\.nicovideo\.jp\/watch|nico\.ms)\/(\w+)[^\s\/]*(\s|$)/, function(msg) {
        var itemId = msg.match[2];
        addToMylist(itemId, function(error, response, body) {
            console.log(body);
            var obj = JSON.parse(body);
            if (obj.hasOwnProperty('error')) {
                if (obj.error.code == 'EXIST') {
                    msg.send(itemId + 'はすでに共有マイリストに登録されています');
                }
            } else {
                popMylist(function() {
                    msg.send(itemId + 'を共有マイリストに登録しました');
                });
            }
        });
    });

    robot.respond(/(list|リスト)/i, function(msg) {
        msg.send('http://www.nicovideo.jp/mylist/' + config.mylistId);
    });
    
};
