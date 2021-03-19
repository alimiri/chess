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
    console.log(req.body);
    let data = processRequest(req.body);
    if (data) {
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
    else
        return null;
}

let server = new serverBoard();

app.listen(port, () => {
    console.log(`server is listening on port ${port}.`);
});

function serverBoard(owner) {
    this.data = {};
    this.data.owner = owner;
    this.data.opponent = "";
    this.data.viewers = [];

    this.data.cellPieces = new Array(8);
    this.data.cellBorders = new Array(8);
    for (let i = 0; i < 8; i++) {
        this.data.cellPieces[i] = new Array(8);
        this.data.cellBorders[i] = new Array(8);
    }

    this.data.cellPieces[0] = ["RB", "NB", "BB", "QB", "KB", "BB", "NB", "RB"];
    this.data.cellPieces[1] = ["PB", "PB", "PB", "PB", "PB", "PB", "PB", "PB"];
    this.data.cellPieces[6] = ["PW", "PW", "PW", "PW", "PW", "PW", "PW", "PW"];
    this.data.cellPieces[7] = ["RW", "NW", "BW", "QW", "KW", "BW", "NW", "RW"];

    this.thisTurn = "W";
    this.WhitePlayer = owner;
    this.BlackPlayer = "";

    //    this.data.cellBorders[6][4] = "BeingMove";
    //    this.data.cellBorders[5][4] = "LegalMove";
    //    this.data.cellBorders[4][4] = "LegalMove";
}
