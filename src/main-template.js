// 自动做题
(function () {
  solve(JSON.parse('{{questions}}'))

  function solve (questions) {
    let count = 0
    $('.ep_topic').each((_, el) => {
      const radios = $(el).find('.ep_radio')
      const id = parseInt(radios.attr('name'))

      const question = questions.find((x) => x.id === id)
      if (!question) return console.log(`题库缺少：${id}`)
      const marks = question.marks

      marks.forEach((mark) => {
        const i = mark.charCodeAt(0) - 'A'.charCodeAt(0)
        radios[i].click()
      })

      count++
    })
    console.log(`已经作答 ${count} 题！请点击提交。`)
  }
})()
