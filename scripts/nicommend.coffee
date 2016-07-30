module.exports = (robot) ->

  robot.hear /花火/i, (res) ->
    res.send "隅田川"
