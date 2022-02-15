import { createServer } from "http"
import { existsSync, mkdirSync, writeFileSync, unlinkSync } from "fs"

const host = "localhost"
const port = 8000

const user = {
   id: 123,
   username: "testuser",
   password: "qwerty"
   }

const requestListener = (req, res) => {
   if (req.url === "/auth" && req.method === "POST") {
      let data = ""
      req.on("data", (chunk) => {
         data += chunk
      })
      req.on("end", () => {
         const parsedData = JSON.parse(data)
         if (
            parsedData.username !== user.username && 
            parsedData.password !== user.password
            ) {
            res.writeHead(400)
            res.end("Неправильный логин или пароль")
         } else {
            let setUserID = `${user.id};
               Expires=${new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toUTCString()};
               max_age=${60 * 60 * 24 * 2};
               domain=localhost;
               path=/;`

            let setUserAuth = `true;
               Expires=${new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toUTCString()};
               max_age=${60 * 60 * 24 * 2};
               domain=localhost;
               path=/;`

            res.setHeader("Set-Cookie", [
               `userId=${setUserID}`,
               `authorized=${setUserAuth}`,
            ])
            res.writeHead(200)
            res.end(`Добро пожаловать, ${user.username}!`)
         }
      })
   } else if (
      req.url === "/post" && 
      req.method === "POST"
   ) {
      const objCookie = parsedCookie(req.header.cookie)
      if (objCookie.userId !== user.id &&
         !(objCookie.authorized)) {
         res.writeHead(200)
         res.end(`Вы не авторизованы`)
      } else {
         let data = ""
         req.on("data", (chunk) => {
            data += chunk
         })
         req.on("end", () => {
            const parsedData = JSON.parse(data)
            try {
               let dir = "./files"
               if (!existsSync(dir)) {
                  mkdirSync(dir)
               }
               writeFileSync(
                  `${dir}/${parsedData.filename}`,
                  `${parsedData.content}`,
                  {
                     encoding: "utf-8",
                     flag: "a",
                  }
               )
            } catch (err) {
               res.writeHead(500)
               res.end("Internal server error")
            }
         })
         res.writeHead(200)
         res.end(
            `Добро пожаловать, ${parsedCookie(strCookie).username}`
         )
      }
   } else if (
      req.url === "/delete" && 
      req.method === "DELETE"
   ) {
      const objCookie = parsedCookie(req.header.cookie)
      if (
         objCookie.userId !== user.id && 
         !objCookie.authorized
      ) {
         res.writeHead(200)
         res.end(`Вы не авторизованы`)
      } else {
         let data = ""
         req.on("data", (chunk) => {
            data += chunk
         })
         req.on("end", () => {
            const parsedData = JSON.parse(data)
            try {
               let dir = "./files"
               if (
                  existsSync(dir) &&
                  existsSync(`${dir}/${parsedData.filename}`)
               ) {
                  unlinkSync(`./${dir}/${parsedData.filename}`)
               }
            } catch (err) {
               res.writeHead(500)
               res.end("Internal server error")
            }
         })
         res.writeHead(200)
         res.end(`Пользователь ${objCookie.username} удалил файл`)
      } 
   } else {
      res.writeHead(404)
      res.end("Page not found")
   }
}

const server = createServer(requestListener)

server.listen(port, host, () => {
   console.log(`Server is running on http://${host}:${port}`)
})

function parsedCookie(strCookie) {
   return Object.assign(
      {},
      ...strCookie
         .split(";")
         .map((prop) => prop.trim().split("="))
         .map(([key, value]) => ({ [key]: value }))
   )
}