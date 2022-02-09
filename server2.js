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
            parsedData.username === user.username && 
            parsedData.password === user.password
            ) {
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
         } else {
            res.writeHead(400)
            res.end("Неправильный логин или пароль")
         }
      })
   } else if (req.url === "/post" && req.method === "POST") {
      const strCookie = req.headers.cookie
      if (
         parsedCookie(strCookie).userId === user.id &&
         parsedCookie(strCookie).authorized
      ) {
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
      } else {
         res.writeHead(200)
         res.end(`Вы не авторизованы`)
      }
   } else if (req.url === "/delete" && req.method === "DELETE") {
      const strCookie = req.headers.cookie
      if (
         parsedCookie(strCookie).userId === user.id &&
         parsedCookie(strCookie).authorized
      ) {
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
         res.end(`Пользователь ${parsedCookie(strCookie).username} удалил файл`)
      } else {
         res.writeHead(200)
         res.end(`Вы не авторизованы`)
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