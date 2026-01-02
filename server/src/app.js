import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use(cors())

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({ extended: true }));

app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())


//routes import
import interviewRoute from './routes/interview.route.js'


//routes declaration
app.use('/api/v1/user', interviewRoute); 


app.use('/health', (req, res) => {
    res.status(200).send('Server is healthy');
});

export { app } 