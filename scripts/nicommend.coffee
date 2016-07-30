module.exports = (robot) ->

  robot.hear /(http:\/\/www.nicovideo.jp\/watch\/.+)(\s|$)/, (msg) ->
    msg.send msg.match[1]
