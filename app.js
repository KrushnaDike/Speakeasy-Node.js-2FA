import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import speakeasy from "speakeasy";

mongoose.connect("mongodb://127.0.0.1:27017", { dbName: "speakeasy" }).then(()=> {
    console.log("MongoDB Connected Successfully");
}).catch((err)=> {
    console.log(err);
});

// creating a schema
const userSchema = new mongoose.Schema({
    userName: String,
    secret: Object
});

// creating a model is like a Collection
const User = new mongoose.model("User", userSchema);

const app = express();
const port = 2000;

// using middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// testing api
app.get("/api/v1/testing", (req, res, next)=> {
    res.send("Working Fine...");    
});

// register user with speakeasy
app.post("/api/v1/register", async(req, res)=> {
    try {
        const { userName } = req.body;
    
        // Generating a secret key using speakeasy
        const secret = speakeasy.generateSecret();
        console.log(secret);
    
        // save the user with generated secret key
        await User.create({
            userName,
            secret
        });
    
        res.status(200).json({
            success: true,
            message: `${userName} Registered Successfully Please verify It!`,
            secret: secret.base32
        });
    } catch(err) {
        console.log(err);
        res.json({
            success: false,
            message: "Error while generating secret key"
        });
    }
});

// verify user with speakeasy
app.post("/api/v1/verify/:id", async(req, res)=> {
    const { id } = req.params;
    const { token } = req.body;

    try {
        const user = await User.findById(id);
    
        if(!user) res.status(404).json({
            success: false,
            message: "User Not Found"
        });
    
        const isValid = speakeasy.totp.verify({
            secret: user.secret.base32,
            encoding: 'base32',
            token
        });
    
        if(isValid) {
            res.json({
                success: true,
                message: "Login Successfully"
            });
        } else {
            res.json({
                success: false,
                message: "Invalid Otp, Login Failed"
            });
        }
    } catch(err) {
        console.log(err);
        res.json({
            success: false,
            message: "Error while finding user"
        });
    }

});

app.listen(port, ()=> {
    console.log(`Server is working on http://localhost:${port}`);
});