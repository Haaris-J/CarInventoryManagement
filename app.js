// Team 1

const express = require('express'); 
const mongoose = require('mongoose'); 
const bcrypt = require('bcrypt'); 
const session = require('express-session'); 
const cookieParser = require('cookie-parser'); 
const helmet = require('helmet'); 
const https = require('https'); 
const fs = require('fs'); 

const app = express();

const PORT = process.env.PORT || 3000;

mongoose.connect('mongodb://localhost:27017/carInventory', {
  useNewUrlParser: true, 
  useUnifiedTopology: true 
});

const UserSchema = new mongoose.Schema({
    username: String, 
    password: String, 
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
            res.render('');
        } else {
            res.status(401).send('Invalid credentials!'); 
        }
    } catch (error) {
        res.status(500).send('Login failed!'); // Send error response
    }
});

app.post('/register', query('username').notEmpty(), async (req, res) => {
    const { username, password } = req.body;
    role = 'user';
    try {
        const user = await User.findOne({ username });
        if (user) {
            res.status(401).send('Username already exsist!');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({ username, password: hashedPassword, role });
        res.send('User registered successfully!');
    } catch (error) {
        res.status(500).send('Registration failed!'); // Send error response
    }
});

const httpsOptions = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('certificate.pem')
};

https.createServer(httpsOptions, app).listen(PORT, () => {
    console.log(`Server is running on https://localhost:${PORT}`);
});
  