import sessionModel from '../models/session.js'
import userModel from '../models/user.js'
export function authMiddleware(req, res, next) {
    const token = req.cookies.token
    const badResponse = { status: 'error', message: 'please login in order to continue', user:null }
    if (!token) {
        return res.send(badResponse)
    }
    let found = sessionModel.findOne({ id: token })
    if (!found) {
        return res.send(badResponse)
    }
    let now = Date.now()
    let diff = (now - found.expires) / 1000
    if (diff > 20 * 60 * 1000) {
        return res.send({ ...badResponse, message: 'session expired' })
    }
    
    sessionModel.update({userId:found.userId}, {expires:Date.now() + 20 * 60 * 1000})
    const user = userModel.findOne({ id: found.userId })
    if (!user) {
        return res.send(badResponse)
    }

    req.user = user.omit('login', 'password')
    return next()
}