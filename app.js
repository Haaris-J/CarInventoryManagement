// Team 1

const express = require('express'); 
const mongoose = require('mongoose'); 
const bcrypt = require('bcrypt'); 
const session = require('express-session'); 
const cookieParser = require('cookie-parser'); 
const helmet = require('helmet'); 
const https = require('https'); 
const fs = require('fs'); 
const data = require('./dataModel');

const app = express();

const PORT = process.env.PORT || 3000;

mongoose.connect('mongodb://localhost:27017/carInventory', {
  useNewUrlParser: true, 
  useUnifiedTopology: true 
});

const UserSchema = new mongoose.Schema({
    username: String, 
    password: String,
    email: String, 
    role: { type: String, enum: ['admin', 'client'], default: 'user' } 
  });
const User = mongoose.model('User', UserSchema);

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser()); 
app.use(session({
  secret: 'team1', 
  resave: true,
  saveUninitialized: true, 
  cookie: {
    secure: true,
    maxAge: 3600000,
    httpOnly: true
  }
}));

app.use(helmet());

app.get('/', (req, res) => {
    username = 'test';
    res.render('index');
  });

app.post('/login', query('username').notEmpty(), async (req, res) => {
    const { username, password } = req.body; 
    try {
        const user = await User.findOne({ username });
        if (user && await bcrypt.compare(password, user.password)) { 
            req.session.user = user; 
            if(user.role === 'admin'){
                res.render('manage');
            } else {
                res.render('inventory');
            }
        } else {
            res.status(401).send('Invalid credentials!'); 
        }
    } catch (error) {
        res.status(427).send(`<h1 style="color:red;">Login failed!</h1><br><a href="http://localhost:${PORT}/">Return to website</a>`);
    }
});

app.post('/register', query('username').notEmpty(), async (req, res) => {
    const { username, password, email} = req.body;
    let userExist = false;
    try {
        await data.findOne({
            username: `${username}`,
        })
            .then((document) => {
                if (document != null) {
                    userExist = true;
                }
            });
        console.log(userExist);
        if (!userExist) {
            const hashedPassword = await bcrypt.hash(password, 1);
            await data.create({ username, password: hashedPassword, email });
            res.sendFile(path.join(__dirname, 'public', 'login.html'));
        } else {
            res.status(427).send(`<h1 style="color:red;">User Name already exist!</h1><br><a href="http://localhost:${PORT}/">Return to website</a>`);
        }

    } catch (error) {
        console.log(error)
        res.status(500).send(`<h1 style="color:red;">Registration failed!</h1><br><a href="http://localhost:${PORT}/">Return to website</a>`);
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            res.status(500).send('Logout failed!');
        } else {
            res.redirect('/');
        }
    });
});

const httpsOptions = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('certificate.pem')
};

https.createServer(httpsOptions, app).listen(PORT, () => {
    console.log(`Server is running on https://localhost:${PORT}`);
});
  