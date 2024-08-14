import postModel from '../models/post.js'
class PostController{

    addHandler(req, res){
        const { filename } = req.file
        let source = '/images/' + filename
        const user = req.user.id

        const post = {
            title: req.body.content,
            userId: user,
            picture: source
        }
        const row = postModel.insert(post)

        res.send({ status: 'ok', message:'cover uploaded successfully', payload:{...post, id:row.lastInsertRowid} })
    }

    getAll(req,res){
        const user = req.user.id
        const posts = postModel.findWhere({userId:user})
        return res.send({status:'ok', payload:posts})
    }

    handleDelete(req, res) {
        const id = req.params.id
        const user = req.user.id
        const post = postModel.findOne({id})
        if(!post){
            return res.send({status:'error', message:'no such post'})
        }
        if(post.userId != user){
            return res.send({status:'error', message:'you do not have rights to delete this post'})
        }

        postModel.delete({id})
        return res.send({status:'ok', payload:id})
    }
}

export default new PostController()