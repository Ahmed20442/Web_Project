const express = require("express")
const mongoose = require('mongoose')
const User = require('./models/User')
const Product = require('./models/Product')
const authMid = require('./middlewares/auth');
const cors = require('cors');
const mongouri = "mongodb://localhost:27017/labb1"


// app service 
const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cors());





// signin  "username": "cdsdc",
//   "password": "200215",
//   "ConfirmPassword": "200215",
//   "email": "cds@gmail.com",
//   "phone": "0121545",
//   "age": "25",
//   "fullName": ",fmdf Doe",
//   "country": "egypt"
app.post('/Rigister', async (req, res) => {
    try {
        const {
            username,
            password,
            ConfirmPassword,
            email,
            phone,
            age,
            fullName,
            country
        } = req.body;

        // Check if the email is in a valid format
        if (!email.endsWith('@gmail.com')) {
            return res.status(400).json({ error: 'Email must be a valid Gmail address.' });
        }

        // Check if the passwords match
        if (password !== ConfirmPassword) {
            return res.status(400).json({ error: 'Passwords do not match.' });
        }

        // Check if the username is already in use
        const usernameExists = await User.findOne({ username });
        if (usernameExists) {
            return res.status(400).json({ error: 'Username is already in use.' });
        }

        // Check if the email is already in use
        const emailExists = await User.findOne({ email });
        if (emailExists) {
            return res.status(400).json({ error: 'Email is already in use.' });
        }
        if (isNaN(phone)) {
            return res.status(400).json({ error: 'Phone must be a valid number.' });
        }
        if (isNaN(age)) {
            return res.status(400).json({ error: 'age must be a valid number.' });
        }
        // Create a new user
        const newUser = new User({
            username,
            password,
            ConfirmPassword,
            email,
            phone,
            age,
            fullName,
            country
        });

        // Save the user to the database
        await newUser.save();

        // Generate and send an authentication token
        const token = newUser.genAuthToken();
        res.header('x-auth-token', token).send('RIGISTER IN');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// "EmailorPhone": "0121545",
// "password": "200215"
//login
app.get('/Login', async (req, res) => {
    const { EmailorPhone, password } = req.body;

    if (!EmailorPhone) return res.status(400).send('Email or phone number is required');
    if (!password) return res.status(400).send('Password is required');

    // Check if the identifier is an email or phone number
    const user = await User.findOne({
        $or: [{ email: EmailorPhone }, { phone: EmailorPhone }]
    });

    if (!user) return res.status(404).send("User with given email or phone number doesn't exist");

    const isMatch = await user.checkPassword(password);
    if (!isMatch) return res.status(400).send('Password not correct for given user');

    const token = user.genAuthToken();
    res.header('x-auth-token', token).send('LOGIN');
});



// "title": "Firage",
// "about": "ProducDescription",
// "img": "https://img4cdn.haraj.com.sa/userfiles30/2020-08-30/800x800-1_-GO__MTU5ODgxMzQ3NjQ4OTMyNjAzNjMwMw.jpg",
// "price": 1255.99

//product
app.get('/product', async (req, res) => {
    const products = await Product.find();
    return res.send(products);
});

app.get('/:id', async (req, res) => {
    const product = await Product.findById(req.params.id).populate('user');

    if (!product) return res.status(404).send("Couldn't find a product with the given id");

    return res.send(product);
});

app.post('/add', authMid, async (req, res) => {
    const { title, about, img, price } = req.body;

    let product = new Product({ title, about, img, price, user: req.user._id });
    product = await product.save();

    return res.send(product);
});

//cart
app.get('/cart', authMid, async (req, res) => {
    let products = [];

    for (const product of req.user.cart)
        products.push(await Product.findById(product._id));

    return res.send(products);
});

app.put('/add', authMid, async (req, res) => {
    const { id } = req.body;
    if (!id) return res.status(400).send('Product id is required');

    const product = await Product.findById(id);
    if (!product) return res.status(404).send('The product you are looking for is not found');

    if (req.user.cart.includes(product._id)) return res.status(400).send('The product is already in your cart');

    const user = await User.findByIdAndUpdate(req.user._id, {
        cart: [...req.user.cart, product._id]
    }, { new: true, useFindAndModify: false });

    return res.send(user);
});

app.delete('/:id', authMid, async (req, res) => {
    const { id } = req.params;
    req.user.cart = req.user.cart.filter(p => String(p) !== id);
    return res.send(await req.user.save());
});

app.delete('/', authMid, async (req, res) => {
    req.user.cart = [];
    return res.send(await req.user.save());
});

app.get('/total', authMid, async (req, res) => {
    let total = 0;

    let products = [];
    for (const product of req.user.cart)
        products.push(await Product.findById(product));

    for (const product of products)
        total += product.price;

    return res.send(String(total));
});




mongoose
    .connect('mongodb://127.0.0.1:27017/labb1')
    .then(() => {
        console.log('connected to MongoDB')
        app.listen(8000, () => console.log('app started on port 8000'))
    }).catch((error) => {
        console.log('cant connect to mongodb' + error)
    })


