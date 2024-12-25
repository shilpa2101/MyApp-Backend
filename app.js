const Express=require("express")
const Mongoose=require("mongoose")
const Cors=require("cors")
const Bcrypt=require("bcrypt")
const Jwt=require("jsonwebtoken")
const userModel=require("./models/users")
const postModel=require("./models/posts")

const app=Express()   //express is used in many areas.so it assign to a variable
app.use(Cors())//middleware
app.use(Express.json())

Mongoose.connect("mongodb+srv://shilpa:shilpa123@cluster0.qb2ryzy.mongodb.net/userappDB?retryWrites=true&w=majority&appName=Cluster0")

//signup API
app.post("/signup",async(req,res)=>{
    let input=req.body   //input collection from the client (contains the data sent by the client)
    let hashedpassword=Bcrypt.hashSync(req.body.password,10)//we need to pass the collected to models,password should be ecrypted.otheriwse,plaintext will be stored in db
    //10=salt value/cost factor. determines how computationally expensive the hashing process will be. A higher number increases the time required to hash the password, making it more secure against brute force attacks.
    console.log(hashedpassword)
    req.body.password=hashedpassword  
   
   
   userModel.find({email:req.body.email}).then(
    (items)=>{

        if (items.length>0) {
            res.json({"status":"email id already exists"})
        } else {
            let result=new userModel(input)
            result.save()
           res.json({"status":"success"})
        }
    }
   ).catch(
    (error)=>{
        console.log(error.message)
    }) })

//sign in API
app.post("/signin", async(req,res)=>{
    let input=req.body
    let result=userModel.find({email:req.body.email}).then(
        (items)=>{
            if (items.length>0) {
                const passwordValidator=Bcrypt.compareSync(req.body.password,items[0].password)
                if (passwordValidator) {

                    Jwt.sign({email:req.body.email},"mytoken",{expiresIn:"1d"},(error,token)=>{
                        if (error) {
                            res.json({"status":"error password","errorMessage":error})
                        } else {
                            res.json({"status":"success","token":token,"userId":items[0]._id})
                        }
                    })

                } else {
                    res.json({"status":"incorrect password"})
                }
            } else {
                res.json({"status":"invalid email id"})
            }
        }
    )
})


//create a post 

app.post("/create",async(req,res)=>{
    let input=req.body
    let token=req.headers.tokens
     Jwt.verify(token,"mytoken",async(error,decoded)=>{
        if (decoded && decoded.email) {
            let result=new postModel(input)
            await result.save()
            res.json({"status":"success"})
        } else {
            res.json({"status":"Invalid authentication"})
        }
    })
})


//view all post 
app.post("/viewall",(req,res)=>{
    let token=req.headers.token
    Jwt.verify(token,"mytoken",(error,decoded)=>{
        if (decoded) {
            postModel.find().then(
                (items)=>{
                    res.json(items)
                }
            ).catch(
                (error)=>{
                    res.json({"status":"error"})
                }
            )
        } else {
            res.json({"status":"invalid authentication"})
        }
    })
   
})


//view my post
app.post("/viewmypost",(req,res)=>{
    let input=req.body
    let token=req.headers.token
    Jwt.verify(token,"mytoken",(error,decoded)=>{
        if (decoded) {
            postModel.find(input).then(
                (items)=>{
                    res.json(items)
                }
            ).catch(
                (error)=>{
                    res.json({"status":error})
                }
            )
        } else {
            res.json({"status":"invalid authentication"})
        }
    })
   
})


app.listen(8080,()=>{
    console.log("server started")
})