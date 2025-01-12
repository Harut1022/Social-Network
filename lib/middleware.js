import sessionModel from '../models/session.js'
import userModel from '../models/user.js'
import followModel from '../models/follow.js'
import postModel from '../models/post.js'
import jwt from 'jsonwebtoken'
//jsut for testing reasons
const secret = '/22Zi1W7aQTWCbadcasz1FQ4Hq5lHF1d0rRII9mMs2o='

export function authMiddleware(req, res, next) {
    const token = req.cookies.token
    const badResponse = { status: 'error', message: 'please login in order to continue', user: null }
    if (!token) {
        return res.status(403).send(badResponse)
    }
    jwt.verify(token, secret, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }

        req.user = decoded;
        const found = userModel.findOne({ id: decoded.id }).omit('login','password')
        req.user = found

        req.user.followers = followModel
            .findWhere({ follows: req.user.id })
            .map(e => e.userId)
            .map(e => userModel.findOne({ id: e }).omit('login', 'password'))

        req.user.following = followModel
            .findWhere({ userId: req.user.id })
            .map(e => e.follows)
            .map(e => userModel.findOne({ id: e }).omit('login', 'password'))

        next();
    });




}

export function privateProfile(req, res, next) {
    const { id } = req.params
    let post = postModel.findOne({ id })
    if (!post) {
        return res.send({ status: 'error', message: 'no such post' })
    }
    let whom = userModel.findOne({ id: post.userId })
    if (whom.isPrivate && whom.id != req.user.id) {
        let following = followModel.findOne({ userId: req.user.id, follows: whom.id })
        if (!following) {
            return res.send({ status: 'error', message: 'you do not have a right to react this post' })
        }
    }

    return next()
}