const express = require('express')

const bcrypt = require('bcrypt')
const session = require('express-session')
const flash = require('express-flash')

const app = express()
const port = 5000

const db = require('./connection/db')
const { redirect } = require('express/lib/response')

// set view engine hbs
app.set ('view engine', 'hbs')
// set public path/folder
app.use('/public', express.static(__dirname + '/public')) 
app.use(express.urlencoded({extended: false}))
app.use(flash())
app.use(session({
    secret: 'rahasia',
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 1 * 60 * 60 * 1000 //1Hours
    }
}))

// let isLogin = true

//SHOW FETCH DATABASE
app.get ('/', (req, res) => {
        db.connect((err, client, done) => {
        if (err) throw err

        client.query('SELECT * FROM tb_projects', (err, result) => {
            if (err) throw err
            let data = result.rows
            // console.log(result)
            
            data = data.map(function (item) {
                return {
                    title: item.title,
                    description: item.description.slice(0, 150) + '.....',
                    author: item.author,
                    sDate: item.sDate,
                    eDate: item.eDate,
                    duration: abtDuration(item.sDate, item.eDate),
                    techjs: item.techjs,
                    techreact: item.techreact,
                    technode: item.technode,
                    techvue: item.techvue,
                    id: item.id,
                    isLogin: req.session.isLogin
                }
            })
            res.render('index', {isLogin: req.session.isLogin, user: req.session.user, blogs: data })
        })
    })
})

// SHOW BLOG DETAIL
app.get('/blog/:id', (req, res) => {
    if(!req.session.isLogin){
        req.flash('danger', 'Please Login first!!')
        return res.redirect('/login')
    }

    let id =  req.params.id
    // console.log(id);
    db.connect((err, client, done) => {
        if (err) throw err

        client.query (`SELECT * FROM tb_projects WHERE id = ${id}`, (err, result) =>{
            if (err) throw err
            done()
            let data = result.rows[0]
            console.log(data);
            data.sDate = getFullTime(data.sDate)
            data.eDate = getFullTime(data.eDate)
            data.duration = abtDuration(data.sDate, data.eDate)
            res.render('blog', {data, isLogin: req.session.isLogin, user: req.session.user})
        })
    })
})

// ADD PROJECT
app.get ('/add-project', (req, res) => {
    if(!req.session.isLogin){
        req.flash('danger', 'Please Login first!!')
        return res.redirect('/login')
    }
    res.render('add-project', {isLogin: req.session.isLogin, user: req.session.user})
})

app.post ('/add-project', (req, res) => {

    let data = req.body
    // console.log(data);
    let query = `INSERT INTO tb_projects (title, "sDate", "eDate", description, technode, techreact, techjs, techvue) VALUES ('${data.title}', '${data.sDate}', '${data.eDate}', '${data.description}', '{${data.technode}}', '{${data.techreact}}', '{${data.techjs}}', '{${data.techvue}}') `

    db.connect((err, client, done) => {
        if (err) throw err

        client.query(query, (err, result) => {
            if (err) throw err
            done()

            res.redirect('/')
        })
    })
})

//DELETE PROJECT
app.get('/delete-project/:id', (req, res) => {
    if(!req.session.isLogin){
        req.flash('danger', 'Please Login first!!')
        return res.redirect('/login')
    }

    let id = req.params.id
    let query = `DELETE FROM public.tb_projects WHERE id = ${id}`
    // console.log(query);

    db.connect((err, client, done) => {
        if (err) throw err

        client.query(query, (err, result) => {
            if (err) throw err
            done ()

            res.redirect('/')
        })
    })
})

// GET DATA for update
app.get ('/update-project/:id', (req, res) =>{
    if(!req.session.isLogin){
        req.flash('danger', 'Please Login first!!')
        return res.redirect('/login')
    }

    let id =  req.params.id
    // console.log(id);
    db.connect((err, client, done) => {
        if (err) throw err

        client.query (`SELECT * FROM tb_projects WHERE id = ${id}`, (err, result) =>{
            if (err) throw err
            done()
            let data = result.rows[0]
            data.startDate = getFullTime(data.sDate)
            data.endDate = getFullTime(data.eDate)
            // console.log(data);

            // console.log(data);
            res.render('update-project', {update: data, id, isLogin: req.session.isLogin, user: req.session.user})
        })
    })
})

//UPDATE POST DATA
app.post ('/update-project/:id', (req, res) => {
    let data = req.body
    let id = req.params.id
    let query = `UPDATE tb_projects SET title='${data.title}', "sDate"='${data.sDate}', "eDate"='${data.eDate}', description='${data.description}', image='{${data.image}}',techjs='{${data.techjs}}', technode='{${data.technode}}', techvue='{${data.techvue}}', techreact='{${data.techreact}}' WHERE id = ${id}`

    db.connect ((err, client, done) => {
        if (err) throw err

        client.query (query, (err, result) => {
            if (err) throw err
            done()

            res.redirect('/')

        })
    })
})


// authentic REGISTER/ LOGIN
//===REGISTER===
app.get('/register', (req, res) => {
    res.render('register')
})

