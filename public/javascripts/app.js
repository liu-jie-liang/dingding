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

    // var OPENAPIHOST = 'http://' + location.host;
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
            updateUI();
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

    function openLink(url) {
        if (isDingtalk) {
            dd.biz.util.openLink({
                url: url,
                onSuccess: function () {

                },
                onFail: function () {

                }
            });
        } else {
            window.open(url);
        }
    }

    function updateName() {
        var dateTime = new Date().getHours();
        var isAdmin = proper.userInfo.isAdmin;
        var name = proper.userInfo.name;
        var nb = {};
        if (name) {
            if (dateTime >= 5 && dateTime <= 12) {
                nb.wh = isAdmin ? '早上好，管理员，' + name : '早上好，' + name;
                nb.whImage = 'https://gw.alicdn.com/tps/TB1ubtjOFXXXXbzXpXXXXXXXXXX-36-36.jpg';
            } else if (dateTime > 12 && dateTime <= 18) {
                nb.wh = isAdmin ? '下午好，管理员，' + name : '下午好，' + name;
                nb.whImage = 'https://gw.alicdn.com/tps/TB1ubtjOFXXXXbzXpXXXXXXXXXX-36-36.jpg';
            } else {
                nb.wh = isAdmin ? '晚上好，管理员，' + name : '晚上好，' + name;
                nb.whImage = 'https://gw.alicdn.com/tps/TB15FNwOFXXXXbqXXXXXXXXXXXX-36-36.jpg';
            }
        }
        return nb;
    }

    function updateUI() {
        var nb = updateName();
        var html = '<img src="' + nb.whImage + '" class="admin-image">'
            + '<div class="admin-hello">'
            + nb.wh
            + '</div>';
        $('.admin-manager').html(html);
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

    function onRecordEnd() {
        dd.device.audio.onRecordEnd({
            onSuccess : function(res) {
                // res.mediaId; // 停止播放音频MediaID
                // res.duration; // 返回音频的时长，单位：秒
                translateVoice(res.mediaId, res.duration)
            },
            onFail : function (err) {

            }
        });
    }

    function translateVoice(mediaId, duration) {
        dd.device.audio.translateVoice({
            mediaId : mediaId,
            duration : duration,
            onSuccess : function (res) {
                // res.mediaId; // 转换的语音的mediaId
                showInfo(res.content); // 语音转换的文字内容
            }
        });
    }

    function recordSound() {
        $('.admin-edit').on('click', function () {
            var controlClass = "recording";
            if ($(this).hasClass(controlClass)) {
                $(this).removeClass(controlClass);
                $(this).html("开始录音");
                dd.device.audio.stopRecord({
                    onSuccess : function(res){
                        // res.mediaId; // 返回音频的MediaID，可用于本地播放和音频下载
                        // res.duration; // 返回音频的时长，单位：秒
                        translateVoice(res.mediaId, res.duration)
                    },
                    onFail : function (err) {
                    }
                });
            } else {
                $(this).addClass(controlClass);
                $(this).html("停止录音");
                dd.device.audio.startRecord({
                    onSuccess : function () {
                    },
                    onFail : function (err) {
                    }
                });
            }
        });
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
                    $('.banner-image').on('click', function () {
                        const url = 'https://alimarket.m.taobao.com/markets/dingtalk/cydd?lwfrom=20161118115327653';
                        openLink(url);
                    });
                    var corpId = response.corpId;
                    getUserId(corpId);
                    dd.ready(function () {
                        onRecordEnd();
                        recordSound();
                    })
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