const axios = require('axios')
const MockAdapter = require('axios-mock-adapter')
const sinon = require('sinon')
const { expect } = require('chai')
const { getJsonFiles, getFiles, getFileByName, organizeData } = require('../controllers/files.controller.js')
const url = 'https://echo-serv.tbxnet.com/v1/secret/'

describe('files.controller', function () {
    let mock

    beforeEach(function () {
        mock = new MockAdapter(axios)
    })

    afterEach(function () {
        mock.restore()
    })

    describe('getJsonFiles', function () {
        it('should return json data', async function () {
            const req = {}
            const res = { json: sinon.spy() }
            mock
                .onGet(url + 'files')
                .reply(200, { files: ['file1.csv', 'file2.csv'] })
            mock
                .onGet(url + 'file/file1.csv')
                .reply(
                    200,
                    'file,text,number,hex\nfile1.csv,text1,1,0123456789abcdef0123456789abcdef'
                )
            mock
                .onGet(url + 'file/file2.csv')
                .reply(
                    200,
                    'file,text,number,hex\nfile2.csv,text2,2,0123456789abcdef0123456789abcdef'
                )

            await getJsonFiles(req, res)

            expect(res.json.calledOnce).to.be.true
            expect(res.json.firstCall.args[0]).to.deep.equal([
                {
                    file: 'file1.csv',
                    lines: [
                        {
                            hex: '0123456789abcdef0123456789abcdef',
                            number: 1,
                            text: 'text1'
                        }
                    ]
                },
                {
                    file: 'file2.csv',
                    lines: [
                        {
                            hex: '0123456789abcdef0123456789abcdef',
                            number: 2,
                            text: 'text2'
                        }
                    ]
                }
            ])
        })

        it('should return json data with query', async function () {
            const req = { query: { fileName: 'file1.csv' } }
            const res = { json: sinon.spy() }
            mock
                .onGet(url + 'file/file1.csv')
                .reply(
                    200,
                    'file,text,number,hex\nfile1.csv,text1,1,0123456789abcdef0123456789abcdef'
                )
            await getJsonFiles(req, res)

            expect(res.json.calledOnce).to.be.true
            expect(res.json.firstCall.args[0]).to.deep.equal([
                {
                    file: 'file1.csv',
                    lines: [
                        {
                            hex: '0123456789abcdef0123456789abcdef',
                            number: 1,
                            text: 'text1'
                        }
                    ]
                },
            ])
        })
    })

    describe('getFiles', function () {
        it('should return file names', async function () {
            mock.onGet(url + 'files').reply(200, { files: ['file1', 'file2'] })

            const files = await getFiles()

            expect(files).to.deep.equal(['file1', 'file2'])
        })

        it('should handle 500 error', async function () {
            mock.onGet(url + 'files').reply(500)
        
            try {
                const files = await getFiles()
            } catch (error) {
                expect(error.response.status).to.equal(500)
            }
        })
        
        it('should handle 404 error', async function () {
            mock.onGet(url + 'files').reply(404)
        
            try {
                const files = await getFiles()
            } catch (error) {
                expect(error.response.status).to.equal(404)
            }
        })
    })

    describe('getFileByName', function () {
        it('should return file data', async function () {
            mock
                .onGet(url + 'file/file1')
                .reply(200, 'file1,text1,1,0123456789abcdef0123456789abcdef')

            const fileData = await getFileByName('file1')

            expect(fileData).to.equal(
                'file1,text1,1,0123456789abcdef0123456789abcdef'
            )
        })

        it('should handle 500 error', async function () {
            mock
                .onGet(url + 'file/file1')
                .reply(500)

            try {
                const files = await getFiles()
            } catch (error) {
                expect(error.response.status).to.equal(500)
            }
        })

        it('should handle 404 error', async function () {
            mock
                .onGet(url + 'file/file1')
                .reply(404)

            try {
                const files = await getFiles()
            } catch (error) {
                expect(error.response.status).to.equal(404)
            }
        })
    })

    describe('organizeData', function () {
        it('should organize data correctly', function () {
            const data =
                'file,text,number,hex\nfile2,text2,2,0123456789abcdef0123456789abcdef'
            const organizedData = organizeData(data)

            expect(organizedData).to.deep.equal([
                {
                    text: 'text2',
                    number: 2,
                    hex: '0123456789abcdef0123456789abcdef'
                }
            ])
        })

        it('should throw error when csvData is not a string', function () {
            const data = 12345;
        
            expect(() => organizeData(data)).to.throw('csvData must be a string of characters');
        })
    })
})
