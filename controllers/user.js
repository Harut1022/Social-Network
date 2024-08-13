import { nanoid } from 'nanoid'
import userModel from '../models/user.js'
import sessionModel from '../models/session.js'
import bcrypt from 'bcrypt'


class UserController {
    async signupHandler(req, res) {
        try {
            const { name, surname, login, password } = req.body


            let error = ""
            const user = userModel.findWhere({ login })
            if (!name.trim() || !surname.trim() || !login.trim() || !password.trim()) {
                error = "Please fill all the fields"
            } else if (password.length < 6) {
                error = 'Please choose longer password'
            } else if (user.length) {
                error = 'Login is busy'
            }
            if (error) {
                return res.send({ status: 'error', message: error })

            } else {
                req.body.password = await bcrypt.hash(req.body.password, 10)
                const result = userModel.insert(req.body)
                console.log(result)
                if (result.changes) {
                    return res.send({ status: 'ok' })
                }
            }
        }
        catch (err) {
            console.log(err.message)
            res.send({ status: 'error', message: "internal server error" })
        }
    }

    async loginHandler(req, res) {
        try {
            let { login, password } = req.body
            let found = null
            let error = ''
            if (!login.trim() || !password.trim()) {
                error = 'please fill all the fields'
            } else {
                found = userModel.findOne({ login })
                if (!found) {
                    error = 'Wrong user credentials: login'
                } else {
                    let result = await bcrypt.compare(password, found.password)
                    if (!result) {
                        error = 'Wrong user credentials: password'
                    }
                }
            }
            if (error) {
                    res.send({ status: 'error', message: error })
            } else if (found) {
                let code = nanoid()

                sessionModel.delete({ userId: found.id })
                const result = sessionModel.insert({
                    id: code,
                    userId: found.id,
                    expires: Date.now() + (20 * 60 * 1000)
                })

                res.cookie('token', code, { maxAge: 900000, httpOnly: false });
                res.send({ status: 'ok' })
            }

            //RESPONSE
        } catch {
            res.send({ status: 'error', message: 'internal server error' })
        }
    }

    async authHandler(req, res) {
        res.send({ status: 'ok', user: req.user })
    }

    async logoutHandler(req, res) {
        const token = req.cookies.token
        sessionModel.delete({ id: token })
        res.clearCookie('token')
        return res.send({ status: 'ok', user: null })
    }
}

export default new UserController()