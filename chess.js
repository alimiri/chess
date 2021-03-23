let boards = [];

setInterval(function () {
    let active;
    let s = Date.now();
    s = Math.floor(s / 60);//each 60 seconds
    if (s % 2 == 0) {
        active = true;
    }
    else {
        active = false;
    }
    boards.forEach(function (b) {
        let board = b.board;
        if (!board.data)
            return;

        board.send("Refresh", [board.data.lastUpdate], function (data) {
            if (data.message == "OK") {
                board.data = data.data;
                board.showChess();
            }
            else {
                //board.errorMessage = data.message;
            }
        });

        if (!board.data.beingMove || !board.data.beingMove.X)
            return;
        let cellName = `${b.name}_Cell_${board.data.beingMove.X}_${board.data.beingMove.Y}`;
        let cell = document.getElementById(cellName);
        if (active) {
            cell.classList.add('BeingMove');
        }
        else {
            cell.classList.remove('BeingMove');
        }
    });

}, 100);

function chessBoard(boardName) {
    boards.push({ name: boardName, board: this });

    this.data = {};
    this.id = "";
    this.gameId;
    this.errorMessage = "";

    this.getCellClass = (i, j) => {
        let _class = "";
        _class = (i % 2 == 0 && j % 2 == 0) || (i % 2 == 1 && j % 2 == 1) ? 'WhiteCell NormalCell' : 'BlackCell NormalCell';
        if (this.data) {
            if (this.data.legalMoves) {
                this.data.legalMoves.forEach(function (lm) {
                    if (lm.X == i && lm.Y == j) {
                        _class += ' LegalMove';
                    }
                });
            }
        }
        return _class;
    }

    this.send = (message, params, callback) => {
        messageBox = {};
        messageBox.id = this.id;
        messageBox.message = message;
        messageBox.parameters = params
        messageBox.gameId = this.gameId;
        let xhr = new XMLHttpRequest();
        let url = "http://127.0.0.1:3000";
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
        let data = JSON.stringify(messageBox);
        xhr.send(data);
    }

    cellClick = (event, boardName) => {
        let id = event.target.id;
        let pos = id.split("_");
        let board;
        boards.forEach(function (b) { if (b.name == boardName) board = b.board; });
        board.send("Click", [parseInt(pos[2]), parseInt(pos[3])], function (data) {
            if (data.message == "OK") {
                board.data = data.data;
                board.showChess();
            }
            else {
                board.errorMessage = data.message;
            }
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
            board.gameId = data.gameId;
            board.errorMessage = data.message;
            board.data = data.data;
            board.showChess();
        });
    }

    connectToGame = function (boardNamr, gameId) {
        //e.preventDefault();
        let board;
        boards.forEach(function (b) { if (b.name == boardName) board = b.board; });
        board.send("connect", [gameId, board.id], function (data) {
            board.gameId = data.gameId;
            board.errorMessage = data.message;
            board.data = data.data;
            board.showChess();
        });
        return false;
    }

    createContextMenu = function (event, boardName, list) {
        let nav = document.createElement('nav');
        nav.setAttribute('id', 'context-menu');
        nav.classList.add('context-menu');
        nav.classList.add('context-menu--active');
        let ul = document.createElement('ul');
        ul.classList.add('context-menu__items')
        list.forEach(function (l) {
            let li = document.createElement('li');
            li.classList.add('context-menu__item');
            let a = document.createElement('a');
            a.classList.add('context-menu__link');
            a.innerText = l.owner;
            a.setAttribute('href', `javascript:connectToGame('${boardName}','${l.gameId}');`);
            li.appendChild(a);
            ul.appendChild(li);
        });
        nav.appendChild(ul);
        document.body.appendChild(nav);

        let clickCoords = getPosition(event);
        let clickCoordsX = clickCoords.x;
        let clickCoordsY = clickCoords.y;

        menuWidth = nav.offsetWidth + 4;
        menuHeight = nav.offsetHeight + 4;

        windowWidth = window.innerWidth;
        windowHeight = window.innerHeight;

        if ((windowWidth - clickCoordsX) < menuWidth) {
            nav.style.left = windowWidth - menuWidth + "px";
        } else {
            nav.style.left = clickCoordsX + "px";
        }

        if ((windowHeight - clickCoordsY) < menuHeight) {
            nav.style.top = windowHeight - menuHeight + "px";
        }
        else {
            nav.style.top = clickCoordsY + "px";
        }
    }

    getCurrentGames = (event, boardName) => {
        let board;
        boards.forEach(function (b) { if (b.name == boardName) board = b.board; });
        if (!board.id) {
            return;
        }
        board.send("getCurrentGames", [], function (data) {
            if (data.data.length) {
                createContextMenu(event, boardName, data.data);
            }
        });
    }
    this.getPieceTag = (i, j) => {
        let cp;
        try {
            cp = this.data.cellPieces[i][j];
        }
        catch (err) {
            return "";
        }
        if (!cp)
            return "";

        let img = cp.type + '_' + cp.color + '.png';
        return `<img height="50px" src='img/${img}' id='${boardName}_Img_${i}_${j}'>`;
    }

    this.showChess = () => {
        let self = this;
        let chess = "";
        chess += "<tr><td></td><td align='center'>a</td><td align='center'>b</td><td align='center'>c</td><td align='center'>d</td><td align='center'>e</td><td align='center'>f</td><td align='center'>g</td><td align='center'>h</td><td></td></tr>";
        for (let i = 0; i < 8; i++) {
            chess += `<tr><td width='10px'>${8 - i}</td>`;
            for (let j = 0; j < 8; j++) {
                chess += `<td widht="50px" height="50px" id='${boardName}_Cell_${i}_${j}' onclick=cellClick(event\,'${boardName}') class="${this.getCellClass(i, j)}">${this.getPieceTag(i, j)}</td>`;
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
        chess += '<form action="" name="getCurrentGamesForm" enctype="text/plain"><input type="button" value="Current Games" onclick="getCurrentGames(event,\'' + boardName + '\')" /></form>';
        chess += '</td ></tr ></table > ';
        chessTable.innerHTML = chess;
    }
}
