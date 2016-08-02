request = require('request');

config = {
    mail:     process.env.NICONICO_ACCOUNT_MAIL,
    password: process.env.NICONICO_ACCOUNT_PASSWORD,
    mylistId: process.env.NICONICO_MYLIST_ID
};

module.exports = function(robot) {
    
    robot.respond(/http:\/\/(www\.nicovideo\.jp\/watch|nico\.ms)\/(\w+)[^\s\/]*(\s|$)/, function(msg) {
	itemId = msg.match[2];
	getSession(function(session) {
	    getToken(session, function(token) {
		addToMylist(session, token, itemId, function(body) {
		    msg.send(itemId + 'を共有マイリストに登録しました');
		});
	    });
	});
    });

    robot.respond(/(list|リスト)/i, function(msg) {
	msg.send('http://www.nicovideo.jp/mylist/' + config.mylistId);
    });
    
};

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

function addToMylist(session, token, itemId, callback) {
    var options = {
	url: 'http://www.nicovideo.jp/api/mylist/add',
	qs: {
	    token:    token,
	    group_id: config.mylistId,
	    item_id:  itemId
	},
	headers: {
	    Cookie: session
	}
    };
    request.get(options, function(error, response, body) {
	if (error) {
	    throw error;
	}
	callback(body);
    });
}
