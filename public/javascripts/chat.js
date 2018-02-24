(function () {
    function showInfo(msg) {
        dd.device.notification.confirm({
            message: JSON.stringify(msg),
            title: "提示信息",
            buttonLabels: ['确定', '取消'],
            onSuccess : function(result) {

            },
            onFail : function(err) {

            }
        });
    }

    var OPENAPIHOST = 'http://' + location.host + '/dingding';
    var isDingtalk = /DingTalk/.test(navigator.userAgent);
    var proper = {};
    var _userId = '';
    var _userInfo = {};

    Object.defineProperty(proper, 'userId', {
        enumerable: true,
        get: function () {
            return _userId;
        },
        set: function (newValue) {
            _userId = newValue;
            getUserInfo(proper.userId);
        }
    });
    Object.defineProperty(proper, 'userInfo', {
        enumerable: true,
        get: function () {
            return _userInfo;
        },
        set: function (newValue) {
            _userInfo = newValue;

        }
    });

    function parseCorpId(url, param) {
        var searchIndex = url.indexOf('?');
        var searchParams = url.slice(searchIndex + 1).split('&');
        for (var i = 0; i < searchParams.length; i++) {
            var items = searchParams[i].split('=');
            if (items[0].trim() == param) {
                return items[1].trim();
            }
        }
    }

    function getUserId(corpId) {
        authCode(corpId).then(function (result) {
            var code = result.code;
            var getUserIdRequest = {
                url: OPENAPIHOST + '/getOapiByName.php?event=getuserid',
                type: 'POST',
                data: {code: code},
                dataType: 'json',
                success: function (response) {
                    if (response.errcode === 0) {
                        proper.userId = response.userid;
                    } else {
                        showInfo(response);
                    }
                },
                error: function (err) {
                    showInfo(err);
                }
            };
            $.ajax(getUserIdRequest);
        }).catch(function (error) {
            showInfo(error);
        });
    }

    function authCode(corpId) {
        return new Promise(function (resolve, reject) {
            dd.ready(function () {
                dd.runtime.permission.requestAuthCode({
                    corpId: corpId,
                    onSuccess: function (result) {
                        resolve(result);
                    },
                    onFail: function (err) {
                        reject(err);
                    }
                });
            });
        });
    }

    function getUserInfo(userid) {
        var getUserInfoRequest = {
            url: OPENAPIHOST + '/getOapiByName.php?event=get_userinfo&userid=' + userid,
            type: 'POST',
            data: {userid: userid},
            dataType: 'json',
            success: function (response) {
                if (response.errcode === 0) {
                    proper.userInfo = response;
                } else {
                    showInfo(response);
                }
            },
            error: function (err) {
                showInfo(err);
            }
        };
        $.ajax(getUserInfoRequest);
    }

    $(function () {
        var originalUrl = location.href;
        var corpId = parseCorpId(originalUrl, 'corpId');
        var jsApiList = [
            'runtime.info',
            'biz.contact.choose',
            'device.notification.confirm',
            'device.notification.alert',
            'device.notification.prompt',
            'biz.ding.post',
            'biz.util.openLink',
            'device.audio.startRecord',
            'device.audio.stopRecord',
            'device.audio.onRecordEnd',
            'device.audio.download',
            'device.audio.play',
            'device.audio.pause',
            'device.audio.resume',
            'device.audio.stop',
            'device.audio.onPlayEnd',
            'device.audio.translateVoice'
        ];
        dd.error(function (err) {
            showInfo(err);
        });
        var getOapiByNameUrl = OPENAPIHOST + '/getOapiByName.php?event=jsapi-oauth&href=' + encodeURIComponent(location.href);
        var signRequest = {
            url: getOapiByNameUrl,
            type: 'GET',
            dataType: 'json',
            success: function (response) {
                if (response.errcode === 0) {
                    const config = {
                        agentId: response.agentId || '',
                        corpId: response.corpId || '',
                        timeStamp: response.timeStamp || '',
                        nonceStr: response.nonceStr || '',
                        signature: response.signature || '',
                        jsApiList: jsApiList || []
                    };
                    dd.config(config);
                    var corpId = response.corpId;
                    getUserId(corpId);
                } else {
                    showInfo(response);
                }
            },
            error: function () {
            }
        };
        $.ajax(signRequest);
    });
})();