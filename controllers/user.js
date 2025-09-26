import { nanoid } from 'nanoid'
import userModel from '../models/user.js'
import sessionModel from '../models/session.js'
import bcrypt from 'bcrypt'
import postModel from '../models/post.js'
import followModel from '../models/follow.js'
import requestModel from '../models/request.js'
import { loadUser } from '../lib/helpers.js'
import likesModel from '../models/likes.js'
import blockModel from '../models/block.js'
import jwt from 'jsonwebtoken'

//it's better to put into .env as a seperate variable
const secret = '/22Zi1W7aQTWCbadcasz1FQ4Hq5lHF1d0rRII9mMs2o='
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
                return res.status(400).send({ status: 'error', message: error })

            } else {
                req.body.password = await bcrypt.hash(req.body.password, 10)
                const result = userModel.insert(req.body)
                if (result.changes) {
                    return res.send({ status: 'ok' })
                }
            }
        }
        catch (err) {
            res.status(500).send({ status: 'error', message: "internal server error: ", internal: err.message })
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
                res.status(404).send({ status: 'error', message: error })
            } else if (found) {
                const token = jwt.sign(
                    {
                        id: found.id,
                        name: found.name,
                        surname: found.surname,
                        isPrivate: found.isPrivate,
                        cover: found.cover,
                        picture: found.picture
                    },
                    secret,
                    { expiresIn: '1h' }
                );

                res.cookie('token', token, { maxAge: 900000, httpOnly: false, secure: true });
                res.send({ status: 'ok' })
            }

            //RESPONSE
        } catch (err) {
            res.send({ status: 'error', message: 'internal server error', internal: err.message })
        }
    }

    async authHandler(req, res) {
        res.send({ status: 'ok', payload: req.user })
    }

    async logoutHandler(req, res) {
        res.clearCookie('token')
        return res.send({ status: 'ok', payload: null })
    }

    async passwordUpdate(req, res) {
        try {
            const { oldPassword, newPassword } = req.body || {};

            if (!oldPassword || !newPassword) {
                return res.status(400).json({ status: 'error', message: 'Missing fields: oldPassword and newPassword are required.' });
            }
            if (typeof newPassword !== 'string' || newPassword.length < 8) {
                return res.status(400).json({ status: 'error', message: 'Password must be at least 8 characters.' });
            }

            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ status: 'error', message: 'Unauthorized.' });
            }

            const user = userModel.findOne({ id: userId });
            if (!user) {
                return res.status(404).json({ status: 'error', message: 'User not found.' });
            }

            const matches = await bcrypt.compare(oldPassword, user.password);
            if (!matches) {
                return res.status(401).json({ status: 'error', message: 'Old password is incorrect.' });
            }

            const sameAsOld = await bcrypt.compare(newPassword, user.password);
            if (sameAsOld) {
                return res.status(400).json({ status: 'error', message: 'New password must be different from the old password.' });
            }

            const hash = await bcrypt.hash(newPassword, 12);
            userModel.update({ id: userId }, { password: hash});

            return res.status(200).json({ status: 'success', message: 'Password updated successfully.' });
        } catch (err) {
            return res.status(500).json({ status: 'error', message: 'Internal server error.' });
        }

    }

    async loginUpdate(req, res) {
        try {
            const { newLogin, password } = req.body || {};

            if (!newLogin || !password) {
                return res.status(400).json({ status: 'error', message: 'Missing fields: newLogin and password are required.' });
            }

            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ status: 'error', message: 'Unauthorized.' });
            }

            const user =  userModel.findOne({ id: userId });
            if (!user) {
                return res.status(404).json({ status: 'error', message: 'User not found.' });
            }

            const matches = await bcrypt.compare(password, user.password);
            if (!matches) {
                return res.status(401).json({ status: 'error', message: 'Password is incorrect.' });
            }

            const exists = await userModel.findOne({ login: newLogin });
            if (exists) {
                return res.status(409).json({ status: 'error', message: 'Login is already taken.' });
            }

            userModel.update({ id: userId }, { login: newLogin });

            return res.status(200).json({ status: 'success', message: 'Login updated successfully.' });
        } catch (err) {
            return res.status(500).json({ status: 'error', message: 'Internal server error.' });
        }
    }
    async profilePictureHandler(req, res) {
        const { filename } = req.file
        if (!filename) {
            return res.status(400).json({ status: 'error', message: 'bad request' })
        }
        let source = '/images/' + filename
        const user = req.user.id
        userModel.update({ id: user }, { picture: source })

        res.send({ status: 'ok', message: 'picture uploaded successfully', payload: source })
    }

    async coverPictureHandler(req, res) {
        const { filename } = req.file
        if (!filename) {
            return res.status(400).json({ status: 'error', message: 'bad request' })
        }
        let source = '/images/' + filename
        const user = req.user.id
        userModel.update({ id: user }, { cover: source })

        res.send({ status: 'ok', message: 'cover uploaded successfully', payload: source })
    }

    searchUsers(req, res) {
        const { text } = req.params
        let result = userModel.fullText(text).map(e => e.omit('login', 'password'))
        res.send({ status: 'ok', payload: result })
    }

    getAccount(req, res) {
        const { id } = req.params
        let result = userModel.findOne({ id })
        const user = req.user.id

        if (user == id) {
            return res.send({ status: 'error', message: 'you cannot observe your own account' })
        }
        if (result) {
            const amIFollowing = followModel.findOne({ userId: user, follows: id })
            const followsMe = followModel.findOne({ userId: id, follows: user })
            const requested = requestModel.findOne({ userId: user, requests: id })

            //block
            const amIBlocked = blockModel.findOne({ user: req.user.id, blocked: result.id })
            const heBlockedMe = blockModel.findOne({ user: result.id, blocked: req.user.id })


            result = result.omit('login', 'password')
            result.available = true
            result.connection = {
                following: Boolean(amIFollowing),
                followsMe: Boolean(followsMe),
                requested: Boolean(requested),
                blockedMe: Boolean(heBlockedMe),
                didIBlock: Boolean(amIBlocked)
            }
            const blockedContent = {
                id: result.id,
                name: result.name,
                surname: result.surname,
                picture: null,
                connection: result.connection,
                followers: [],
                followings: [],
                cover: null,
                posts: [],
                available: false
            }
            if (heBlockedMe) {
                return res.send({ status: 'ok', payload: blockedContent })
            }
            if (!result.isPrivate || result.connection.following) {

                result.followers = followModel
                    .findWhere({ follows: result.id })
                    .map(e => e.userId)
                    .map(e => userModel.findOne({ id: e }).omit('login', 'password'))
                result.following = followModel
                    .findWhere({ userId: result.id })
                    .map(e => e.follows)
                    .map(e => userModel.findOne({ id: e }).omit('login', 'password'))


                result.posts = postModel.findWhere({ userId: id }).map(e => {
                    e.isLiked = Boolean(likesModel.findOne({ userId: req.user.id, postId: e.id }))
                    let title = e.title

                    const hashtags = title.match(/#[\w]+/g) || [];
                    e.hashtags = hashtags

                    // Remove hashtag words from the original string
                    // const cleanString = title.replace(/#[\w]+/g, '').trim();

                    return e
                })


                if (amIBlocked) {
                    result = blockedContent
                }
            }
        }
        if (!result) {
            result = null
        }
        return res.send({ status: 'ok', payload: result })
    }
    changeStatus(req, res) {
        const user = req.user.id
        const status = userModel.findOne({ id: user }).isPrivate
        userModel.update({ id: user }, { isPrivate: 1 - status })
        return res.send({ status: 'ok', payload: 1 - status })

    }
    follow(req, res) {
        const { id } = req.params
        const user = req.user.id
        if (user == id) {
            return res.status(400).send({ status: 'error', message: 'you can not follow yourself' })
        }
        let found = followModel.findOne({ userId: user, follows: id })
        if (found) {
            followModel.delete({ userId: user, follows: id })
            return res.send({ status: 'ok', message: 'unfolowed' })
        }

        const them = userModel.findOne({ id })
        const already = requestModel.findOne({ userId: user, requests: id })

        if (them.isPrivate) {
            if (!already) {
                requestModel.insert({ userId: user, requests: id })
                return res.send({ status: 'requested' })
            } else {
                requestModel.delete({ userId: user, requests: id })
                return res.send({ status: 'cancelled' })
            }
        }

        followModel.insert({ userId: user, follows: id })
        return res.send({ status: 'following', payload: req.user.omit('login', 'password') })


    }
    unfollow(req, res) {
        const { id } = req.params
        const user = req.user.id
        if (user == id) {
            return res.status(400).send({ status: 'error', message: 'you ca not unfollow yourself' })
        }
        let found = followModel.findOne({ userId: user, follows: id })
        if (!found) {
            return res.status(400).send({ status: 'error', message: 'you are not following this account' })
        }

        followModel.delete({ userId: user, follows: id })
        return res.send({ status: 'unfollowed', payload: req.user.omit('login', 'password') })

    }

    cancelRequest(req, res) {
        const { id } = req.params
        const me = req.user.id

        const found = requestModel.findOne({ userId: me, requests: id })
        if (!found) {
            return res.send({ status: 'error', message: 'no such request' })
        } else {
            requestModel.delete({ userId: me, requests: id })
            return res.send({ status: 'cancelled' })
        }
    }

    accept(req, res) {
        const { id } = req.params
        const user = req.user.id

        const found = requestModel.findOne({ id })
        if (!found) {
            return res.send({ status: 'error', message: 'no such request' })
        }

        if (found.requests != user) {
            return res.send({ status: 'error', message: 'you do not have a right to accept this request' })
        }

        followModel.insert({ userId: found.userId, follows: user })
        requestModel.delete({ id })
        return res.send({ status: 'ok', message: 'accepted' })
    }

    decline(req, res) {
        const { id } = req.params
        const user = req.user.id

        const found = requestModel.findOne({ id })
        if (!found) {
            return res.send({ status: 'error', message: 'no such request' })
        }

        if (found.requests != user) {
            return res.send({ status: 'error', message: 'you do not have a right to decline this request' })
        }

        requestModel.delete({ id })
        return res.send({ status: 'ok', message: 'declined' })
    }

    getRequests(req, res) {
        const id = req.user.id
        const all = requestModel
            .findWhere({ requests: id })
            .map(request => {
                return {
                    id: request.id,
                    user: userModel.findOne({ id: request.userId }).omit('login', 'password')
                }
            })

        return res.send({ status: 'ok', payload: all })
    }
    getFollowers(req, res) {
        const { id } = req.user
        const followers = followModel
            .findWhere({ follows: id })
            .map(loadUser)
        return res.send({ status: 'ok', payload: followers })
    }

    getFollowings(req, res) {
        const { id } = req.user
        const followers = followModel
            .findWhere({ userId: id })
            .map(x => loadUser(x, 'follows'))

        return res.send({ status: 'ok', payload: followers })
    }

    block(req, res) {
        const me = req.user.id
        const { id } = req.params

        let payload = { user: me, blocked: id }
        const found = blockModel.findOne(payload)
        const him = userModel.findOne({ id })
        if (found) {
            blockModel.delete(payload)

            let result = him
            const amIFollowing = followModel.findOne({ userId: me, follows: id })
            const followsMe = followModel.findOne({ userId: id, follows: me })
            const requested = requestModel.findOne({ userId: me, requests: id })

            //block
            const amIBlocked = blockModel.findOne({ user: req.user.id, blocked: result.id })
            const heBlockedMe = blockModel.findOne({ user: result.id, blocked: req.user.id })

            if (heBlockedMe) {
                return res.send({ status: 'error', message: 'you are blocked' })
            }

            result.available = true
            result.connection = {
                following: Boolean(amIFollowing),
                followsMe: Boolean(followsMe),
                requested: Boolean(requested),
                amIBlocked: Boolean(heBlockedMe),
                didIBlock: Boolean(amIBlocked)
            }

            if (!result.isPrivate || result.connection.following) {

                result.followers = followModel
                    .findWhere({ follows: result.id })
                    .map(e => e.userId)
                    .map(e => userModel.findOne({ id: e }).omit('login', 'password'))

                result.following = followModel
                    .findWhere({ userId: result.id })
                    .map(e => e.follows)
                    .map(e => userModel.findOne({ id: e }).omit('login', 'password'))


                result.posts = postModel.findWhere({ userId: id }).map(e => {
                    e.isLiked = Boolean(likesModel.findOne({ userId: req.user.id, postId: e.id }))
                    return e
                })


            }

            return res.send({ status: 'ok', message: 'unblocked', payload: result?.omit('login', 'password') })
        } else {
            blockModel.insert({ user: me, blocked: id })
            return res.send({ status: 'ok', message: 'blocked' })
        }

    }
}

export default new UserController()