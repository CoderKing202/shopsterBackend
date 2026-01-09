const connectToMango = require ('./db')
const express = require('express')
const cors = require("cors")

connectToMango()
const app = express()
const port = 3000

app.use(cors())
app.use(express.json())// to get req.body we need this middleware

app.use('/api/auth',require('./routes/auth'))


app.listen(port, () => {
  console.log(`INoteBook backend listening on port ${port}`)
})
