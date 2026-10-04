import { Request,Response,NextFunction } from "express";
import prisma from "../prisma/client"
import { Organization } from "@prisma/client";


declare global {
    namespace Express{
        interface Request{
            org?:Organization
        }
    }
}

export async function checkOrgStatus(req:Request,res:Response,next:NextFunction) {
    if(!req.user){
        return res.status(401).json({error:"Not Authurized"})
    }
    
    const org=await prisma.organization.findUnique({
        where:{id:req.user.organizationId}
    })
    if(!org){
        return res.status(404).json({error:"Organization Not Found"})
    }

    if(org.status==='trial' && org.subscriptionEndsAt<new Date){
        await prisma.organization.update({
            where:{id:org.id},
            data:{status:"expired"}
        })
        return res.status(403).json({error:"Trial expired.Please Upgrade Your plan."})
    }

    if(org.status==='expired'){
        return res.status(403).json({error:"Trial expired.Please Upgrade Your plan."})
    }

    req.org=org
    next()
}