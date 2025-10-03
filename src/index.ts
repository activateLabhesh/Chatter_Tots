import express,{Request, Response} from 'express'
import dotenv from 'dotenv'

dotenv.config();

const port: number = 5000;
const app = express();

app.use(express.json());

app.get('/',(req:Request, res: Response)=>{
    res.status(200).json({message: "Health check complete."})
});


app.listen(port,() =>{
    console.log("I think we are connected.")
})