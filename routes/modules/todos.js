const express = require('express')
const router = express.Router()

const db = require('../../models')
const Todo = db.Todo


//Create
router.get('/new', (req, res) => {
  return res.render('new')
})


router.post('/', (req, res) => {
  const UserId = req.user.id
  const name = req.body.name // 從 req.body 拿出表單裡的 name 資料
  return Todo.create({ name, UserId})
    .then(() => res.redirect('/'))
    .catch(error => console.log(error))
})


//Read
router.get('/:id', (req, res) => {
  const UserId = req.user.id
  const id = req.params.id
  return Todo.findOne({
    where: { id, UserId }
  })
    .then(todo => res.render('detail', { todo: todo.toJSON() })) //查詢單筆資料：在 res.render 時在物件實例 todo 後串上 todo.toJSON()
    .catch(error => console.log(error))
})

//Uptated

router.get('/:id/edit', (req, res) => {
  const UserId = req.user.id
  const id = req.params.id  //用 req.params.id 把網址上的 id 截取出來

  return Todo.findOne({ where: { id, UserId } })
    .then(todo => res.render('edit', { todo: todo.get() }))  //todo.get()
    .catch(error => console.log(error))
})



router.put('/:id', (req, res) => {
  const UserId = req.user.id
  const id = req.params.id
  const { name, isDone } = req.body   //解構賦值 (destructuring assignment),就是潮
  return Todo.findOne({ where: { id, UserId } })
    .then(todo => {
      todo.name = name
      //原本的寫法，甚麼鬼
      // if(isDone === 'on'){
      // 	todo.isDone === true
      // }else{
      // 	todo.isDone === False
      // }
      todo.isDone = isDone === 'on'  //這樣寫才對，讚讚
      return todo.save()
    })
    .then(() => res.redirect(`/todos/${id}`))
    .catch(error => console.log(error))
})
//delete
router.delete('/:id', (req, res) => {
  const UserId = req.user.id
  const id = req.params.id  //透過 req.params.id 取得網址上的識別碼，用來查詢使用者想刪除的 To-do。
  return Todo.findOne({ where: {id, UserId} })  
    .then(todo => todo.destroy()) //todo.destroy()
    .then(() => res.redirect('/')) //成功刪除以後，使用 redirect 重新呼叫首頁
    .catch(error => console.log(error))
})




// 匯出路由模組
module.exports = router