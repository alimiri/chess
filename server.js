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
    //console.log(req.body.message);
    //console.log(data);
    if (data) {

        //if (req.body.message == 'connect') console.log(data);
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

    if (!req.id) {
        return { message: "You must register first!" }
    }

    if (req.message == "newGame") {
        let s = new serverBoard(req.id);
        games.push(s);
        return { message: "OK", data: s.data, gameId: s.id };
    }

    if (req.message == "connect") {
        let data;
        games.forEach(function (g) {
            if (g.id == req.parameters[0]) {
                g.AddPlayer(req.parameters[1]);
                data = { message: "OK", data: g.data, gameId: g.id };
            }
        });
        return data;
    }

    if (req.message == "Click") {
        let data;
        if (!req.id || !req.gameId) {
            data = { message: "No Game" };
        }
        else {
            games.forEach(function (g) {
                if (g.id == req.gameId) {
                    g.click(req.id, req.parameters[0], req.parameters[1]);
                    data = { message: g.message, data: g.data, gameId: g.id };
                }
            });
        }
        return data;
    }

    if (req.message == "getCurrentGames") {
        return { message: "OK", data: games.map(x => { return { gameId: x.id, status: x.status, owner: x.data.owner, opponent: x.data.opponent } }) };
    }

    return null;
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
    this.message = "";

    this.data.cellPieces = new Array(8);
    this.data.cellPieces[0] = [{ type: "Rook", color: "Black" }, { type: "Knight", color: "Black" }, { type: "Bishop", color: "Black" }, { type: "Queen", color: "Black" }, { type: "King", color: "Black" }, { type: "Bishop", color: "Black" }, { type: "Knight", color: "Black" }, { type: "Rook", color: "Black" }];
    this.data.cellPieces[1] = [{ type: "Pawn", color: "Black" }, { type: "Pawn", color: "Black" }, { type: "Pawn", color: "Black" }, { type: "Pawn", color: "Black" }, { type: "Pawn", color: "Black" }, { type: "Pawn", color: "Black" }, { type: "Pawn", color: "Black" }, { type: "Pawn", color: "Black" }];
    this.data.cellPieces[2] = [null, null, null, null, null, null, null, null];
    this.data.cellPieces[3] = [null, null, null, null, null, null, null, null];
    this.data.cellPieces[4] = [null, null, null, null, null, null, null, null];
    this.data.cellPieces[5] = [null, null, null, null, null, null, null, null];
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

    this.click = function (playerId, X, Y) {
        if (!(this.status & 0x80)) {
            if (this.status & 0x3) {
                this.message = "Game has finished";
            }
            else {
                this.message = `Game has not started${this.status}`;
            }
        }
        else if (playerId == owner) {
            //console.log('owner');
            if (((this.status & 0x40) && (this.status & 0x8)) || (!(this.status & 0x40) && !(this.status & 0x8))) {
                //console.log('your turn');
                if (this.status & 0x4) {
                    if (this.data.beingMove.X == X && this.data.beingMove.Y == Y) {
                        this.status &= ~0x4;
                        this.data.beingMove = {};
                        this.data.legalMoves = [];
                        this.message = "OK";
                    }
                    else {
                        let found = 0;
                        for (let i = 0; i < this.data.legalMoves.length; i++) {
                            lm = this.data.legalMoves[i];
                            if (lm.X == X && lm.Y == Y) {
                                found = 1;
                                this.data.cellPieces[X][Y] = this.data.cellPieces[this.data.beingMove.X][this.data.beingMove.Y];
                                this.data.cellPieces[this.data.beingMove.X][this.data.beingMove.Y] = null;
                                this.data.beingMove = {};
                                this.data.legalMoves = [];
                                this.status &= ~0x4;
                                this.status ^= 0x8;
                                this.message = "OK";
                                break;
                            }

                        }
                        if (found == 0) {
                            this.message = "This move is not allowed";
                        }
                    }
                }
                else {
                    let playerColor = this.status & 0x40 ? "White" : "Black";
                    if (this.data && this.data.cellPieces && this.data.cellPieces[X] && this.data.cellPieces[X][Y]) {
                        if (this.data.cellPieces[X][Y].color == playerColor) {
                            this.status |= 0x4;
                            this.data.beingMove = { X, Y };
                            this.setLegalMoves(this.data.beingMove, this.data.cellPieces[X][Y]);
                            this.message = "OK";
                        }
                        else {
                            this.message = "Opponent piece";
                        }
                    }
                    else {
                        this.message = "No piece";
                    }
                }
            }
            else {
                this.message = "It is not your turn!"
            }
        }
        else if (playerId == opponent) {
            this.message = "opp";
        }
        else {
            this.message = "Only players are allowed to play";
        }
    }

    this.checkForLand = function (landPoint, piece, hitStatus = 'can') {//hitStatus: can, must, no
        if (landPoint.X < 0 || landPoint.X >= 8 || landPoint.Y < 0 || landPoint.Y >= 8)
            return false;
        //console.log(landPoint);
        if (this.data.cellPieces[landPoint.X][landPoint.Y]) {
            if (this.data.cellPieces[landPoint.X][landPoint.Y].color != piece.color && hitStatus != 'no') {
                this.data.legalMoves.push(landPoint);
                return piece.type == 'Knight';
            }
            else {
                return piece.type == 'Knight';
            }
        }
        else if (hitStatus != 'must') {
            //console.log(landPoint);
            this.data.legalMoves.push(landPoint);
            return piece.type != 'King';
        }
        else
            return false;
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
                if (!this.checkForLand({ X: startPoint.X + i, Y: startPoint.Y + i }, piece))
                    break;
            }
            for (let i = 1; i < 8; i++) {
                if (!this.checkForLand({ X: startPoint.X + i, Y: startPoint.Y - i }, piece))
                    break;
            }
            for (let i = 1; i < 8; i++) {
                if (!this.checkForLand({ X: startPoint.X - i, Y: startPoint.Y + i }, piece))
                    break;
            }
            for (let i = 1; i < 8; i++) {
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

                    this.checkForLand({ X: startPoint.X + i, Y: startPoint.Y + i }, piece);
                }
            }
        }

        if (piece.type == "Pawn") {
            if (piece.color == "White") {
                if (this.checkForLand({ X: startPoint.X - 1, Y: startPoint.Y }, piece, 'no') && startPoint.X == 6)
                    this.checkForLand({ X: startPoint.X - 2, Y: startPoint.Y }, piece, 'no');
                this.checkForLand({ X: startPoint.X - 1, Y: startPoint.Y - 1 }, piece, 'must');
                this.checkForLand({ X: startPoint.X - 1, Y: startPoint.Y + 1 }, piece, 'must');
            }
            else {
                if (this.checkForLand({ X: startPoint.X + 1, Y: startPoint.Y }, piece, 'no') && startPoint.X == 1)
                    this.checkForLand({ X: startPoint.X + 2, Y: startPoint.Y }, piece, 'no');
                this.checkForLand({ X: startPoint.X + 1, Y: startPoint.Y - 1 }, piece, 'must');
                this.checkForLand({ X: startPoint.X + 1, Y: startPoint.Y + 1 }, piece, 'must');
            }
        }
    }
}