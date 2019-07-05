
const fs = require('fs')

const readConfig = require('./methods/readConfig')
const config = readConfig(fs, __dirname + '/launch.json')

const puppeteer = require('puppeteer')

const { URL } = require('url')
const fse = require('fs-extra')
const Path = require('path')

;(async () => {
  const launchOptions = {
    headless: false,
    executablePath: config.browser,
    defaultViewport: null,
    args: [
      '--disable-infobars',
      '--start-maximized',
      '--lang=en-US,en',
    ]
  }
  const browser = await puppeteer.launch(launchOptions)
  const page = await browser.newPage()

  const checkResolvable = (path) => {
    const ext = Path.extname(path)
    const pathArray = path.split('/')
    const length = pathArray.length
    // for (let i = 1; i < length; i++) {
    //   if (pathArray[i].length > 128) {
    //     return false
    //   }
    // }

    if (path.indexOf(';base64') >= 0) {
      console.log('Ignore raw data')

      // return 'base64'
      return false
    } else if (pathArray[length - 1] == '') {
      console.log('index')

      return 'index'
    } else if (ext) {
      console.log(ext)

      return ext
    } else {
      console.log('Unknown file type')

      return false
    }
  }

  page.on('response', async (response) => {
    const status = response.status()
    if (status >= 300 && status <= 399) {
      console.log('Ignore redirection to', response.headers().location)
    } else {
      const url = new URL(response.url())
      const path = url.pathname
      let out = './tmp/static' + path
      const resolvable = checkResolvable(path)
      if (resolvable) {
        if (resolvable == 'index') {
          out += 'index.html'
        }
        fse.outputFile(out, await response.buffer())
      }
    }
  })

  await page.goto('https://cn.bing.com', {
    // waitUntil: 'load'
  })
})()
