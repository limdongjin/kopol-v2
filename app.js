'use strict'
const path = require('path')
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const compression = require('compression')
const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware')
const app = express()
const router = express.Router()
var AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient({'region': 'ap-northeast-2'})

app.set('view engine', 'pug')

if (process.env.NODE_ENV === 'test') {
  // NOTE: aws-serverless-express uses this app for its integration tests
  // and only applies compression to the /sam endpoint during testing.
  router.use('/sam', compression())
} else {
  router.use(compression())
}

router.use(cors())
router.use(bodyParser.json())
router.use(bodyParser.urlencoded({ extended: true }))
router.use(awsServerlessExpressMiddleware.eventContext())

// NOTE: tests can't find the views directory without this
// app.set('views', path.join(__dirname, 'views'))

//router.get('/', (req, res) => {
//  res.render('index', {
//    apiUrl: req.apiGateway ? `https://${req.apiGateway.event.headers.Host}/${req.apiGateway.event.requestContext.stage}` : 'http://localhost:3000'
//  })
//})

var params = {TableName: 'bills', Limit: 1000, AttributesToGet: ['id']}


function getItemParams(billId) {
  return {
    TableName: 'bills',
    KeyConditionExpression: "id = :a",
    ExpressionAttributeValues: {
      ":a": parseInt(billId)
    }
  }
}

router.get('/bills/:billId', (req, res) => {
  dynamoDb.query(getItemParams(req.params.billId), (err, data)=>{
    if (err) {
      res.status(400).json({ error: err})
      return true
    }
    res.json({bills: data.Items, count: data.Count})
  })
})

router.get('/bills', (req, res) => {
  dynamoDb.scan(params, function scanUntilDone(error, data) {
    if (error) {
      res.status(400).json({ error: error})
      return true
    }
      res.json({result: data})
  })
})
router.get('/', (req, res) => {
  dynamoDb.scan(params, function scanUntilDone(error, data) {
    if (error) {
      res.status(400).json({ error: error})
      return true
    }
      res.json({result: data})
  })
})


app.use('/', router)

module.exports = app
