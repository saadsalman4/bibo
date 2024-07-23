const { Message, Owner } = require('../connect');

async function chatHistoryPerUser(req, res){
    const {id} = req.params

    try{
        const owner = await Owner.findOne({where: {id}})
        if(!owner){
            return res.status(404).json("User not found")
        }
        const user = req.user
        const chats = await Message.findAll({where: {from: user.company_name, to: owner.company_name}})
        return res.status(200).json(chats)
    }
    catch(e){
        console.log(e)
        return res.status(400).json("error")
    }
}

async function chatHistory(req, res){
    try{
        const user = req.user
        const chats = await Message.findAll({where: {from: user.company_name}})
        return res.status(200).json(chats)
    }
    catch(e){
        console.log(e)
        return res.status(400).json("error")
    }
}



module.exports={chatHistoryPerUser, chatHistory}