app.post ('/register', (req, res) => {
    const {name, email, password} = req.body
    // console.log(req.body);
    const hashedPassword = bcrypt.hashSync(password, 10)
    const query = `INSERT INTO tb_user(name, email, password) VALUES ('${name}', '${email}', '${hashedPassword}')`
    const query1 = `SELECT * FROM tb_user WHERE email='${email}'`

    db.connect((err, client, done) => {
        if (err) throw err
        client.query(query1, (err, result) => {
            if (err) throw err
            // let data = result.rows[0].email
            console.log(result);            
            if (result.rows.length != 0 ) { //=======================================================================
                req.flash('danger', 'Email telah diguanakn')
                return res.redirect('/register')
            } else {
                client.query(query, (err, result) => {
                    req.flash('success', 'Email bisa diguanakn')
                    return res.redirect('/login')
                })
            }
        })
    })
})



// app.post ('/register', (req, res) => {
//     const {name, email, password} = req.body
//     // console.log(req.body);
//     const hashedPassword = bcrypt.hashSync(password, 10)
//     const query = `INSERT INTO tb_user(name, email, password) VALUES ('${name}', '${email}', '${hashedPassword}')`
//     const query1 = `SELECT * FROM tb_user WHERE email='${email}'`

//     db.connect((err, client, done) => {
//         if (err) throw err
//         client.query(query, (err, result) => {
//             client.query(query1, (err, result) => {
//                 if (err) throw err
//                 console.log(result.rows[0]);
//                 if(result.rows[0].email = email ) {
//                     req.flash('danger', 'EMAIL teu bisa')
//                     res.redirect('/register')
//                 } else {
//                     req.flash('success', 'EMAIL BISA')
//                     return res.redirect('/login')
//                 }
//                 // if(isMatch) {
//                 //     // console.log('Login Berasil');
//                 //     req.session.isLogin = true
//                 //     req.session.user = {
//                 //         id: result.rows[0].id,
//                 //         name: result.rows[0].name,
//                 //         email: result.rows[0].email
//                 //     }
    
//                 //     req.flash('success', `Email berhasil`)
//                 //     res.redirect('/login')
//                 // } else {
//                 //     req.flash('danger', 'Email Bentrok')
//                 //     res.redirect('/register')
//                 // }
//             }) 
//         })
//     })
// })

//===LOGIN===
app.get ('/login', (req, res) => {
    res.render('login')
})

app.post ('/login', (req, res) =>{
    const {email, password} = req.body

    const query = `SELECT * FROM tb_user WHERE email='${email}'`
    
    db.connect((err, client, done) => {
        if (err) throw err

        client.query(query, (err, result) => {
            if (err) throw err
            done()
            // console.log(result.rows[0]);
            if(result.rows.length == 0) {
                req.flash('danger', 'Email not found, regist first!!')
                return res.redirect('/login')
            }

            const isMatch = bcrypt.compareSync(password, result.rows[0].password)
            // console.log(isMatch);

            if(isMatch) {
                // console.log('Login Berasil');
                req.session.isLogin = true
                req.session.user = {
                    id: result.rows[0].id,
                    name: result.rows[0].name,
                    email: result.rows[0].email
                }

                req.flash('success', `Hello ${req.session.user.name} welcome..`)
                res.redirect('/')
            } else {
                req.flash('danger', 'Your Password is incorrect!!')
                res.redirect('/login')
            }
        })
    })
})

//LOGOUT
app.get('/logout', (req, res) => {
    req.session.destroy()

    res.redirect('/login')
})

// SUMMON KYUBI
app.get ('/contact', (req, res) =>{
    res.render('contact', {isLogin: req.session.isLogin, user: req.session.user})
})

app.use ('/', (req, res) => {
    res.status(404)
    res.send('<h1>404</h1>')
})



function abtDuration(startDate, endDate) {
    let start = new Date(startDate);
    let end = new Date(endDate);
    let duration = end.getTime() - start.getTime();
    let year = Math.floor(duration / (1000 * 3600 * 24 * 30 * 12))
    let month = Math.round(duration / (1000 * 3600 * 24 * 30));
    let day = duration / (1000 * 3600 * 24)
  
    if (day < 30) {
        return day + ' Day';
    } else if (month < 12) {
        return month + ' Month';
    } else {
        return year + ' Year'
    }

}

function getFullTime(waktu) {
    
    let date = waktu.getDate().toString().padStart(2, "0");

    // console.log(date);
    let month = (waktu.getMonth() + 1).toString().padStart(2, "0")

    // console.log(month[monthIndex]);

    let year = waktu.getFullYear()
    // console.log(year);

    let fullTime = `${year}-${month}-${date}`
    return fullTime
}

// function startdate(sDate){
//     let startdate = new Date(sDate);
//     const result = startdate.toLocaleDateString("en-GB", {
//       day: "2-digit",
//       month: "2-digit",
//       year: "numeric",
//     });
//     let result_split = result.split("/");
//     let final_result = `${result_split[2]}-${result_split[1]}-${result_split[0]}`;
//     return final_result;
// }

app.listen(port, () =>{
    console.log(`Server listen at http://localhost: ${port}`)
})