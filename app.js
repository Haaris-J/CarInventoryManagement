// Team 1
// Required modules
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const https = require('https');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const data = require('./dataModel');
const { query } = require('express-validator');

// Initialize express app
const app = express();

// Port configuration
const PORT = process.env.PORT || 3000;
// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/carInventory', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Set view engine and static directory
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));

// Middleware setup
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(session({
    secret: 'team1',// Secret key for session
    resave: true,
    saveUninitialized: true,
    cookie: {
        secure: true,// Forces the session cookie to be sent only over HTTPS
        maxAge: 3600000, // Session expiry time (1 hour)
        httpOnly: true // Reduces the risk of XSS attacks by restricting the client from accessing the cookie
    }
}));

app.use(helmet());  // Security middleware



app.get('/', async (req, res) => {
    try {
        // Check if admin user exists, if not, create one
        await User.findOne({
            username: 'admin',
        })
            .then(async (document) => {
                if (document != null) {
                    userExist = true;
                } else {
                    const username = 'admin';
                    const email = 'admin@cars.com'
                    const password = 'admin';
                    const hashedPassword = await bcrypt.hash(password, 1);
                    await User.create({ username, password: hashedPassword, email });
                }
            });
    } catch (error) {
        console.log(error)
    }
    res.render('index', { PORT });
});

//User Validation and Registration

const UserSchema = new mongoose.Schema({
    username: String,
    password: String,
    email: String,
    role: { type: String, enum: ['admin', 'client'], default: 'client' }
});
const User = mongoose.model('User', UserSchema);

// Login route
app.post('/login', query('username').notEmpty(), async (req, res) => {
    console.log("Login Started!");
    const { username, password } = req.body;
    try {
          // Validate user credentials
        const user = await User.findOne({ username });
        if (user && await bcrypt.compare(password, user.password)) {
            req.session.user = user;
            if (user.username === 'admin') {
                res.redirect('/manage-cars')
            } else {
                res.redirect('/get-cars');
            }
        } else {
            res.status(401).send('Invalid credentials!');
        }
    } catch (error) {
        // Handle login error
        res.status(427).send(`<h1 style="color:red;">Login failed!</h1><br><a href="https://localhost:${PORT}/">Return to website</a>`);
    }
});
// Registration route
app.post('/register', query('username').notEmpty(), async (req, res) => {
    console.log("Registration Started!");
    const { username, password, email } = req.body;
    console.log(username, password, email);
    let userExist = false;
    try {
        // Check if username already exists
        await User.findOne({
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
            await User.create({ username, password: hashedPassword, email });
            res.render('index', { PORT });
        } else {
            res.status(427).send(`<h1 style="color:red;">User Name already exist!</h1><br><a href="https://localhost:${PORT}/">Return to website</a>`);
        }

    } catch (error) {
        // Handle registration error
        console.log(error)
        res.status(500).send(`<h1 style="color:red;">Registration failed!</h1><br><a href="https://localhost:${PORT}/">Return to website</a>`);
    }
});
// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            res.status(500).send('Logout failed!');
        } else {
            res.render('index', { PORT });
        }
    });
});

// Car Inventory Management
// Route to display cars inventory
app.get('/get-cars', (req, res) => {
    const user = req.session.user;
    if (user) {
        data.find()
            .then((cars) => {
                res.render('inventory', { 'cars': cars, PORT });
            });
    } else {
        res.status(500).send(`<h1 style="color:red;">Session Expired!</h1><br><a href="https://localhost:${PORT}/">Return to website</a>`);
    }
});
// Route to search for cars
app.get('/search-cars?:filter', (req, res) => {
    const filter = req.query.filter;
    const userInput = req.query.userInput;
    console.log(`filter ${filter}`);
    console.log(`searchInput ${req.query.userInput}`);
    console.log(req.params);
    const user = req.session.user;
    if (user) {
        data.find({
            [`${filter}`]: `${userInput}`,
        })
            .then((cars) => {
                console.log(cars);
                if (cars === null) {
                    cars = [];
                }
                if (user.username === 'admin') {
                    res.render('manage', { 'cars': cars, PORT });
                } else {
                    res.render('inventory', { 'cars': cars, PORT });
                }
            });
    } else {
        res.status(500).send(`<h1 style="color:red;">Session Expired!</h1><br><a href="https://localhost:${PORT}/">Return to website</a>`);
    }
});
// Route to manage cars (Admin only)
app.get('/manage-cars', (req, res) => {
    const user = req.session.user;
    if (user && user.username === 'admin') {
        data.find()
            .then((cars) => {
                res.render('manage', { 'cars': cars, PORT });
            });
    } else {
        res.status(500).send(`<h1 style="color:red;">UnAuthorized! Admin only access, contact admin</h1><br><a href="https://localhost:${PORT}/">Return to website</a>`);
    }
});
// Route to add a car (Admin only)
app.get('/add', (req, res) => {
    const user = req.session.user;
    if (user && user.username === "admin") {
        res.render('add', { PORT });
    } else {
        res.status(500).send(`<h1 style="color:red;">Session Expired!</h1><br><a href="https://localhost:${PORT}/">Return to website</a>`);
    }
});

