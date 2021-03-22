const port = 3000;

let cors = require('cors');
let bodyParser = require('body-parser');
let express = require('express');

let app = express();
app.use(cors());

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/submit_project_request', function (req, res) {
    var client_org = req.parm("client_org");
});

app.post('/', (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
    let data = processRequest(req.body);
    console.log(req.body.message);
    console.log(data);
    if (data) {

        if(req.body.message == 'connect') console.log(data);
        var json = JSON.stringify(data);
        res.send(json);
    }
    else
        res.send(null);
});

let games = [];

let processRequest = function (req) {
    if (req.message == "register") {
        if (req.parameters[0]) {
            return { message: "OK" };
        }
        else {
            return { message: "You should register with a valid email address." };
        }
    }
    else if (req.message == "newGame") {
        if (!req.id) {
            return { message: "You must register first!" }
        }
        let s = new serverBoard(req.id);
        games.push(s);
        return { message: "", data: s.data };
    }
    else if (req.message == "connect") {
        let data;
        games.forEach(function (g) {
            if (g.id == req.parameters[0]) {
                g.AddPlayer(req.parameters[1]);
                data = { message: "connected", data: g.data };
            }
        });
        return data;
    }
    else if (req.message == "getCurrentGames") {
        return { data: games.map(x => { return { gameId: x.id, status: x.status, owner: x.data.owner, opponent: x.data.opponent } }) };
    }
    else {
        return null;
    }
}

let server = new serverBoard();

app.listen(port, () => {
    console.log(`server is listening on port ${port}.`);
});

function serverBoard(owner) {
    this.id;
    this.data = {};
    this.data.owner = owner;
    this.data.opponent = "";
    this.data.viewers = [];

    this.data.cellPieces = new Array(8);
    this.data.cellPieces[0] = [{ type: "Rook", color: "Black" }, { type: "Knight", color: "Black" }, { type: "Bishop", color: "Black" }, { type: "Queen", color: "Black" }, { type: "King", color: "Black" }, { type: "Bishop", color: "Black" }, { type: "Knight", color: "Black" }, { type: "Rook", color: "Black" }];
    this.data.cellPieces[1] = [{ type: "Pawn", color: "Black" }, { type: "Pawn", color: "Black" }, { type: "Pawn", color: "Black" }, { type: "Pawn", color: "Black" }, { type: "Pawn", color: "Black" }, { type: "Pawn", color: "Black" }, { type: "Pawn", color: "Black" }, { type: "Pawn", color: "Black" }];
    this.data.cellPieces[6] = [{ type: "Pawn", color: "White" }, { type: "Pawn", color: "White" }, { type: "Pawn", color: "White" }, { type: "Pawn", color: "White" }, { type: "Pawn", color: "White" }, { type: "Pawn", color: "White" }, { type: "Pawn", color: "White" }, { type: "Pawn", color: "White" }];
    this.data.cellPieces[7] = [{ type: "Rook", color: "White" }, { type: "Knight", color: "White" }, { type: "Bishop", color: "White" }, { type: "Queen", color: "White" }, { type: "King", color: "White" }, { type: "Bishop", color: "White" }, { type: "Knight", color: "White" }, { type: "Rook", color: "White" }];

    this.data.beingMove = {};
    this.data.legalMoves = [];

    // 0x80 1: started, 0: not started
    // 0x40 1: owner is white, 0: owner is black
    // 0x20 1: Black King under threat 0: no threat on Blck King
    // 0x10 1: White King under threat 0: no threat on White King
    // 0x08 1: White turn 0: Black turn
    // 0x04 1: Being move 0: Waiting to move
    // 0x03 00: current, 01: White won, 10: Black won, 11: equal
    this.status = 0;

    let u = Date.now().toString(16) + Math.random().toString(16) + '0'.repeat(16);
    this.id = [u.substr(0, 8), u.substr(8, 4), '4000-8' + u.substr(13, 3), u.substr(16, 12)].join('-');

    this.AddPlayer = function (playerId) {
        this.data.opponent = playerId;
        this.status = 0xC8;
    }
    this.checkForLand = function (landPoint, piece) {
        if (this.data.cellPieces[landPoint.X][landPoint.Y]) {
            if (this.data.cellPieces[landPoint.X][landPoint.Y].color != piece.color) {
                this.legalMoves.push(landPoint);
                return piece.type == 'Knight';
            }
            else {
                return piece.type == 'Knight';
            }
        }
        else {
            legalMoves.push(landPoint);
            return piece.type != 'King';
        }
    }

    this.setLegalMoves = function (startPoint, piece) {
        this.data.legalMoves = [];
        if (piece.type == 'King' || piece.type == 'Queen' || piece.type == 'Rook') {// straight move
            for (let i = startPoint.X + 1; i < 8; i++) {
                if (!this.checkForLand({ X: i, Y: startPoint.Y }, piece))
                    break;
            }
            for (let i = startPoint.X - 1; i >= 0; i--) {
                if (!this.checkForLand({ X: i, Y: startPoint.Y }, piece))
                    break;
            }
            for (let i = startPoint.Y + 1; i < 8; i++) {
                if (!this.checkForLand({ X: startPoint.X, Y: i }, piece))
                    break;
            }
            for (let i = startPoint.Y - 1; i >= 0; i--) {
                if (!this.checkForLand({ X: startPoint.X, Y: i }, piece))
                    break;
            }
        }

        if (piece.type == 'King' || piece.type == 'Queen' || piece.type == 'Rook') {// diagonal move
            for (let i = 1; i < 8; i++) {
                if (startPoint.X + i >= 8 || startPoint.Y + i >= 8)
                    break;
                if (!this.checkForLand({ X: startPoint.X + i, Y: startPoint.Y + i }, piece))
                    break;
            }
            for (let i = 1; i < 8; i++) {
                if (startPoint.X + i >= 8 || startPoint.Y - i < 0)
                    break;
                if (!this.checkForLand({ X: startPoint.X + i, Y: startPoint.Y - i }, piece))
                    break;
            }
            for (let i = 1; i < 8; i++) {
                if (startPoint.X - i < 0 || startPoint.Y + i >= 8)
                    break;
                if (!this.checkForLand({ X: startPoint.X - i, Y: startPoint.Y + i }, piece))
                    break;
            }
            for (let i = 1; i < 8; i++) {
                if (startPoint.X - i < 0 || startPoint.Y - i < 0)
                    break;
                if (!this.checkForLand({ X: startPoint.X - i, Y: startPoint.Y - i }, piece))
                    break;
            }
        }

        if (piece.type == 'Kinight') {// Knight move
            for (let i = -2; i < 3; i++) {
                if (i == 0) {
                    continue;
                }
                for (let j = -2; j < 3; j++) {
                    if (j == 0 || abs(j) == abs(i)) {
                        continue;
                    }
                    if (startPoint.X + i < 0 || startPoint.X + i >= 8 || startPoint.Y + j < 0 || startPoint.Y + j >= 8)
                        continue;
                    this.checkForLand({ X: startPoint.X + i, Y: startPoint.Y + i }, piece);
                }
            }
        }
    }
}