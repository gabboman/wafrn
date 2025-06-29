import { environment } from "../../environment.js";
let posts = [
'LIST OF IDS OF POSTS TO NUKE'
]
const token = "Bearer USERTOKEN GOES GERE. IT SHOULD BE 'Bearer TOKEN'"

for await (const post of posts) {
  console.log(`Nuking ${post}`)
  await fetch(`${environment.frontendUrl}/api/deletePost?id=${post}`, {
    "credentials": "include",
    "headers": {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:139.0) Gecko/20100101 Firefox/139.0",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3",
        "Sec-GPC": "1",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "Authorization": token
    },
    "method": "DELETE",
    "mode": "cors"
});
}

