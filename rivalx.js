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
                var tokensLeft = gamedatas.tokensLeft[parseInt(player_id)];
                if (tokensLeft === undefined) {
                    console.log("tokensLeft is undefined, player id is: ");
                    console.log(player_id);
                    throw new Error();
                }
                counter.setValue(parseInt(tokensLeft));
                this.remainingTokensCounter[player_id] = counter;
                if (gamedatas.isTeams) {
                    dojo.place(this.format_block('jstpl_team_icon', { teamNum: gamedatas.playerTeams[parseInt(player_id)] }), player_board_div);
                }
            }
            for (var i in gamedatas.board) {
                var square = gamedatas.board[i];
                if (square !== undefined && square.player != -1) {
                    this.addTokenOnBoard(square.x, square.y, square.player, square.selectable == 1);
                }
                if (square !== undefined && square.player_tile != -1) {
                    this.addTileOnBoard(square.x, square.y, square.player_tile);
                }
                if (square !== undefined && square.lastPlayed > 1) {
                    this.addLastPlayedToBoard(square.x, square.y, square.lastPlayed);
                }
            }
            dojo.query('.square').connect('onclick', this, 'onsquareClick');
            this.setupNotifications();
            console.log("Ending game setup");
        };
        RivalX.prototype.onEnteringState = function (stateName, args) {
            console.log('Entering state: ' + stateName);
            switch (stateName) {
                case 'wildPlacement':
                    this.updatePossibleMoves(args.args.possibleMoves, 'wildPlacement');
                    break;
                case 'playerTurn':
                    this.clearSelectable();
                    this.clearPatterns();
                    this.updatePossibleMoves(args.args.possibleMoves, 'playerTurn');
                    break;
                case 'repositionWilds':
                    this.wildsPossibleMoves = args.args.possibleMoves;
                    this.updatePossibleMoves([], 'repositionWild');
                    break;
            }
        };
        RivalX.prototype.onLeavingState = function (stateName) {
            switch (stateName) {
                case 'wildPlacement':
                    this.clearLastPlayed();
                    break;
            }
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
            var _this = this;
            document.querySelectorAll('.selectable').forEach(function (element) {
                var _a = element.closest('.token').id.split('_'), _token_ = _a[0], x = _a[1], y = _a[2];
                if (x === undefined || y === undefined) {
                    throw new Error("When trying to get x and y from id of selectable token it was undefined");
                }
                _this.removeSelectable(parseInt(x), parseInt(y));
            });
        };
        RivalX.prototype.removeSelectable = function (x, y) {
            dojo.empty("token_".concat(x, "_").concat(y));
            this.addTooltip("token_".concat(x, "_").concat(y), _('This is a Wild X-piece'), '');
        };
        RivalX.prototype.clearPossibleMoves = function () {
            var _this = this;
            document.querySelectorAll('.possibleMove').forEach(function (element) {
                _this.removeTooltip(element.id);
                element.classList.remove('possibleMove');
            });
        };
        RivalX.prototype.clearLastPlayed = function () {
            document.querySelectorAll('.lastPlayed').forEach(function (element) {
                dojo.destroy(element);
            });
        };
        RivalX.prototype.addLastPlayedToBoard = function (x, y, lastPlayed) {
            var color = this.gamedatas.players[lastPlayed].color;
            document.querySelectorAll(".lastPlayedcolor_".concat(color)).forEach(function (element) {
                dojo.destroy(element);
            });
            dojo.place(this.format_block('jstpl_lastPlayed', {
                color: color,
                x_y: "".concat(x, "_").concat(y),
                player_id: lastPlayed
            }), 'board');
            this.placeOnObject("lastPlayed_".concat(x, "_").concat(y, "_").concat(lastPlayed), "square_".concat(x, "_").concat(y));
            var lastPlayedToolTip = dojo.string.substitute(_("${player}'s last move was here"), {
                player: this.gamedatas.players[lastPlayed].name
            });
            this.addTooltip("lastPlayed_".concat(x, "_").concat(y, "_").concat(lastPlayed), lastPlayedToolTip, '');
        };
        RivalX.prototype.addTokenOutline = function (x, y) {
            dojo.place(this.format_block('jstpl_token_outline', {
                x_y: "".concat(x, "_").concat(y),
            }), 'board');
            this.placeOnObject("token_outline_".concat(x, "_").concat(y), "square_".concat(x, "_").concat(y));
        };
        RivalX.prototype.clearTokenOutline = function () {
            document.querySelectorAll('.token_outline').forEach(function (element) {
                dojo.destroy(element);
            });
        };
        RivalX.prototype.markSelectableToken = function (x, y) {
            var selectable_token = $("token_".concat(x, "_").concat(y));
            if (selectable_token === null) {
                throw new Error("when trying to get selectable token it was null");
            }
            dojo.place("<div class='selectable'></div>", selectable_token);
            this.addTooltip("token_".concat(x, "_").concat(y), '', _('Select this wild to reposition it'));
        };
        RivalX.prototype.updatePossibleMoves = function (possibleMoves, gameState) {
            this.clearPossibleMoves();
            for (var x in possibleMoves) {
                for (var y in possibleMoves[x]) {
                    var square = $("square_".concat(x, "_").concat(y));
                    if (!square)
                        throw new Error("Unknown square element: ".concat(x, "_").concat(y, ". Make sure the board grid was set up correctly in the tpl file."));
                    square.classList.add('possibleMove');
                }
            }
            switch (gameState) {
                case ('wildPlacement'):
                    this.addTooltipToClass('possibleMove', '', _('Place a Wild here'));
                    break;
                case ('playerTurn'):
                    this.addTooltipToClass('possibleMove', '', _('Place your X-piece here'));
                    break;
                case ('moveWild'):
                    this.addTooltipToClass('possibleMove', '', _('Move the selected Wild here'));
                    break;
                case ('repositionWild'):
                    break;
                default:
                    throw new Error("when trying to update possible moves it was not in one of the specified states for adding tooltips");
            }
        };
        RivalX.prototype.addTokenOnBoard = function (x, y, player_id, selectable) {
            var _a;
            if (this.isWild(player_id)) {
                dojo.place(this.format_block('jstpl_token', {
                    color: 0,
                    x_y: "".concat(x, "_").concat(y)
                }), 'board');
                (_a = $("token_".concat(x, "_").concat(y))) === null || _a === void 0 ? void 0 : _a.classList.add("wild_".concat(player_id));
                player_id = this.getCurrentPlayerId();
                this.addTooltip("token_".concat(x, "_").concat(y), _('This is a Wild X-piece'), '');
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
                var playerTokenTooltip = dojo.string.substitute(_("This is ${player}'s X-piece"), {
                    player: this.gamedatas.players[player_id].name
                });
                this.addTooltip("token_".concat(x, "_").concat(y), playerTokenTooltip, '');
            }
            dojo.connect($("token_".concat(x, "_").concat(y)), 'onclick', this, 'onselectToken');
            if (selectable) {
                this.markSelectableToken(x, y);
            }
            this.placeOnObject("token_".concat(x, "_").concat(y), "overall_player_board_".concat(player_id));
            this.slideToObject("token_".concat(x, "_").concat(y), "square_".concat(x, "_").concat(y)).play();
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
                        case ('CE'):
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
            }, 2000);
        };
        RivalX.prototype.isWild = function (id) {
            return (id >= 1 && id <= RivalX.MAX_WILDS);
        };
        RivalX.prototype.onsquareClick = function (evt) {
            evt.preventDefault();
            if (!(evt.currentTarget instanceof HTMLElement))
                throw new Error('evt.currentTarget is null! Make sure that this function is being connected to a DOM HTMLElement.');
            var _a = evt.currentTarget.id.split('_'), _square_ = _a[0], x = _a[1], y = _a[2];
            if (x === undefined || y === undefined) {
                throw new Error("x or y was undefined when trying to get coordinates of square clicked on");
            }
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
                this.addTokenOutline(parseInt(x), parseInt(y));
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
                        this.addTokenOutline(parseInt(x), parseInt(y));
                        var _b = selected.closest('[id]').id.split('_'), _square_1 = _b[0], old_x = _b[1], old_y = _b[2];
                        this.ajaxcall("/".concat(this.game_name, "/").concat(this.game_name, "/moveWild.html"), {
                            old_x: old_x, old_y: old_y, new_x: x, new_y: y, lock: true
                        }, this, function () { });
                    }
                    else {
                        this.showMessage(_("Wilds cannot be repositioned to create a pattern, except for an Instant Win pattern with 5 Wilds"), "error");
                    }
                }
                else {
                    this.showMessage(_("Select a Wild to reposition it, or click 'Finish Turn'"), "error");
                }
            }
            else if (this.checkAction('placeWild')) {
                if (square.classList.contains('possibleMove')) {
                    this.addTokenOutline(parseInt(x), parseInt(y));
                    this.ajaxcall("/".concat(this.game_name, "/").concat(this.game_name, "/placeWild.html"), {
                        x: x,
                        y: y,
                        lock: true
                    }, this, function () { });
                }
                else {
                    this.showMessage(_("Wilds cannot be placed in any of the 8 tiles directly surrounding another Wild during initial placement"), "error");
                }
            }
        };
        RivalX.prototype.onselectToken = function (evt) {
            evt.preventDefault();
            if (!(evt.currentTarget instanceof HTMLElement))
                throw new Error('evt.currentTarget is null! Make sure that this function is being connected to a DOM HTMLElement.');
            if (this.checkAction('placeToken', true)) {
                this.showMessage(_("An X-piece is already placed here"), "error");
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
                        for (var wild_id in this.wildsPossibleMoves) {
                            if (token.classList.contains("wild_".concat(wild_id))) {
                                var possibleMoves = this.wildsPossibleMoves[wild_id];
                                if (possibleMoves === undefined) {
                                    throw new Error("when trying to get possible moves index was undefined");
                                }
                                this.updatePossibleMoves(possibleMoves, 'moveWild');
                                break;
                            }
                        }
                    }
                }
                else {
                    this.showMessage(_("This X-piece cannot be selected; only Wilds used in the pattern can be repositioned"), "error");
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
            this.notifqueue.setSynchronous('playToken', 500);
            dojo.subscribe('moveWild', this, "notif_moveWild");
            this.notifqueue.setSynchronous('moveWild', 500);
            dojo.subscribe('newScores', this, "notif_newScores");
            this.notifqueue.setSynchronous('newScores', 300);
            dojo.subscribe('scorePattern', this, "notif_scorePattern");
            this.notifqueue.setSynchronous('scorePattern', 2000);
            dojo.subscribe('removeTokens', this, "notif_removeTokens");
            this.notifqueue.setSynchronous('removeTokens', 500);
            dojo.subscribe('markSelectableTokens', this, "notif_markSelectableTokens");
            this.notifqueue.setSynchronous('markSelectableTokens', 200);
            dojo.subscribe('blockadeWin', this, "notif_blockadeWin");
            this.notifqueue.setSynchronous('blockadeWin', 5000);
            dojo.subscribe('instantWin', this, "notif_instantWin");
            this.notifqueue.setSynchronous('instantWin', 5000);
            dojo.subscribe('pointsWin', this, "notif_pointsWin");
            this.notifqueue.setSynchronous('pointsWin', 5000);
        };
        RivalX.prototype.notif_playToken = function (notif) {
            this.addTokenOnBoard(notif.args.x, notif.args.y, notif.args.player_id, false);
            var id = notif.args.player_id;
            if (id > RivalX.MAX_WILDS && id !== undefined) {
                var tokenCounter = this.remainingTokensCounter[id];
                tokenCounter.incValue(-1);
                this.addLastPlayedToBoard(notif.args.x, notif.args.y, notif.args.lastPlayed);
                this.clearTokenOutline();
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
            this.slideToObject("token_".concat(notif.args.old_x, "_").concat(notif.args.old_y), "square_".concat(notif.args.new_x, "_").concat(notif.args.new_y)).play();
            var token = $("token_".concat(notif.args.old_x, "_").concat(notif.args.old_y));
            if (token === null) {
                throw new Error("When moving a wild somehow a token reference became null");
            }
            token.id = "token_".concat(notif.args.new_x, "_").concat(notif.args.new_y);
            this.removeSelectable(notif.args.new_x, notif.args.new_y);
            this.addLastPlayedToBoard(notif.args.new_x, notif.args.new_y, this.getActivePlayerId());
            this.clearTokenOutline();
        };
        RivalX.prototype.notif_removeTokens = function (notif) {
            var _this = this;
            notif.args.forEach(function (token_pos) {
                var token = $("token_".concat(token_pos.x, "_").concat(token_pos.y));
                if (token === null) {
                    throw new Error("Error: token does not exist in notif_removeTokens");
                }
                _this.slideToObjectAndDestroy(token, "overall_player_board_".concat(token_pos.player_id));
                _this.remainingTokensCounter[parseInt(token_pos.player_id)].incValue(1);
            });
            notif.args.forEach(function (scoretile_pos) {
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
        };
        RivalX.prototype.notif_markSelectableTokens = function (notif) {
            var _this = this;
            notif.args.forEach(function (token_pos) {
                _this.markSelectableToken(token_pos.x, token_pos.y);
            });
        };
        RivalX.prototype.notif_scorePattern = function (notif) {
            this.addPatternOnBoard(notif.args.patternCode, notif.args.x, notif.args.y, notif.args.player_id);
        };
        RivalX.prototype.notif_pointsWin = function () {
            console.log("Win by points!");
        };
        RivalX.prototype.notif_blockadeWin = function () {
            console.log("blockade win!");
        };
        RivalX.prototype.notif_instantWin = function () {
            this.clearSelectable();
            document.querySelectorAll('.tokencolor_0').forEach(function (element, index) {
                element.classList.add('instant_win');
                var html_element = element;
                html_element.style.animationDelay = "".concat(index * 1, "s");
            });
            playSound('rivalx_instant_win_sound');
        };
        RivalX.MAX_WILDS = 5;
        return RivalX;
    }(Gamegui));
    dojo.setObject("bgagame.rivalx", RivalX);
});
