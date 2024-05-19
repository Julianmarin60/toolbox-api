const express = require('express')
const { getJsonFiles, getFileList } = require('../controllers/files.controller.js')

const router = express.Router()

router.get('/data', getJsonFiles)

router.get('/list', getFileList)

module.exports = router
