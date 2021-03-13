function chessBoard(boardName) {
    this.pieces = [
        { shortName: "R", FullName: "Rook" },
        { shortName: "B", FullName: "Bishop" },
        { shortName: "N", FullName: "Knight" },
        { shortName: "P", FullName: "Pawn" },
        { shortName: "K", FullName: "King" },
        { shortName: "Q", FullName: "Queen" }
    ];

    this.cellPieces = new Array(8);
    this.cellBorders = new Array(8);
    for (let i = 0; i < 8; i++) {
        this.cellPieces[i] = new Array(8);
        this.cellBorders[i] = new Array(8);
    }
    this.getCellClass = (i, j) => {
        let _class = "";
        _class = (i % 2 == 0 && j % 2 == 0) || (i % 2 == 1 && j % 2 == 1) ? 'WhiteCell NormalCell' : 'BlackCell NormalCell';
        if (this.cellBorders[i][j]) {
            _class += ' ' + this.cellBorders[i][j];
        }
        return _class;
    }

    this.cellClick = (event) => {
        let id = event.target.id;
        let pos = id.split("_");
        console.log(pos[1] + "," + pos[2]);
    }

    this.getPieceTag = (i, j) => {
        let img;

        if (!(this.cellPieces[i][j]))
            return "";
        let cp = this.cellPieces[i][j];
        this.pieces.forEach(function (p) {
            if (p.shortName == cp.charAt(0)) {
                img = p.FullName;
            }
        });
        img += cp.charAt(1) == 'B' ? '_Black' : '_White';
        img += ".png";
        return `<img height="90px" src='img/${img}' id='Img_${i}_${j}'>`;
    }

    let self = this;
    setInterval(function (chess) {
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (self.cellBorders[i][j]) {
                    if (self.cellBorders[i][j] == "BeingMove") {
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
    }, 100);

    this.showChess = () => {
        let chess = "";
        chess += "<tr><td></td><td align='center'>a</td><td align='center'>b</td><td align='center'>c</td><td align='center'>d</td><td align='center'>e</td><td align='center'>f</td><td align='center'>g</td><td align='center'>h</td><td></td></tr>";
        for (let i = 0; i < 8; i++) {
            chess += `<tr><td width='10px'>${8 - i}</td>`;
            for (let j = 0; j < 8; j++) {
                chess += `<td widht="100px" height="100px" id='Cell_${i}_${j}' onclick=cellClick(event) class="${this.getCellClass(i, j)}">${this.getPieceTag(i, j)}</td>`;
            }
            chess += `<td width='10px'>${8 - i}</td></tr>`;
        }
        chess += "<tr><td></td><td align='center'>a</td><td align='center'>b</td><td align='center'>c</td><td align='center'>d</td><td align='center'>e</td><td align='center'>f</td><td align='center'>g</td><td align='center'>h</td><td></td></tr>";
        let chessTable = document.getElementById(boardName);
        chessTable.innerHTML = chess;
    }
}
