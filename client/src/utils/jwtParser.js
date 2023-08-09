import jwt_decode from "jwt-decode";

const jwt = localStorage.getItem("jwt")
let token = {user_id:null}
if (jwt) {
    token = jwt_decode(jwt)
}
export default token
