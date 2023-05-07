const express = require('express');
const { UserModel } = require('../Models/user.model');
const bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');
const { ProductModel } = require('../Models/product.model');
const { auth } = require('../Middleware/Authorization.mw');
const Router = express.Router();
Router.get("/", (req, res) => {
    res.send("Home page")
})
Router.post("/register", async (req, res) => {
    bcrypt.hash(req.body.password, 3, async function (err, hash) {
        try {
            await UserModel.insertMany([{ ...req.body, password: hash }]);
            res.json({ msg: "User registerd" })
        } catch (error) {
            res.status(404).json({ "err": err, "err2": error })
        }
    });
})
Router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        let userData = await UserModel.findOne({ email })
        bcrypt.compare(password, userData.password, function (err, result) {
            if (result) {
                var token = jwt.sign({ userID: userData._id }, 'shhhhh', { expiresIn: '1h' });
                res.json({ msg: "Login success", token: token })
            }
            else {
                res.status(404).json({ msg: "wrong credentials!" })
            }
            if (err) {
                res.status(404).json({ msg: "some error occured" })
            }
        });
    }
    catch (err) {
        res.status(404).json({ msg: "wrong username/password" })
    }
})
Router.get("/getProd", auth, async (req, res) => {
    res.send(await ProductModel.find())
})
Router.post("/addProduct", auth, async (req, res) => {
    await ProductModel.insertMany(req.body);
    res.json({ "msg": "data added" })
})
Router.patch("/patch/:id", auth, async (req, res) => {
    await ProductModel.findByIdAndUpdate({ _id: req.params.id }, req.body)
    res.json({ "msg": "Data has been updated!" });
})
Router.delete("/delete/:id", auth, async (req, res) => {
    await ProductModel.findByIdAndDelete({ _id: req.params.id })
    res.json({ "msg": "Data has been Deleted!" });
})
Router.get("/product/:id", auth, async (req, res) => {
    res.send(await ProductModel.findById({ _id: req.params.id }))
})
Router.get("/addtocart/:id", auth, async (req, res) => {
    const { id } = req.params;
    const token = req.headers.authorization;
    jwt.verify(token, 'shhhhh', async (err, decoded) => {
        if (decoded) {
            let user = await UserModel.findOne({ _id: decoded.userID });
            user.order.push(id);
            await UserModel.findByIdAndUpdate({ _id: decoded.userID }, user);
            res.json({ msg: "product added to cart" })
        }
        if (err) {
            res.status(404).json({ 'msg': 'Please login first!' })
        }
    });

})
Router.get("/complete", auth, async (req, res) => {
    const token = req.headers.authorization;
    jwt.verify(token, 'shhhhh', async (err, decoded) => {
        if (decoded) {
            let user = await UserModel.findOne({ _id: decoded.userID });
            user.orderHist = user.order;
            user.order = [];
            await UserModel.findByIdAndUpdate({ _id: decoded.userID }, user);
            res.json({ msg: "Order" })
        }
        if (err) {
            res.status(404).json({ 'msg': 'Please login first!' })
        }
    });
})
module.exports = { Router }