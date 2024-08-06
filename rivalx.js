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
            _this.wildsPossibleMoves = [];
            _this.remainingTokensCounter = [];
            console.log('rivalx constructor');
            return _this;
        }
        RivalX.prototype.setup = function (gamedatas) {
            console.log("Starting game setup");
            for (var player_id in gamedatas.players) {
                var player = gamedatas.players[player_id];
                if (player === undefined) {
                    throw new Error("Player is undefined on setup");
                }
                var player_board_div = $('player_board_' + player_id);
                if (player_board_div === null) {
                    throw new Error("when trying to get player board it was null");
                }
                dojo.place(this.format_block('jstpl_player_board', { id: player.id, color: player.color }), player_board_div);
                var counter = new ebg.counter();
                counter.create('remainingTokens_' + player_id);
                console.log(gamedatas.tokensLeft);
                var tokensLeft = gamedatas.tokensLeft[parseInt(player_id)];
                if (tokensLeft === undefined) {
                    console.log("tokensLeft is undefined, player id is: ");
                    console.log(player_id);
                    throw new Error();
                }
                counter.setValue(parseInt(tokensLeft));
                this.remainingTokensCounter[player_id] = counter;
            }
            for (var i in gamedatas.board) {
                var square = gamedatas.board[i];
                if (square !== undefined && square.player != -1) {
                    this.addTokenOnBoard(square.x, square.y, square.player, square.selectable == 1, square.lastPlayed == 1);
                }
                if (square !== undefined && square.player_tile != -1) {
                    console.log("square is " + square + " square.player_tile is " + square.player_tile);
                    this.addTileOnBoard(square.x, square.y, square.player_tile);
                }
            }
            dojo.query('.square').connect('onclick', this, 'onplaceToken');
            this.setupNotifications();
            console.log("Ending game setup");
        };
        RivalX.prototype.onEnteringState = function (stateName, args) {
            console.log('Entering state: ' + stateName);
            switch (stateName) {
                case 'wildPlacement':
                    this.updatePossibleMoves(args.args.possibleMoves);
                    break;
                case 'playerTurn':
                    this.clearSelectable();
                    this.clearPatterns();
                    this.updatePossibleMoves(args.args.possibleMoves);
                    break;
                case 'repositionWilds':
                    this.wildsPossibleMoves = args.args.possibleMoves;
                    this.updatePossibleMoves([]);
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
                    case 'repositionWilds':
                        this.addActionButton('finishTurn_button', _('Finish Turn'), 'onfinishTurn');
                }
            }
        };
        RivalX.prototype.clearPatterns = function () {
            document.querySelectorAll('.pattern').forEach(function (element) {
                dojo.destroy(element);
            });
        };
        RivalX.prototype.clearSelectedToken = function () {
            document.querySelectorAll('.selected').forEach(function (element) {
                element.classList.remove('selected');
            });
        };
        RivalX.prototype.clearSelectable = function () {
            document.querySelectorAll('.selectable').forEach(function (element) {
                dojo.destroy(element);
            });
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
        RivalX.prototype.addTokenOnBoard = function (x, y, player_id, selectable, lastPlayed) {
            var _a, _b, _c;
            if (this.isWild(player_id)) {
                dojo.place(this.format_block('jstpl_token', {
                    color: 0,
                    x_y: "".concat(x, "_").concat(y)
                }), 'board');
                (_a = $("token_".concat(x, "_").concat(y))) === null || _a === void 0 ? void 0 : _a.classList.add("wild_".concat(player_id));
                if (lastPlayed) {
                    document.querySelectorAll('.tokencolor_0').forEach(function (element) {
                        element.classList.remove('lastPlayed');
                    });
                    (_b = $("token_".concat(x, "_").concat(y))) === null || _b === void 0 ? void 0 : _b.classList.add('lastPlayed');
                }
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
                if (lastPlayed) {
                    document.querySelectorAll(".tokencolor_".concat(player.color)).forEach(function (element) {
                        element.classList.remove('lastPlayed');
                    });
                    (_c = $("token_".concat(x, "_").concat(y))) === null || _c === void 0 ? void 0 : _c.classList.add('lastPlayed');
                }
            }
            dojo.connect($("token_".concat(x, "_").concat(y)), 'onclick', this, 'onselectToken');
            if (selectable) {
                var selectable_token = $("token_".concat(x, "_").concat(y));
                if (selectable_token === null) {
                    throw new Error("when trying to get selectable token it was null");
                }
                dojo.place("<div class='selectable'></div>", selectable_token);
            }
            if (!this.isWild(player_id)) {
                this.placeOnObject("token_".concat(x, "_").concat(y), "overall_player_board_".concat(player_id));
                this.slideToObject("token_".concat(x, "_").concat(y), "square_".concat(x, "_").concat(y)).play();
            }
            else {
                this.placeOnObject("token_".concat(x, "_").concat(y), "square_".concat(x, "_").concat(y));
            }
        };
        RivalX.prototype.addTileOnBoard = function (x, y, player_id) {
            var player = this.gamedatas.players[player_id];
            if (!player) {
                throw new Error('Unknown player id: ' + player_id);
            }
            dojo.place(this.format_block('jstpl_scoretile', {
                color: player.color,
                x_y: "".concat(x, "_").concat(y)
            }), "square_".concat(x, "_").concat(y));
            this.placeOnObject("scoretile_".concat(x, "_").concat(y), "overall_player_board_".concat(player_id));
            this.slideToObject("scoretile_".concat(x, "_").concat(y), "square_".concat(x, "_").concat(y)).play();
        };
        RivalX.prototype.addPatternOnBoard = function (pattern, x, y, player_id) {
            console.log("Adding pattern at position (".concat(x, ", ").concat(y, "):"), pattern);
            var player = this.gamedatas.players[parseInt(player_id)];
            if (!player) {
                throw new Error('Unknown player id: ' + player_id);
            }
            var patternType = pattern.substring(0, 3);
            var x_pos = x;
            var y_pos = y;
            switch (patternType) {
                case ('row'):
                    switch (pattern.substring(4)) {
                        case ('1'):
                            x_pos += 2;
                            break;
                        case ('2'):
                            x_pos += 1;
                            break;
                        case ('3'):
                            x_pos += 0;
                            break;
                        case ('4'):
                            x_pos += -1;
                            break;
                        case ('5'):
                            x_pos += -2;
                            break;
                        default:
                            console.log("row pattern code does not match");
                            return;
                    }
                    break;
                case ('col'):
                    switch (pattern.substring(4)) {
                        case ('1'):
                            y_pos += 2;
                            break;
                        case ('2'):
                            y_pos += 1;
                            break;
                        case ('3'):
                            y_pos += 0;
                            break;
                        case ('4'):
                            y_pos += -1;
                            break;
                        case ('5'):
                            y_pos += -2;
                            break;
                        default:
                            console.log("col pattern code does not match");
                            return;
                    }
                    break;
                case ('nwd'):
                    switch (pattern.substring(4)) {
                        case ('1'):
                            x_pos += 2;
                            y_pos += 2;
                            break;
                        case ('2'):
                            x_pos += 1;
                            y_pos += 1;
                            break;
                        case ('3'):
                            x_pos += 0;
                            y_pos += 0;
                            break;
                        case ('4'):
                            x_pos += -1;
                            y_pos += -1;
                            break;
                        case ('5'):
                            x_pos += -2;
                            y_pos += -2;
                            break;
                        default:
                            console.log("nwd pattern code does not match");
                            return;
                    }
                    break;
                case ('ned'):
                    switch (pattern.substring(4)) {
                        case ('1'):
                            x_pos += -2;
                            y_pos += 2;
                            break;
                        case ('2'):
                            x_pos += -1;
                            y_pos += 1;
                            break;
                        case ('3'):
                            x_pos += 0;
                            y_pos += 0;
                            break;
                        case ('4'):
                            x_pos += 1;
                            y_pos += -1;
                            break;
                        case ('5'):
                            x_pos += 2;
                            y_pos += -2;
                            break;
                        default:
                            console.log("ned pattern code does not match");
                            return;
                    }
                    break;
                case ('pls'):
                    switch (pattern.substring(4)) {
                        case ('W'):
                            x_pos += 1;
                            y_pos += 0;
                            break;
                        case ('N'):
                            x_pos += 0;
                            y_pos += 1;
                            break;
                        case ('C'):
                            x_pos += 0;
                            y_pos += 0;
                            break;
                        case ('E'):
                            x_pos += -1;
                            y_pos += 0;
                            break;
                        case ('S'):
                            x_pos += 0;
                            y_pos += -1;
                            break;
                        default:
                            console.log("pls pattern code does not match");
                            return;
                    }
                    break;
                case ('crs'):
                    switch (pattern.substring(4)) {
                        case ('NW'):
                            x_pos += 1;
                            y_pos += 1;
                            break;
                        case ('NE'):
                            x_pos += -1;
                            y_pos += 1;
                            break;
                        case ('C'):
                            x_pos += 0;
                            y_pos += 0;
                            break;
                        case ('SE'):
                            x_pos += -1;
                            y_pos += -1;
                            break;
                        case ('SW'):
                            x_pos += 1;
                            y_pos += -1;
                            break;
                        default:
                            console.log("crs pattern code does not match");
                            return;
                    }
                    break;
                default:
                    console.log("pattern code does not match");
                    return;
            }
            dojo.place(this.format_block('jstpl_pattern', {
                color: player.color,
                x_y: "".concat(x_pos, "_").concat(y_pos),
                type: patternType
            }), "board");
            var patternElement = $("pattern_".concat(x_pos, "_").concat(y_pos, "_").concat(patternType));
            this.placeOnObject(patternElement, "square_".concat(x_pos, "_").concat(y_pos));
            patternElement.classList.add('flash');
            setTimeout(function () {
                patternElement.classList.remove('flash');
                patternElement.classList.add('fade-out');
            }, 3000);
        };
        RivalX.prototype.isWild = function (id) {
            return (id >= 1 && id <= RivalX.MAX_WILDS);
        };
        RivalX.prototype.onplaceToken = function (evt) {
            evt.preventDefault();
            if (!(evt.currentTarget instanceof HTMLElement))
                throw new Error('evt.currentTarget is null! Make sure that this function is being connected to a DOM HTMLElement.');
            var _a = evt.currentTarget.id.split('_'), _square_ = _a[0], x = _a[1], y = _a[2];
            var token = $("token_".concat(x, "_").concat(y));
            if (token !== null) {
                this.onselectToken(evt);
                return;
            }
            var square = $("square_".concat(x, "_").concat(y));
            if (square === null) {
                throw new Error('square is null! Make sure that this function is being connected to a DOM HTMLElement.');
            }
            if (this.checkAction('placeToken', true)) {
                this.ajaxcall("/".concat(this.game_name, "/").concat(this.game_name, "/placeToken.html"), {
                    x: x,
                    y: y,
                    lock: true
                }, this, function () { });
            }
            else if (this.checkAction('moveWild', true)) {
                var selected = document.querySelector('.selected');
                if (selected !== null) {
                    if (square.classList.contains('possibleMove')) {
                        var _b = selected.closest('[id]').id.split('_'), _square_1 = _b[0], old_x = _b[1], old_y = _b[2];
                        this.ajaxcall("/".concat(this.game_name, "/").concat(this.game_name, "/moveWild.html"), {
                            old_x: old_x, old_y: old_y, new_x: x, new_y: y, lock: true
                        }, this, function () { });
                    }
                    else {
                        this.showMessage("Cannot place a wild here, " +
                            "when moving wilds after completing a pattern they cannot complete another pattern unless it is a pattern of 5 wilds", "error");
                    }
                }
                else {
                    this.showMessage("You must first select a wild to move it", "error");
                }
            }
            else if (this.checkAction('placeWild')) {
                if (square.classList.contains('possibleMove')) {
                    this.ajaxcall("/".concat(this.game_name, "/").concat(this.game_name, "/placeWild.html"), {
                        x: x,
                        y: y,
                        lock: true
                    }, this, function () { });
                }
                else {
                    this.showMessage("Cannot place a wild here, when initially placing wilds they cannot be adjacent to other wilds", "error");
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
                if (token.querySelector('.selectable') !== null) {
                    var selected = token.querySelector('.selected');
                    if (selected !== null) {
                        selected.classList.remove('selected');
                    }
                    else {
                        this.clearSelectedToken();
                        token.querySelector('.selectable').classList.add('selected');
                        console.log(this.wildsPossibleMoves);
                        for (var wild_id in this.wildsPossibleMoves) {
                            console.log(wild_id);
                            if (token.classList.contains("wild_".concat(wild_id))) {
                                var possibleMoves = this.wildsPossibleMoves[wild_id];
                                if (possibleMoves === undefined) {
                                    throw new Error("when trying to get possible moves index was undefined");
                                }
                                this.updatePossibleMoves(possibleMoves);
                                break;
                            }
                        }
                    }
                }
                else {
                    this.showMessage("This token is not selectable, only wilds used in the pattern are movable", "error");
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
            dojo.subscribe('moveWild', this, "notif_moveWild");
            this.notifqueue.setSynchronous('moveWild', 300);
            dojo.subscribe('scorePattern', this, "notif_scorePattern");
            this.notifqueue.setSynchronous('scorePattern', 500);
        };
        RivalX.prototype.notif_playToken = function (notif) {
            this.addTokenOnBoard(notif.args.x, notif.args.y, notif.args.player_id, false, true);
            var id = notif.args.player_id;
            if (id > RivalX.MAX_WILDS && id !== undefined) {
                var tokenCounter = this.remainingTokensCounter[id];
                tokenCounter.incValue(-1);
            }
        };
        RivalX.prototype.notif_newScores = function (notif) {
            for (var player_id in notif.args.scores) {
                var counter = this.scoreCtrl[player_id];
                var newScore = notif.args.scores[player_id];
                if (counter && newScore)
                    counter.toValue(newScore);
            }
        };
        RivalX.prototype.notif_moveWild = function (notif) {
            console.log(notif.args);
            this.slideToObject("token_".concat(notif.args.old_x, "_").concat(notif.args.old_y), "square_".concat(notif.args.new_x, "_").concat(notif.args.new_y)).play();
            var token = $("token_".concat(notif.args.old_x, "_").concat(notif.args.old_y));
            if (token === null) {
                throw new Error("When moving a wild somehow a token reference became null");
            }
            token.id = "token_".concat(notif.args.new_x, "_").concat(notif.args.new_y);
            dojo.empty(token);
        };
        RivalX.prototype.notif_scorePattern = function (notif) {
            var _this = this;
            console.log('notif_scorePattern has been called');
            console.log(notif.args);
            console.log(notif.args.patternsToDisplay);
            notif.args.patternsToDisplay.patterns.forEach(function (pattern) {
                _this.addPatternOnBoard(pattern, notif.args.patternsToDisplay.x, notif.args.patternsToDisplay.y, notif.args.patternsToDisplay.player_id);
            });
            console.log("args in notif_removeTokens:");
            console.log(notif.args);
            notif.args.tokensToRemove.forEach(function (token_pos) {
                var token = $("token_".concat(token_pos.x, "_").concat(token_pos.y));
                if (token === null) {
                    throw new Error("Error: token does not exist in notif_removeTokens");
                }
                dojo.destroy(token);
                _this.remainingTokensCounter[parseInt(token_pos.player_id)].incValue(1);
            });
            notif.args.tokensToRemove.forEach(function (scoretile_pos) {
                var scoretile = $("scoretile_".concat(scoretile_pos.x, "_").concat(scoretile_pos.y));
                if (scoretile !== null) {
                    scoretile.classList.add('toDestroy');
                    scoretile.id += '_toDestroy';
                }
                _this.addTileOnBoard(scoretile_pos.x, scoretile_pos.y, parseInt(scoretile_pos.player_id));
            });
            document.querySelectorAll('.toDestroy').forEach(function (element) {
                dojo.destroy(element);
            });
            notif.args.selectableTokens.forEach(function (token_pos) {
                var token = $("token_".concat(token_pos.x, "_").concat(token_pos.y));
                if (token === null) {
                    throw new Error("When trying to mark selectable tokens a token was null");
                }
                dojo.place("<div class='selectable'></div>", token);
            });
        };
        RivalX.MAX_WILDS = 5;
        return RivalX;
    }(Gamegui));
    dojo.setObject("bgagame.rivalx", RivalX);
});
