const pullToRefresh = require('./pull-to-refresh')
const Indicator = require('./indicator')
const ElasticIndicator = require('./elastic-indicator')

module.exports = pullToRefresh

Object.assign(pullToRefresh, {
  pullToRefresh,
  Indicator,
  ElasticIndicator
})