// Set up the storage for uploaded files
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      // Specify the directory where uploaded files will be stored
      cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
      // Specify the filename for the uploaded file
      cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    },
  });
  
  // Create the multer middleware with the storage configuration
  const upload = multer({ storage: storage });

// Route to add a new car to the inventory (Admin only)
app.post('/add-car',upload.single('file'), (req, res) => {
    const user = req.session.user;
    if (user && user.username === 'admin') {
        const { c_brand, c_model, c_type, c_fuel, c_mileage, c_price } = req.body;
        const uploadedFile = req.file;
        console.log(uploadedFile);
        console.log(uploadedFile.filename);

        const car = new data({
            brand: `${c_brand}`,
            model: `${c_model}`,
            type: `${c_type}`,
            fuel: `${c_fuel}`,
            mileage: `${c_mileage}`,
            price: `${c_price}`,
            img: {
                data: fs.readFileSync(path.join(__dirname + '/uploads/' + uploadedFile.filename)),
                contentType: 'image/png'
            }
        });

        car.save()
            .then(() => {
                console.log('car data added successfully!');
            })
            .catch((err) => {
                console.error('Error adding car data:', err);
                res.redirect(`https://localhost:${PORT}/manage-cars`);
            });
        res.redirect(`https://localhost:${PORT}/manage-cars`);
    } else {
        res.status(500).send(`<h1 style="color:red;">UnAuthorized! Admin only access, contact admin</h1><br><a href="https://localhost:${PORT}/">Return to website</a>`);
    }
});
// Route to edit a car (Admin only)
app.post('/edit-car/:id', (req, res) => {
    data.findOne({
        _id: `${req.params.id}`
    })
        .then((car) => {
            console.log(car);
            res.render('update', { 'car': car, PORT });
        });
});
// Route to update car details (Admin only)
app.post('/update-car', (req, res) => {
    const user = req.session.user;
    if (user && user.username === 'admin') {
        const { c_brand, c_model, c_type, c_fuel, c_mileage, c_price } = req.body;

        data.updateOne({
            brand: `${c_brand}`,
            model: `${c_model}`,
            type: `${c_type}`,
            fuel: `${c_fuel}`,
            mileage: `${c_mileage}`,
            price: `${c_price}`
        })
            .then(() => {
                console.log('car data updated successfully!');
            })
            .catch((err) => {
                console.error('Error updating car data:', err);
                res.redirect(`https://localhost:${PORT}/manage-cars`);
            });
        res.redirect(`https://localhost:${PORT}/manage-cars`);
    } else {
        res.status(500).send(`<h1 style="color:red;">UnAuthorized! Admin only access, contact admin</h1><br><a href="https://localhost:${PORT}/">Return to website</a>`);
    }
});
// Route to delete a car (Admin only)
app.post('/delete-car/:id', (req, res) => {
    const user = req.session.user;
    if (user && user.username === 'admin') {
        console.log(req.params.id);
        data.deleteOne({
            _id: `${req.params.id}`
        })
            .then(() => {
                console.log('car data deleted successfully!');
            })
            .catch((err) => {
                console.error('Error deleting car data:', err);
            });
        res.redirect('/manage-cars');
    } else {
        res.status(500).send(`<h1 style="color:red;">UnAuthorized! Admin only access, contact admin</h1><br><a href="https://localhost:${PORT}/">Return to website</a>`);
    }
});



// HTTPS configuration
const httpsOptions = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('certificate.pem')
};
// Create HTTPS server
https.createServer(httpsOptions, app).listen(PORT, () => {
    console.log(`Server is running on https://localhost:${PORT}`);
});
