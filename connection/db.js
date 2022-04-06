// import pg pool
const {Pool} = require('pg')

// connect
const dbPool = new Pool({
    database: 'personal_web',
    port: 3000,
    user: 'postgres',
    password: 'admin'
})

module.exports = dbPool