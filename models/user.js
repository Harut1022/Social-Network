import { Base } from "./base.js";

class User extends Base{
    constructor(){
        super()
        this.table = "users"
    }

}

export default new User()