const express = require("express");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// 👥 Usuarios
let users = [
  { username: "admin", password: "1234", role: "owner" },
  { username: "user", password: "1234", role: "user" }
];

let scripts = [];
let sessions = {};

// 🔐 LOGIN
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).send("Error");

  const token = Math.random().toString(36);
  sessions[token] = user;

  res.json({ token, role: user.role });
});

// 🔒 AUTH
function auth(req, res, next){
  const token = req.headers.authorization;
  if(!sessions[token]) return res.status(403).send("No auth");
  req.user = sessions[token];
  next();
}

// 👑 OWNER
function owner(req, res, next){
  if(req.user.role !== "owner") return res.status(403).send("Admin only");
  next();
}

// 📜 SUBIR SCRIPT
app.post("/scripts", auth, (req, res) => {
  const { title, code, language } = req.body;

  const newScript = {
    id: Date.now(),
    title,
    code,
    language,
    author: req.user.username,
    likes: 0
  };

  scripts.push(newScript);
  res.json(newScript);
});

// 📥 GET SCRIPTS + SEARCH
app.get("/scripts", (req, res) => {
  const q = req.query.q;

  if(q){
    return res.json(
      scripts.filter(s => s.title.toLowerCase().includes(q.toLowerCase()))
    );
  }

  res.json(scripts);
});

// ❤️ LIKE
app.post("/scripts/:id/like", auth, (req, res) => {
  const s = scripts.find(x => x.id == req.params.id);
  if(s){
    s.likes++;
    res.json(s);
  } else res.status(404).send("No existe");
});

// 🗑️ DELETE ADMIN
app.delete("/admin/scripts/:id", auth, owner, (req, res) => {
  scripts = scripts.filter(s => s.id != req.params.id);
  res.send("Deleted");
});

// 📊 ADMIN PANEL
app.get("/admin", auth, owner, (req, res) => {
  res.json({ users, scripts });
});

app.listen(3000, () => console.log("🔥 ULTRA PRO SERVER ON"));