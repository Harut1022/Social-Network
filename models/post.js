import { Base } from "./base.js";
import commentsModel from "./comments.js";
import likesModel from "./likes.js";
import db from './init.js';

class Post extends Base {
    table = "posts"

    findWhere(conditionals) {
        return   super
                .findWhere(conditionals)
                .map(post => {
                    post.likes = likesModel.findWhere({ postId: post.id })
                    post.comments = commentsModel.findWhere({ postId: post.id })

                    return post
                })
    }

    findByHash(hash){
        
        return db.prepare(`SELECT * FROM posts where title like '%${hash}%'`).all()
    }
}

export default new Post()