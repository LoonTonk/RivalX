var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
define("bgagame/rivalx", ["require", "exports", "ebg/core/gamegui", "ebg/counter"], function (require, exports, Gamegui) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var RivalX = (function (_super) {
        __extends(RivalX, _super);
        function RivalX() {
            var _this = _super.call(this) || this;
            console.log('rivalx constructor');
            return _this;
        }
        RivalX.prototype.setup = function (gamedatas) {
            console.log("Starting game setup");
            for (var i in gamedatas.board) {
                var square = gamedatas.board[i];
                if (square !== undefined && square.player != -1) {
                    this.addTokenOnBoard(square.x, square.y, square.player, square.player == 0, square.selectable == 1);
                }
                if (square !== undefined && square.player_tile != -1) {
                    console.log("square is " + square + " square.player_tile is " + square.player_tile);
                    this.addTileOnBoard(square.x, square.y, square.player_tile);
                }
            }
            dojo.query('.square').connect('onclick', this, 'onplaceToken');
            dojo.query('.token').connect('onclick', this, 'onselectToken');
            for (var i in gamedatas.board) {
                var square = gamedatas.board[i];
                if (square !== undefined && square.player != -1) {
                    this.disconnectSquare(square.x, square.y);
                }
            }
            this.setupNotifications();
            console.log("Ending game setup");
        };
        RivalX.prototype.onEnteringState = function (stateName, args) {
            console.log('Entering state: ' + stateName);
            switch (stateName) {
                case 'wildPlacement':
                    if (document.querySelectorAll('.tokencolor_0').length < 5) {
                        this.updatePossibleMoves(args.args.possibleMoves);
                    }
                    else {
                        this.clearPossibleMoves();
                    }
                    break;
                case 'playerTurn':
                    this.clearSelectable();
                    this.updatePossibleMoves(args.args.possibleMoves);
                    break;
            }
        };
        RivalX.prototype.onLeavingState = function (stateName) {
            console.log('Leaving state: ' + stateName);
        };
        RivalX.prototype.onUpdateActionButtons = function (stateName, args) {
            console.log('onUpdateActionButtons: ' + stateName, args);
            if (this.isCurrentPlayerActive()) {
                switch (stateName) {
                    case 'wildPlacement':
                        if ((args === null || args === void 0 ? void 0 : args.numWildsLeft) !== undefined && args.numWildsLeft <= 0) {
                            this.addActionButton('finishTurn_button', _('Finish Turn'), 'onfinishTurn');
                        }
                        break;
                    case 'changePattern':
                        this.addActionButton('finishTurn_button', _('Finish Turn'), 'onfinishTurn');
                }
            }
        };
        RivalX.prototype.disconnectSquare = function (x, y) {
            var disconnected_square = $("square_".concat(x, "_").concat(y));
            console.log(disconnected_square);
            if (disconnected_square === null) {
                throw new Error("Disconnected square is null");
            }
            this.disconnect(disconnected_square, 'onclick');
        };
        RivalX.prototype.reconnectSquare = function (x, y) {
            var reconnected_square = $("square_".concat(x, "_").concat(y));
            if (reconnected_square === null) {
                throw new Error("reconnected square is null");
            }
            this.connect(reconnected_square, 'onclick', 'onplaceToken');
        };
        RivalX.prototype.clearSelectedToken = function () {
            document.querySelectorAll('.selected').forEach(function (element) {
                element.classList.remove('selected');
            });
        };
        RivalX.prototype.clearSelectable = function () {
            document.querySelectorAll('.selectable').forEach(function (element) {
                element.classList.remove('selectable');
            });
            this.clearSelectedToken();
        };
        RivalX.prototype.clearPossibleMoves = function () {
            document.querySelectorAll('.possibleMove').forEach(function (element) {
                element.classList.remove('possibleMove');
            });
        };
        RivalX.prototype.updatePossibleMoves = function (possibleMoves) {
            this.clearPossibleMoves();
            for (var x in possibleMoves) {
                for (var y in possibleMoves[x]) {
                    var square = $("square_".concat(x, "_").concat(y));
                    if (!square)
                        throw new Error("Unknown square element: ".concat(x, "_").concat(y, ". Make sure the board grid was set up correctly in the tpl file."));
                    square.classList.add('possibleMove');
                }
            }
            this.addTooltipToClass('possibleMove', '', _('Place a token here'));
        };
        RivalX.prototype.addTokenOnBoard = function (x, y, player_id, wild, selectable) {
            var _a;
            if (wild) {
                dojo.place(this.format_block('jstpl_token', {
                    color: 0,
                    x_y: "".concat(x, "_").concat(y)
                }), 'board');
            }
            else {
                var player = this.gamedatas.players[player_id];
                if (!player) {
                    throw new Error('Unknown player id: ' + player_id);
                }
                dojo.place(this.format_block('jstpl_token', {
                    color: player.color,
                    x_y: "".concat(x, "_").concat(y)
                }), 'board');
            }
            dojo.connect($("token_".concat(x, "_").concat(y)), 'onclick', this, 'onselectToken');
            if (selectable) {
                (_a = $("token_".concat(x, "_").concat(y))) === null || _a === void 0 ? void 0 : _a.classList.add('selectable');
            }
            if (player_id != 0) {
                this.placeOnObject("token_".concat(x, "_").concat(y), "overall_player_board_".concat(player_id));
                this.slideToObject("token_".concat(x, "_").concat(y), "square_".concat(x, "_").concat(y)).play();
            }
            else {
                this.placeOnObject("token_".concat(x, "_").concat(y), "square_".concat(x, "_").concat(y));
            }
            this.disconnectSquare(x, y);
        };
        RivalX.prototype.addTileOnBoard = function (x, y, player_id) {
            var player = this.gamedatas.players[player_id];
            if (!player) {
                throw new Error('Unknown player id: ' + player_id);
            }
            dojo.place(this.format_block('jstpl_scoretile', {
                color: player.color,
                x_y: "".concat(x, "_").concat(y)
            }), 'board');
            dojo.connect($("scoretile_".concat(x, "_").concat(y)), 'onclick', this, 'onplaceToken');
            this.placeOnObject("scoretile_".concat(x, "_").concat(y), "overall_player_board_".concat(player_id));
            this.slideToObject("scoretile_".concat(x, "_").concat(y), "square_".concat(x, "_").concat(y)).play();
        };
        RivalX.prototype.onplaceToken = function (evt) {
            console.log("AAAAAAAAAAAAAAA");
            evt.preventDefault();
            if (!(evt.currentTarget instanceof HTMLElement))
                throw new Error('evt.currentTarget is null! Make sure that this function is being connected to a DOM HTMLElement.');
            if (this.checkAction('placeToken', true)) {
                var _a = evt.currentTarget.id.split('_'), _square_ = _a[0], x = _a[1], y = _a[2];
                this.ajaxcall("/".concat(this.game_name, "/").concat(this.game_name, "/placeToken.html"), {
                    x: x,
                    y: y,
                    lock: true
                }, this, function () { });
            }
            else if (this.checkAction('moveWild')) {
                var _b = evt.currentTarget.id.split('_'), _square_ = _b[0], x = _b[1], y = _b[2];
                var token = $("token_".concat(x, "_").concat(y));
                var square = $("square_".concat(x, "_").concat(y));
                if (square === null) {
                    throw new Error('square is null! Make sure that this function is being connected to a DOM HTMLElement.');
                }
                if (token !== null) {
                    if (token.classList.contains('selectable')) {
                        if (token.classList.contains('selected')) {
                            token.classList.remove('selected');
                        }
                        else {
                            this.clearSelectedToken();
                            token.classList.add('selected');
                        }
                    }
                    else {
                        if (this.checkAction('placeWild', true)) {
                            this.showMessage("Cannot place here, there is already a token", "error");
                        }
                        else {
                            this.showMessage("This token is not selectable, only wilds used in the pattern are movable", "error");
                        }
                        return;
                    }
                }
                else {
                    var selected = document.querySelector('.selected');
                    if (selected !== null) {
                        console.log("Moving token");
                        var _c = selected.id.split('_'), _square_1 = _c[0], old_x = _c[1], old_y = _c[2];
                        this.ajaxcall("/".concat(this.game_name, "/").concat(this.game_name, "/moveWild.html"), {
                            old_x: old_x, old_y: old_y, new_x: x, new_y: y, lock: true
                        }, this, function () { });
                    }
                    else {
                        if (this.checkAction('placeWild', true)) {
                            if (document.querySelectorAll('.tokencolor_0').length < 5) {
                                this.ajaxcall("/".concat(this.game_name, "/").concat(this.game_name, "/placeWild.html"), {
                                    x: x,
                                    y: y,
                                    lock: true
                                }, this, function () { });
                            }
                            else {
                                this.showMessage("Cannot place any more wilds, either select and move wilds or finish turn", "error");
                            }
                        }
                        else {
                            this.showMessage("You must first select a wild to move it", "error");
                        }
                    }
                }
            }
        };
        RivalX.prototype.onselectToken = function (evt) {
            evt.preventDefault();
            if (!(evt.currentTarget instanceof HTMLElement))
                throw new Error('evt.currentTarget is null! Make sure that this function is being connected to a DOM HTMLElement.');
            if (this.checkAction('placeToken', true)) {
                this.showMessage("Cannot play here, there is already a token", "error");
                return;
            }
            else if (this.checkAction('moveWild')) {
                var _a = evt.currentTarget.id.split('_'), _square_ = _a[0], x = _a[1], y = _a[2];
                var token = $("token_".concat(x, "_").concat(y));
                if (token === null) {
                    throw new Error("token was selected but was somehow null");
                }
                if (token.classList.contains('selectable')) {
                    if (token.classList.contains('selected')) {
                        token.classList.remove('selected');
                    }
                    else {
                        this.clearSelectedToken();
                        token.classList.add('selected');
                    }
                }
                else {
                    this.showMessage("This token is not selectable", "error");
                }
            }
        };
        RivalX.prototype.onfinishTurn = function (evt) {
            evt.preventDefault();
            if (!(evt.currentTarget instanceof HTMLElement))
                throw new Error('evt.currentTarget is null! Make sure that this function is being connected to a DOM HTMLElement.');
            if (this.checkAction('finishTurn')) {
                this.ajaxcall("/".concat(this.game_name, "/").concat(this.game_name, "/finishTurn.html"), { lock: true }, this, function () { });
            }
        };
        RivalX.prototype.setupNotifications = function () {
            console.log('notifications subscriptions setup');
            dojo.subscribe('playToken', this, "notif_playToken");
            this.notifqueue.setSynchronous('playToken', 300);
            dojo.subscribe('markSelectableTokens', this, "notif_markSelectableTokens");
            this.notifqueue.setSynchronous('markSelectableTokens', 300);
            dojo.subscribe('newScores', this, "notif_newScores");
            this.notifqueue.setSynchronous('newScores', 500);
            dojo.subscribe('removeTokens', this, "notif_removeTokens");
            this.notifqueue.setSynchronous('removeTokens', 300);
            dojo.subscribe('addScoreTiles', this, "notif_addScoreTiles");
            this.notifqueue.setSynchronous('addScoreTiles', 300);
            dojo.subscribe('moveWild', this, "notif_moveWild");
            this.notifqueue.setSynchronous('moveWild', 300);
        };
        RivalX.prototype.notif_playToken = function (notif) {
            this.addTokenOnBoard(notif.args.x, notif.args.y, notif.args.player_id, notif.args.wild, notif.args.selectable == 1);
        };
        RivalX.prototype.notif_markSelectableTokens = function (notif) {
            notif.args.forEach(function (token_pos) {
                var token = $("token_".concat(token_pos.x, "_").concat(token_pos.y));
                token === null || token === void 0 ? void 0 : token.classList.add('selectable');
            });
        };
        RivalX.prototype.notif_newScores = function (notif) {
            for (var player_id in notif.args.scores) {
                var counter = this.scoreCtrl[player_id];
                var newScore = notif.args.scores[player_id];
                if (counter && newScore)
                    counter.toValue(newScore);
            }
        };
        RivalX.prototype.notif_removeTokens = function (notif) {
            notif.args.forEach(function (token_pos) {
                var token = $("token_".concat(token_pos.x, "_").concat(token_pos.y));
                if (token === null) {
                    throw new Error("Error: token does not exist in notif_removeTokens");
                }
                dojo.destroy(token);
            });
        };
        RivalX.prototype.notif_addScoreTiles = function (notif) {
            var _this = this;
            notif.args.forEach(function (scoretile_pos) {
                var scoretile = $("scoretile_".concat(scoretile_pos.x, "_").concat(scoretile_pos.y));
                if (scoretile !== null) {
                    scoretile.classList.add('toDestroy');
                    scoretile.id += '_toDestroy';
                }
                _this.addTileOnBoard(scoretile_pos.x, scoretile_pos.y, scoretile_pos.player_id);
            });
            document.querySelectorAll('.toDestroy').forEach(function (element) {
                dojo.destroy(element);
            });
        };
        RivalX.prototype.notif_moveWild = function (notif) {
            this.slideToObject("token_".concat(notif.args.old_x, "_").concat(notif.args.old_y), "square_".concat(notif.args.new_x, "_").concat(notif.args.new_y)).play();
            var token = $("token_".concat(notif.args.old_x, "_").concat(notif.args.old_y));
            if (token === null) {
                throw new Error("When moving a wild somehow a token reference became null");
            }
            token.id = "token_".concat(notif.args.new_x, "_").concat(notif.args.new_y);
            document.querySelectorAll('.selected').forEach(function (element) {
                element.classList.remove('selected');
            });
            this.disconnectSquare(notif.args.new_x, notif.args.new_y);
            this.reconnectSquare(notif.args.old_x, notif.args.old_y);
        };
        return RivalX;
    }(Gamegui));
    dojo.setObject("bgagame.rivalx", RivalX);
});
