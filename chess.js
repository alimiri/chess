let boards = [];

function chessBoard(boardName) {
    boards.push({ name: boardName, board: this });
    this.pieces = [
        { shortName: "R", FullName: "Rook" },
        { shortName: "B", FullName: "Bishop" },
        { shortName: "N", FullName: "Knight" },
        { shortName: "P", FullName: "Pawn" },
        { shortName: "K", FullName: "King" },
        { shortName: "Q", FullName: "Queen" }
    ];

    data = {};
    this.id = "";
    this.errorMessage = "";
    this.getCellClass = (i, j) => {
        let _class = "";
        _class = (i % 2 == 0 && j % 2 == 0) || (i % 2 == 1 && j % 2 == 1) ? 'WhiteCell NormalCell' : 'BlackCell NormalCell';
        if (this.data && this.data.cellBorders[i][j]) {
            _class += ' ' + this.data.cellBorders[i][j];
        }
        return _class;
    }

    this.send = (message, params, callback) => {
        messageBox = {};
        messageBox.id = this.id;
        messageBox.message = message;
        messageBox.parameters = params;
        var xhr = new XMLHttpRequest();
        var url = "http://127.0.0.1:3000";
        xhr.open("POST", url, true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
                if (xhr.responseText) {
                    var json = JSON.parse(xhr.responseText);
                    if (callback)
                        callback(json);
                }
            }
        };
        var data = JSON.stringify(messageBox);
        xhr.send(data);
    }

    this.cellClick = (event) => {
        let id = event.target.id;
        let pos = id.split("_");

        send("Click", [pos[1], pos[2]], function (data) {
            self.data = data;
            self.showChess();
        });
    }

    register = (boardName) => {
        let email = document.forms["registerForm" + boardName]["email"].value;
        let board;
        boards.forEach(function (b) { if (b.name == boardName) board = b.board; });
        board.send("register", [email], function (data) {
            let board;
            boards.forEach(function (b) { if (b.name == boardName) board = b.board; });
            if (data.message == "OK") {
                board.id = email;
                board.errorMessage = "";
            }
            else {
                board.errorMessage = data.message;
            }
            board.showChess();
        });
    }

    newGame = (boardName) => {
        let board;
        boards.forEach(function (b) { if (b.name == boardName) board = b.board; });
        board.send("newGame", [], function (data) {
            board.errorMessage = data.message;
            board.data = data.data;
            board.showChess();
        });
    }

    this.getPieceTag = (i, j) => {
        let img;
        let cp;
        try {
            cp = this.data.cellPieces[i][j];
        }
        catch (err) {
            return "";
        }
        if (!cp)
            return "";

        this.pieces.forEach(function (p) {
            if (p.shortName == cp.charAt(0)) {
                img = p.FullName;
            }
        });
        img += cp.charAt(1) == 'B' ? '_Black' : '_White';
        img += ".png";
        return `<img height="50px" src='img/${img}' id='Img_${i}_${j}'>`;
    }

    this.Blink = function () {
        if (!this.data || !data.cellBorders)
            return;
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (this.data.cellBorders[i][j]) {
                    if (this.data.cellBorders[i][j] == "BeingMove") {
                        let s = Date.now();
                        s = Math.floor(s / 60);//each 30 seconds
                        let cell = document.getElementById(`Cell_${i}_${j}`);
                        if (s % 2 == 0) {
                            cell.classList.add('BeingMove');
                        }
                        else {
                            cell.classList.remove('BeingMove');
                        }
                    }
                }
            }
        }
    }

    setInterval(this.Blink, 100);

    this.showChess = () => {
        let self = this;
        let chess = "";
        chess += "<tr><td></td><td align='center'>a</td><td align='center'>b</td><td align='center'>c</td><td align='center'>d</td><td align='center'>e</td><td align='center'>f</td><td align='center'>g</td><td align='center'>h</td><td></td></tr>";
        for (let i = 0; i < 8; i++) {
            chess += `<tr><td width='10px'>${8 - i}</td>`;
            for (let j = 0; j < 8; j++) {
                chess += `<td widht="50px" height="50px" id='Cell_${i}_${j}' onclick=cellClick(event) class="${this.getCellClass(i, j)}">${this.getPieceTag(i, j)}</td>`;
            }
            chess += `<td width='10px'>${8 - i}</td></tr>`;
        }
        chess += "<tr><td></td><td align='center'>a</td><td align='center'>b</td><td align='center'>c</td><td align='center'>d</td><td align='center'>e</td><td align='center'>f</td><td align='center'>g</td><td align='center'>h</td><td></td></tr>";
        let chessTable = document.getElementById(boardName);

        chess = '<table width="100%"><tr><td width="70%"><table width="100%" align="center" cellpadding="0" cellspacing="0">' + chess + '</table>';
        chess += '</td><td width="30%" valign="top" align="left" style="font-size:larger;">';
        chess += `<span style="color: red;">${this.errorMessage}</span><br/><br/>`;
        chess += `ID: ${this.id}<br/><br/>`;
        chess += `Game Owner: ${this.data && this.data.owner ? this.data.owner : ""}<br/><br/>`;
        chess += `Game Opponent: ${this.data && this.data.opponent ? this.data.opponent : ""}<br/><br/>`;
        chess += '<form action="" name="registerForm' + boardName + '" enctype="text/plain"><label for="email">email:</label><input type="text" name="email" value="" placeholder="Please enter your email" /><br /><input type="button" value="Register" onclick="register(\'' + boardName + '\')" /></form>';
        chess += '<form action="" name="newGameForm" enctype="text/plain"><input type="button" value="New Game" onclick="newGame(\'' + boardName + '\')" /></form>';
        chess += '</td ></tr ></table > ';
        chessTable.innerHTML = chess;
    }
}
