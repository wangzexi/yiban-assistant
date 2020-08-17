// 随机做题并提交
(() => {
  $('.ep_topic').each((_, el) => {
    const e = $(el).find('.ep_radio')
    e[Math.floor(Math.random() * e.length)].click()
  })
  $('#subsj').click()
})()
