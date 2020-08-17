require('dotenv').config()

const rp = require('request-promise')
const cheerio = require('cheerio')
const fs = require('fs')
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const db = low(new FileSync('db.json'))
db.defaults({ questions: [] }).write()

run()
async function run () {
  await crawl()
  buildScript()
}

async function crawl () {
  const cookies = process.env.COOKIES

  // 从我的错题里抓取题目
  const courses = [
    {
      name: '纪律与处分规定',
      uri: 'http://www.yiban.cn/t/student/showmisinfo/name/%E7%BA%AA%E5%BE%8B%E4%B8%8E%E5%A4%84%E5%88%86%E8%A7%84%E5%AE%9A/courseid/470/page/',
      pageCount: 3 // 抓取页数
    },
    {
      name: '安全教育',
      uri: 'http://www.yiban.cn/t/student/showmisinfo/name/%E5%AE%89%E5%85%A8%E6%95%99%E8%82%B2/courseid/428/page/',
      pageCount: 3
    }
  ]

  for (const course of courses) {
    for (let i = 1; i < course.pageCount + 1; ++i) {
      const questions = await getQstByPage(cookies, course.uri + i)
      db.get('questions').push(...questions).write()
      console.log(course.name, '页数', i, questions.length)
    }
  }
  // 去重
  db.set('questions', db.get('questions').uniqBy('id').value()).write()

  console.log('完成', db.get('questions').value().length)
}

function buildScript () {
  // 只保留必要字段
  const packed = JSON.stringify(
    db.get('questions')
      .map(({ id, marks }) => ({ id, marks }))
      .value()
  )
  // 注入题库数据到脚本
  fs.writeFileSync(
    '../main.js',
    fs.readFileSync('./main-template.js').toString().replace('{{questions}}', packed)
  )
  console.log('🎉 写出完成！复制 main.js 内全部代码到浏览器 Console 即可使用。')
}

async function getQstByPage (cookies, uri) {
  const body = await rp({
    uri: uri,
    method: 'GET',
    headers: {
      Cookie: cookies
    }
  })

  const $ = cheerio.load(body)

  const questions = $('.ep_topic').map((i, el) => {
    const content = $(el).find('.ep_t_topic').find('p').text()
    const type = $(el).find('.ep_t_topic').find('b').text().replace(/[【】]/g, '')
    let marks = $(el).find('.eh_t_solution').find('.eh_uanswer').find('b').text().split(',')
    let answers = $(el).find('.ep_t_ul').find('li').map((i, el) => $(el).text()).get()
    const id = parseInt($(el).find('.eh_t_resolve').attr('id'))

    if (type === '判断') {
      answers = ['A.正确', 'B.错误']
      marks = marks[0] === '√' ? ['A'] : ['B']
    }

    return {
      id,
      type,
      content,
      marks,
      answers
    }
  }).get()

  return questions
}
