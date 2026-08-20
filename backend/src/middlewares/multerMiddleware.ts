import { Request } from 'express'
import multer from 'multer'

const storage = multer.diskStorage({
    destination : function(req: Request, file:Express.Multer.File, cb:any){
        cb(null, "./src/uploads") //(error, success)
    },
    filename : function(req: Request, file :Express.Multer.File, cb:any){
        cb(null, file.originalname)
    }
})

export {multer, storage}