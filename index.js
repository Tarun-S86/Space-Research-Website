
const express = require('express');
const bodyParser = require('body-parser');
const { body, validationResult } = require('express-validator');
const mysql = require('mysql2');
const app = express();
const port = 3000;

app.set('view engine', 'ejs');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root', 
    password: '', 
    database: 'space_research'
});

connection.connect(err => {
    if (err) {
        console.error('Error connecting to the database:', err);
    } else {
        console.log('Connected to the MySQL database.');
    }
});

app.use(express.static('public_html'));
app.use(bodyParser.urlencoded({ extended: true })); 


app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public_html/index.html');
});

app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/public_html/login.html');
});

app.get('/signup', (req, res) => {
    res.sendFile(__dirname + '/public_html/signup.html');
});

app.post('/signup', [
    body('username').notEmpty().withMessage('Username is required.'),
    body('email').isEmail().withMessage('Please enter a valid email address.'),
    body('phone').notEmpty().withMessage('Phone number is required.'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.'),
    body('confirmPassword').custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Passwords do not match.');
        }
        return true;
    })
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() }); 
    }

    const { username, email, phone, password } = req.body;

    const query = 'INSERT INTO users (username, email, phone, password) VALUES (?, ?, ?, ?)';
    connection.query(query, [username, email, phone, password], (err, results) => {
        if (err) {
            console.error('Error saving user:', err);
            return res.status(500).send('Server error');
        }
        console.log('User saved:', results);
        res.redirect('/login');
    });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;

    const query = 'SELECT * FROM users WHERE email = ? AND password = ?';
    connection.query(query, [email, password], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Server error occurred');
        }

        if (results.length > 0) {
            res.send('<script>alert("Login successful!"); window.location.href = "/logged_in_home.html";</script>');
        } else {
            res.send('<script>alert("Records don\'t match. Please try again."); window.location.href = "/login";</script>');
        }
    });
});




app.post('/contact', [
    body('name').notEmpty().withMessage('Name is required.'),
    body('email').isEmail().withMessage('Please enter a valid email address.'),
    body('phone').notEmpty().withMessage('Phone number is required.'),
    body('message').notEmpty().withMessage('Message cannot be empty.')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, phone, message } = req.body;

    const query = 'INSERT INTO contacts (name, email, phone, message) VALUES (?, ?, ?, ?)';
    connection.query(query, [name, email, phone, message], (err, results) => {
        if (err) {
            console.error('Error saving contact:', err);
            return res.status(500).send('Server error');
        }
        console.log('Contact saved:', results);

        res.render('thankyou', { name, email, phone, message });
    });
});

app.get('/contact', (req, res) => {
    res.sendFile(__dirname + '/public_html/contact.html');
});

app.listen(port, () => {
    console.log(`Web server running at: http://localhost:${port}`);
    console.log(`Type Ctrl+C to shut down the web server`);
});
