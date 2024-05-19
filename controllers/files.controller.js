const axios = require('axios')

const url = 'https://echo-serv.tbxnet.com/v1/secret'
const token = 'aSuperSecretKey'

async function getJsonFiles (req, res) {
  try {
    if (req.query && req.query.fileName) {
      const { fileName } = req.query
      if (fileName && fileName !== '') {
        const fileData = await getFileByName(fileName)
        if (fileData !== null) {
          const lines = organizeData(fileData)
          const data = { file: fileName, lines }
          if (data.lines.length > 0) {
            res.json([data])
          } else {
            res.status(404).json({ error: 'No data found' })
          }
        } else {
          res.status(404).json({ error: 'File not found' })
        }
        return
      }
    }
    const files = await getFiles()
    const jsonData = []
    for (const file of files) {
      const fileData = await getFileByName(file)
      if (fileData !== null) {
        const lines = organizeData(fileData)
        const data = { file, lines }
        if (data.lines.length > 0) {
          jsonData.push(data)
        }
      }
    }
    res.json(jsonData)
  } catch (error) {
    res.status(500).json({ error: 'There was a server error' })
  }
}

async function getFileList (req, res) {
  try {
    const files = await getFiles()
    res.json(files)
  } catch (error) {
    console.error('Error al procesar la solicitud:', error)
    res.status(500).json({ error: 'There was a server error' })
  }
}

async function getFiles () {
  try {
    const response = await axios.get(url + '/files', {
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json'
      }
    })
    return response.data.files
  } catch (error) {
    return { error: 'There was a server error' }
  }
}

async function getFileByName (name) {
  try {
    const response = await axios.get(url + '/file/' + name, {
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json'
      }
    })
    return response.data
  } catch (error) {
    return null
  }
}

function organizeData (csvData) {
  if (typeof csvData !== 'string') {
    throw new Error('csvData must be a string of characters')
  }
  const lines = csvData.split('\n').map((line) => line.split(','))

  const data = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]

    if (line.length !== 4) {
      continue
    }

    const [file, text, number, hex] = line

    if (file === '') {
      continue
    }

    if (isNaN(number)) {
      continue
    }

    if (!/^[\da-fA-F]{32}$/.test(hex)) {
      continue
    }

    data.push({
      text,
      number: parseInt(number),
      hex
    })
  }

  return data
}

module.exports = {
  getJsonFiles,
  getFiles,
  getFileByName,
  organizeData,
  getFileList
}
